"""
LLM Orchestrator – Biz Stratosphere Phase 5
Port: 8002
Responsibilities:
  - Orchestrate RAG retrieval + ML predictions to enrich prompts
  - Send enriched prompts to Ollama for generation
  - Implement fallback: if RAG/ML fail, proceed zero-shot
  - Expose /health and /ready probes
"""
from __future__ import annotations

import os
import sys
import logging
import time
from typing import Optional

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

sys.path.insert(0, "/app")
from shared import (
    make_health_router,
    make_exception_handlers,
    make_breaker,
    make_orchestrator_client,
    make_ollama_client,
    CircuitBreakerError,
    retry_with_backoff,
    ErrorCodes,
    Timeouts,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s - %(message)s")
logger = logging.getLogger("llm-orchestrator")

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://ollama:11434")
RAG_URL = os.getenv("RAG_SERVICE_URL", "http://rag-service:8003")
ML_URL = os.getenv("ML_INFERENCE_URL", "http://ml-inference:8001")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")

# Circuit breakers for lateral service calls
cb_rag = make_breaker("llm→rag", failure_threshold=3, recovery_timeout=30)
cb_ml = make_breaker("llm→ml", failure_threshold=3, recovery_timeout=30)

app = FastAPI(title="LLM Orchestrator", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

async def _readiness_check():
    async with httpx.AsyncClient(timeout=httpx.Timeout(3.0)) as client:
        r = await client.get(f"{OLLAMA_HOST}/api/tags")
        if not r.is_success:
            raise RuntimeError(f"Ollama unhealthy: {r.status_code}")
    return {"ollama_host": OLLAMA_HOST, "model": OLLAMA_MODEL}

app.include_router(make_health_router("llm-orchestrator", version="1.0.0", readiness_check=_readiness_check))
for exc_type, handler in make_exception_handlers("llm-orchestrator"):
    app.add_exception_handler(exc_type, handler)


# ──────────────────────────────────────────────
# Schemas
# ──────────────────────────────────────────────
class GenerateRequest(BaseModel):
    query: str
    user_id: Optional[str] = None
    include_rag: bool = True
    include_ml: bool = False
    ml_model: Optional[str] = None
    ml_features: Optional[list[float]] = None


class GenerateResponse(BaseModel):
    success: bool = True
    response: str
    rag_context_used: bool
    ml_context_used: bool
    latency_ms: float
    fallback_used: bool = False


# ──────────────────────────────────────────────
# Orchestration helpers
# ──────────────────────────────────────────────
async def _fetch_rag_context(query: str) -> Optional[str]:
    """Retrieve RAG context from the RAG service. Returns None on failure."""
    async def _call():
        async with make_orchestrator_client(RAG_URL, target="rag") as client:
            r = await client.post("/api/v1/retrieve", json={"query": query, "top_k": 3})
            r.raise_for_status()
            data = r.json()
            snippets = data.get("data", {}).get("snippets", [])
            return "\n\n".join(s.get("text", "") for s in snippets)

    try:
        return await cb_rag.call(_call)
    except CircuitBreakerError:
        logger.warning("[llm-orchestrator] RAG circuit OPEN – zero-shot fallback")
        return None
    except httpx.TimeoutException:
        logger.warning("[llm-orchestrator] RAG timed out after 3s – zero-shot fallback")
        return None
    except Exception as exc:
        logger.error(f"[llm-orchestrator] RAG retrieval failed: {exc}")
        return None


async def _fetch_ml_context(model: str, features: list[float]) -> Optional[str]:
    """Fetch ML prediction context. Returns None on failure."""
    async def _call():
        async with make_orchestrator_client(ML_URL, target="ml") as client:
            r = await client.post("/api/v1/predict", json={"model_name": model, "features": features})
            r.raise_for_status()
            data = r.json()
            pred = data.get("prediction")
            proba = data.get("probability")
            ctx = f"ML Prediction ({model}): {pred}"
            if proba:
                ctx += f" (confidence: {max(proba):.2%})"
            return ctx

    try:
        return await cb_ml.call(_call)
    except CircuitBreakerError:
        logger.warning("[llm-orchestrator] ML circuit OPEN – proceeding without ML context")
        return None
    except httpx.TimeoutException:
        logger.warning("[llm-orchestrator] ML timed out – proceeding without ML context")
        return None
    except Exception as exc:
        logger.error(f"[llm-orchestrator] ML context failed: {exc}")
        return None


# ──────────────────────────────────────────────
# Endpoints
# ──────────────────────────────────────────────
@app.post("/api/v1/generate", response_model=GenerateResponse)
async def generate(req: GenerateRequest):
    start = time.monotonic()
    rag_context: Optional[str] = None
    ml_context: Optional[str] = None

    # Fetch RAG context (non-blocking on failure)
    if req.include_rag:
        rag_context = await _fetch_rag_context(req.query)

    # Fetch ML prediction context (non-blocking on failure)
    if req.include_ml and req.ml_model and req.ml_features:
        ml_context = await _fetch_ml_context(req.ml_model, req.ml_features)

    # Build enriched prompt
    system_prompt = "You are Biz Stratosphere AI, a business intelligence assistant."
    user_prompt = req.query
    if rag_context:
        user_prompt = f"[Context from knowledge base]\n{rag_context}\n\n[Question]\n{req.query}"
    if ml_context:
        user_prompt += f"\n\n[ML Insight]\n{ml_context}"

    # Call Ollama
    try:
        async def _ollama_call():
            async with make_ollama_client(OLLAMA_HOST) as client:
                r = await client.post("/api/generate", json={
                    "model": OLLAMA_MODEL,
                    "prompt": user_prompt,
                    "system": system_prompt,
                    "stream": False,
                })
                r.raise_for_status()
                return r.json().get("response", "")

        generated_text = await retry_with_backoff(
            _ollama_call,
            max_attempts=2,
            base_delay=1.0,
            retryable_exceptions=(httpx.TimeoutException, httpx.ConnectError),
        )
    except httpx.TimeoutException:
        raise HTTPException(status_code=502, detail="LLM generation timed out after 60s")
    except Exception as exc:
        logger.exception(f"Ollama generation failed: {exc}")
        raise HTTPException(status_code=502, detail=f"Upstream LLM error: {exc}")

    latency_ms = round((time.monotonic() - start) * 1000, 1)
    logger.info(f"Generated response in {latency_ms}ms (rag={rag_context is not None}, ml={ml_context is not None})")

    return GenerateResponse(
        response=generated_text,
        rag_context_used=rag_context is not None,
        ml_context_used=ml_context is not None,
        latency_ms=latency_ms,
        fallback_used=(req.include_rag and rag_context is None) or (req.include_ml and ml_context is None),
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
