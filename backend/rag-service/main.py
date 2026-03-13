"""
RAG Retrieval Service – Biz Stratosphere Phase 5
Port: 8003
Responsibilities:
  - Query pgvector for semantic similarity search
  - Return ranked document snippets to callers
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

sys.path.insert(0, "/app")
from shared import (
    make_health_router,
    make_exception_handlers,
    make_ollama_client,
    retry_with_backoff,
    ErrorCodes,
    Timeouts,
)
from shared.metrics import get_or_create_metrics, make_metrics_router
from shared.tracing import init_tracer, make_traces_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s - %(message)s")
logger = logging.getLogger("rag-service")

DATABASE_URL = os.getenv("DATABASE_URL", "")
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://ollama:11434")
EMBED_MODEL = os.getenv("EMBED_MODEL", "nomic-embed-text")

# ──────────────────────────────────────────────
# DB Connection Pool
# ──────────────────────────────────────────────
_pool: Optional[asyncpg.Pool] = None


async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(
            dsn=DATABASE_URL,
            min_size=2,
            max_size=10,
            command_timeout=5.0,  # Timeout budget: DB = 5s
        )
    return _pool


# ──────────────────────────────────────────────
# App
# ──────────────────────────────────────────────
app = FastAPI(title="RAG Retrieval Service", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


async def _readiness_check():
    try:
        pool = await get_pool()
        async with pool.acquire() as conn:
            await conn.fetchval("SELECT 1")
        return {"database": "connected"}
    except Exception as exc:
        raise RuntimeError(f"DB not reachable: {exc}")


app.include_router(make_health_router("rag-service", version="1.0.0", readiness_check=_readiness_check))

# Phase 6: Metrics + Tracing
metrics = get_or_create_metrics("rag_service")
tracer = init_tracer("rag-service")
app.include_router(make_metrics_router(metrics))
app.include_router(make_traces_router())

for exc_type, handler in make_exception_handlers("rag-service"):
    app.add_exception_handler(exc_type, handler)


@app.on_event("startup")
async def startup():
    if DATABASE_URL:
        await get_pool()


@app.on_event("shutdown")
async def shutdown():
    if _pool:
        await _pool.close()


# ──────────────────────────────────────────────
# Schemas
# ──────────────────────────────────────────────
class RetrieveRequest(BaseModel):
    query: str
    top_k: int = 5
    min_score: float = 0.0


class Snippet(BaseModel):
    id: str
    text: str
    score: float
    source: Optional[str] = None


class RetrieveResponse(BaseModel):
    success: bool = True
    query: str
    snippets: list[Snippet]
    latency_ms: float


# ──────────────────────────────────────────────
# Embedding helper
# ──────────────────────────────────────────────
async def _embed(text: str) -> list[float]:
    """Generate an embedding vector via Ollama with retry backoff."""
    async def _call():
        async with make_ollama_client(OLLAMA_HOST) as client:
            r = await client.post("/api/embeddings", json={"model": EMBED_MODEL, "prompt": text})
            r.raise_for_status()
            return r.json()["embedding"]

    return await retry_with_backoff(
        _call,
        max_attempts=3,
        base_delay=0.5,
        retryable_exceptions=(httpx.TimeoutException, httpx.ConnectError),
    )


# ──────────────────────────────────────────────
# Endpoints
# ──────────────────────────────────────────────
@app.post("/api/v1/retrieve", response_model=RetrieveResponse)
async def retrieve(req: RetrieveRequest):
    start = time.monotonic()
    with tracer.span("rag.retrieve", attributes={"query_len": len(req.query), "top_k": req.top_k}) as root_span:
        try:
            with tracer.span("rag.embed_query", attributes={"model": EMBED_MODEL}):
                query_vec = await _embed(req.query)
        except Exception as exc:
            root_span.set_error(exc)
            logger.error(f"Embedding failed: {exc}")
            raise HTTPException(status_code=502, detail=f"Embedding service error: {exc}")

        vec_literal = f"[{','.join(str(v) for v in query_vec)}]"

        try:
            with tracer.span("rag.pgvector_query") as db_span:
                pool = await get_pool()
                async with pool.acquire() as conn:
                    rows = await conn.fetch(
                        """
                        SELECT id::text, content, metadata,
                               1 - (embedding <=> $1::vector) AS score
                        FROM documents
                        WHERE 1 - (embedding <=> $1::vector) >= $2
                        ORDER BY embedding <=> $1::vector
                        LIMIT $3
                        """,
                        vec_literal,
                        req.min_score,
                        req.top_k,
                    )
                db_span.set_attribute("rows_returned", len(rows))
        except asyncpg.PostgresError as exc:
            root_span.set_error(exc)
            logger.error(f"DB query failed: {exc}")
            raise HTTPException(status_code=503, detail=f"Database error: {exc}")

        snippets = [
            Snippet(
                id=row["id"],
                text=row["content"],
                score=round(float(row["score"]), 4),
                source=row["metadata"].get("source") if row["metadata"] else None,
            )
            for row in rows
        ]

        latency_s = time.monotonic() - start
        latency_ms = round(latency_s * 1000, 1)
        metrics.rag_retrieval_latency.observe(latency_s, query_type="semantic")
        root_span.set_attribute("latency_ms", latency_ms)
        root_span.set_attribute("snippet_count", len(snippets))

        if latency_ms > 3000:
            logger.warning(f"[rag-service] Retrieval slow: {latency_ms}ms")

        return RetrieveResponse(query=req.query, snippets=snippets, latency_ms=latency_ms)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)
