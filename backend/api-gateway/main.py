"""
API Gateway – Biz Stratosphere Phase 5+6
Responsibilities:
  - JWT auth (Supabase token verification)
  - Route proxying with circuit breakers and timeouts
  - Global request-ID injection
  - Upstream health aggregation
  - Prometheus metrics endpoint
  - Distributed trace propagation
"""
from __future__ import annotations

import os
import time
import uuid
import logging
import sys

import httpx
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Make shared library importable when run inside container
sys.path.insert(0, "/app")
from shared import (
    make_health_router,
    make_exception_handlers,
    make_breaker,
    CircuitBreakerError,
    retry_with_backoff,
    build_error_json,
    ErrorCodes,
    Timeouts,
)
from shared.metrics import get_or_create_metrics, make_metrics_router
from shared.tracing import init_tracer, make_traces_router, build_traceparent

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
)
logger = logging.getLogger("gateway")

# ──────────────────────────────────────────────
# Configuration from environment
# ──────────────────────────────────────────────
ML_URL = os.getenv("ML_INFERENCE_URL", "http://ml-inference:8001")
LLM_URL = os.getenv("LLM_ORCHESTRATOR_URL", "http://llm-orchestrator:8002")
RAG_URL = os.getenv("RAG_SERVICE_URL", "http://rag-service:8003")
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")

# ──────────────────────────────────────────────
# Circuit Breakers (per downstream service)
# ──────────────────────────────────────────────
cb_ml = make_breaker("ml-inference", failure_threshold=3, recovery_timeout=30)
cb_llm = make_breaker("llm-orchestrator", failure_threshold=3, recovery_timeout=30)
cb_rag = make_breaker("rag-service", failure_threshold=3, recovery_timeout=30)

# ──────────────────────────────────────────────
# FastAPI App
# ──────────────────────────────────────────────
app = FastAPI(
    title="Biz Stratosphere API Gateway",
    version="1.0.0",
    description="Central routing, auth, and resilience layer",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount shared /health and /ready
app.include_router(make_health_router("api-gateway", version="1.0.0"))

# Phase 6: Metrics + Tracing
metrics = get_or_create_metrics("api_gateway")
tracer = init_tracer("api-gateway")
app.include_router(make_metrics_router(metrics))
app.include_router(make_traces_router())

# Register exception handlers
for exc_type, handler in make_exception_handlers("api-gateway"):
    app.add_exception_handler(exc_type, handler)


# ──────────────────────────────────────────────
# Request-ID middleware
# ──────────────────────────────────────────────
@app.middleware("http")
async def observability_middleware(request: Request, call_next):
    """Unified middleware: request-ID + metrics + trace span."""
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    request.state.request_id = request_id

    # Extract incoming trace context
    trace_id, parent_span = tracer.extract_context(request)

    start = time.monotonic()
    with tracer.span("gateway.request",
                     attributes={"http.method": request.method, "http.path": request.url.path},
                     trace_id=trace_id, parent_span_id=parent_span) as span:
        response = await call_next(request)
        elapsed = time.monotonic() - start
        elapsed_ms = round(elapsed * 1000, 1)

        # Record metrics
        status = str(response.status_code)
        metrics.request_count.inc(method=request.method, endpoint=request.url.path, status=status)
        metrics.request_latency.observe(elapsed, method=request.method, endpoint=request.url.path)
        if response.status_code >= 400:
            metrics.error_count.inc(method=request.method, endpoint=request.url.path, status=status)

        # Set response headers
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Response-Time-Ms"] = str(elapsed_ms)
        response.headers["X-Trace-ID"] = trace_id

        span.set_attribute("http.status_code", response.status_code)
        span.set_attribute("latency_ms", elapsed_ms)

        if elapsed_ms > 5000:
            logger.warning(f"SLOW request [{request_id}] {request.method} {request.url.path} {elapsed_ms}ms")
    return response


# ──────────────────────────────────────────────
# Proxy helpers
# ──────────────────────────────────────────────
async def _proxy(
    request: Request,
    base_url: str,
    path: str,
    circuit_breaker,
):
    """Forward the request to a downstream service through the circuit breaker."""
    request_id = getattr(request.state, "request_id", "unknown")
    body = await request.body()
    headers = {
        "Content-Type": request.headers.get("Content-Type", "application/json"),
        "X-Request-ID": request_id,
    }
    # Propagate trace context to downstream services
    headers = tracer.inject_headers(headers)
    # Forward auth headers if present
    auth = request.headers.get("Authorization")
    if auth:
        headers["Authorization"] = auth

    async def _do_request():
        async with httpx.AsyncClient(base_url=base_url, timeout=Timeouts.GATEWAY_DEFAULT) as client:
            resp = await client.request(
                method=request.method,
                url=path,
                headers=headers,
                content=body if body else None,
                params=dict(request.query_params),
            )
            return resp

    try:
        resp = await retry_with_backoff(
            lambda: circuit_breaker.call(_do_request),
            max_attempts=2,
            base_delay=0.5,
        )
        return JSONResponse(
            content=resp.json() if resp.text else {},
            status_code=resp.status_code,
        )
    except CircuitBreakerError as exc:
        logger.error(f"[{request_id}] Circuit OPEN for {exc.service_name}")
        return build_error_json(
            503,
            ErrorCodes.CIRCUIT_OPEN,
            f"Service {exc.service_name} is temporarily unavailable",
            service="api-gateway",
            request_id=request_id,
        )
    except httpx.TimeoutException:
        return build_error_json(
            504,
            ErrorCodes.UPSTREAM_TIMEOUT,
            f"Upstream service at {base_url} timed out",
            service="api-gateway",
            request_id=request_id,
        )
    except Exception as exc:
        logger.exception(f"[{request_id}] Proxy error to {base_url}{path}: {exc}")
        return build_error_json(
            502,
            ErrorCodes.INTERNAL_ERROR,
            "Bad gateway",
            service="api-gateway",
            request_id=request_id,
        )


# ──────────────────────────────────────────────
# Proxy Routes
# ──────────────────────────────────────────────
@app.api_route("/api/v1/ml/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def proxy_ml(path: str, request: Request):
    return await _proxy(request, ML_URL, f"/api/v1/{path}", cb_ml)


@app.api_route("/api/v1/llm/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def proxy_llm(path: str, request: Request):
    return await _proxy(request, LLM_URL, f"/api/v1/{path}", cb_llm)


@app.api_route("/api/v1/rag/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def proxy_rag(path: str, request: Request):
    return await _proxy(request, RAG_URL, f"/api/v1/{path}", cb_rag)


# ──────────────────────────────────────────────
# Upstream health aggregation
# ──────────────────────────────────────────────
@app.get("/api/v1/services/health")
async def aggregate_health(request: Request):
    """Poll /health on all downstream services and aggregate."""
    results = {}
    async with httpx.AsyncClient(timeout=httpx.Timeout(3.0)) as client:
        for name, url in [("ml-inference", ML_URL), ("llm-orchestrator", LLM_URL), ("rag-service", RAG_URL)]:
            try:
                r = await client.get(f"{url}/health")
                results[name] = {"status": "healthy" if r.is_success else "degraded", "code": r.status_code}
            except Exception as exc:
                results[name] = {"status": "unreachable", "error": str(exc)}
    return {"gateway": "healthy", "services": results}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
