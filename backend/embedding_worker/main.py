"""
Embedding Worker – Biz Stratosphere Phase 5
Port: 8004
Responsibilities:
  - Accept raw text documents for chunking + embedding
  - Write embeddings to PostgreSQL pgvector table
  - Use Ollama nomic-embed-text with retry backoff
  - Expose /health and /ready probes
"""
from __future__ import annotations

import os
import sys
import logging
import time
from typing import Optional

import asyncpg
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from pathlib import Path

# Dynamic path to root for 'shared' imports
sys.path.insert(0, str(Path(__file__).parent.parent))
from shared import (  # noqa: E402
    make_health_router,
    make_exception_handlers,
    make_ollama_client,
    retry_with_backoff,
)
from shared.metrics import get_or_create_metrics, make_metrics_router  # noqa: E402
from shared.tracing import init_tracer, make_traces_router  # noqa: E402

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s - %(message)s")
logger = logging.getLogger("embedding-worker")

DATABASE_URL = os.getenv("DATABASE_URL", "")
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://ollama:11434")
EMBED_MODEL = os.getenv("EMBED_MODEL", "nomic-embed-text")
CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", "512"))
CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", "64"))

_pool: Optional[asyncpg.Pool] = None


async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(dsn=DATABASE_URL, min_size=1, max_size=5, command_timeout=5.0)
    return _pool


# ──────────────────────────────────────────────
# App
# ──────────────────────────────────────────────
app = FastAPI(title="Embedding Worker", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


async def _readiness_check():
    # Check Ollama reachable
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(3.0)) as client:
            r = await client.get(f"{OLLAMA_HOST}/api/tags")
            if not r.is_success:
                raise RuntimeError(f"Ollama not available: {r.status_code}")
    except Exception as exc:
        logger.warning(f"Ollama readiness check failed (non-fatal): {exc}")
        return {"ollama": "unreachable", "degraded": True}
    # Check DB
    if DATABASE_URL:
        try:
            pool = await get_pool()
            async with pool.acquire() as conn:
                await conn.fetchval("SELECT 1")
        except Exception as exc:
            logger.warning(f"DB readiness check failed (non-fatal): {exc}")
            return {"ollama": OLLAMA_HOST, "embed_model": EMBED_MODEL, "database": "unreachable", "degraded": True}
    return {"ollama": OLLAMA_HOST, "embed_model": EMBED_MODEL}


app.include_router(make_health_router("embedding-worker", version="1.0.0", readiness_check=_readiness_check))

# Phase 6: Metrics + Tracing
metrics = get_or_create_metrics("embedding_worker")
tracer = init_tracer("embedding-worker")
app.include_router(make_metrics_router(metrics))
app.include_router(make_traces_router())

for exc_type, handler in make_exception_handlers("embedding-worker"):
    app.add_exception_handler(exc_type, handler)


@app.on_event("startup")
async def startup():
    if DATABASE_URL:
        try:
            await get_pool()
            logger.info("Database pool initialised successfully.")
        except Exception as exc:
            logger.warning(f"Could not initialise DB pool on startup (will retry on first request): {exc}")

@app.on_event("shutdown")
async def shutdown():
    if _pool:
        await _pool.close()


# ──────────────────────────────────────────────
# Chunking
# ──────────────────────────────────────────────
def _chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    """Simple sliding-window word chunker."""
    words = text.split()
    chunks = []
    step = max(1, chunk_size - overlap)
    for i in range(0, len(words), step):
        chunk = " ".join(words[i : i + chunk_size])
        if chunk:
            chunks.append(chunk)
    return chunks


# ──────────────────────────────────────────────
# Embedding helper
# ──────────────────────────────────────────────
async def _embed_text(text: str) -> list[float]:
    async def _call():
        async with make_ollama_client(OLLAMA_HOST) as client:
            r = await client.post("/api/embeddings", json={"model": EMBED_MODEL, "prompt": text})
            r.raise_for_status()
            return r.json()["embedding"]

    return await retry_with_backoff(
        _call,
        max_attempts=4,
        base_delay=1.0,
        max_delay=10.0,
        retryable_exceptions=(httpx.TimeoutException, httpx.ConnectError),
    )


# ──────────────────────────────────────────────
# Schemas
# ──────────────────────────────────────────────
class IngestRequest(BaseModel):
    text: str
    source: Optional[str] = "manual"
    metadata: Optional[dict] = None


class IngestResponse(BaseModel):
    success: bool = True
    chunks_embedded: int
    latency_ms: float


# ──────────────────────────────────────────────
# Endpoints
# ──────────────────────────────────────────────
@app.post("/api/v1/embed", response_model=IngestResponse)
async def embed_and_store(req: IngestRequest):
    """Chunk, embed, and persist a document to pgvector."""
    start = time.monotonic()
    with tracer.span("embed.ingest", attributes={"source": req.source or "manual", "text_len": len(req.text)}) as root_span:
        chunks = _chunk_text(req.text)
        if not chunks:
            raise HTTPException(status_code=422, detail="No chunks produced from text")

        root_span.set_attribute("chunk_count", len(chunks))
        meta = {**(req.metadata or {}), "source": req.source}
        embedded = 0

        for i, chunk in enumerate(chunks):
            try:
                with tracer.span(f"embed.chunk_{i}", attributes={"chunk_len": len(chunk), "model": EMBED_MODEL}):
                    embed_start = time.monotonic()
                    vec = await _embed_text(chunk)
                    metrics.embedding_latency.observe(time.monotonic() - embed_start, model=EMBED_MODEL)
            except Exception as exc:
                root_span.set_error(exc)
                logger.error(f"Embedding failed for chunk: {exc}")
                raise HTTPException(status_code=502, detail=f"Ollama embedding error: {exc}")

            vec_literal = f"[{','.join(str(v) for v in vec)}]"
            try:
                pool = await get_pool()
                async with pool.acquire() as conn:
                    await conn.execute(
                        """
                        INSERT INTO documents (content, embedding, metadata)
                        VALUES ($1, $2::vector, $3::jsonb)
                        """,
                        chunk,
                        vec_literal,
                        str(meta),
                    )
                embedded += 1
            except asyncpg.PostgresError as exc:
                root_span.set_error(exc)
                logger.error(f"DB insert failed: {exc}")
                raise HTTPException(status_code=503, detail=f"Database write error: {exc}")

        latency_s = time.monotonic() - start
        latency_ms = round(latency_s * 1000, 1)
        root_span.set_attribute("chunks_embedded", embedded)
        root_span.set_attribute("total_latency_ms", latency_ms)
        logger.info(f"Embedded {embedded} chunks from '{req.source}' in {latency_ms}ms")

        return IngestResponse(chunks_embedded=embedded, latency_ms=latency_ms)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8004)
