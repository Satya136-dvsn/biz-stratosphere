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
ML_URL = os.getenv("ML_INFERENCE_URL", "http://localhost:8001")
LLM_URL = os.getenv("LLM_ORCHESTRATOR_URL", "http://localhost:8002")
RAG_URL = os.getenv("RAG_SERVICE_URL", "http://localhost:8003")
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")
# SUPABASE_JWT_SECRET is the HS256 signing secret from Supabase project settings.
# It must be set in production; the anon key is not a valid signing secret.
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "")
# Whether to run in local-demo mode (auth disabled). Must be explicitly opted in.
DEMO_MODE = os.getenv("DEMO_MODE", "false").lower() == "true"

_extra_origins_raw = os.getenv("ALLOWED_ORIGINS", "")
_extra_origins = [o.strip() for o in _extra_origins_raw.split(",") if o.strip()]
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:8080",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8080",
] + _extra_origins

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

# Phase 6: Metrics + Tracing
metrics = get_or_create_metrics("api_gateway")
tracer = init_tracer("api-gateway")
app.include_router(make_metrics_router(metrics))
app.include_router(make_traces_router())

# Register exception handlers
for exc_type, handler in make_exception_handlers("api-gateway"):
    app.add_exception_handler(exc_type, handler)


# ──────────────────────────────────────────────
# Custom Health (Override shared for frontend)
# ──────────────────────────────────────────────
@app.get("/health")
async def health_check():
    """Simple health check returning aggregate for compatibility with MLInsights.tsx."""
    # We hit our own aggregate endpoint logic
    res = await aggregate_health(None)
    return res


# Mount shared /health and /ready (Note: /health is already matched above)
app.include_router(make_health_router("api-gateway", version="1.0.0"))


from jose import jwt, JWTError

# ──────────────────────────────────────────────
# Auth Middleware (Phase 5)
# ──────────────────────────────────────────────
async def get_current_user(request: Request):
    """Validate Supabase JWT. Requires SUPABASE_JWT_SECRET in production."""
    if DEMO_MODE:
        # Demo/local mode: auth is explicitly disabled via DEMO_MODE=true
        logger.warning("DEMO_MODE is active – authentication is disabled")
        return {"id": "demo-user", "role": "authenticated"}

    if not SUPABASE_JWT_SECRET:
        # Fail-safe: refuse requests rather than granting open access
        logger.error(
            "SUPABASE_JWT_SECRET is not configured – rejecting request. "
            "Set DEMO_MODE=true to run without auth in local development."
        )
        raise HTTPException(status_code=503, detail="Authentication service not configured")

    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        logger.warning(f"Missing or malformed Authorization header for {request.url.path}")
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
        )
        return payload
    except JWTError as e:
        logger.warning(f"JWT Validation failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid token")


# ──────────────────────────────────────────────
# Request-ID middleware
# ──────────────────────────────────────────────
@app.middleware("http")
async def observability_middleware(request: Request, call_next):
    """Unified middleware: request-ID + metrics + trace span."""
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    request.state.request_id = request_id

    # ──────────────────────────────────────────────
    # Phase 5: Auth check for protected routes
    # ──────────────────────────────────────────────
    if request.url.path.startswith("/api/v1/llm") or request.url.path.startswith("/api/v1/ml") or request.url.path.startswith("/api/v1/rag") or request.url.path.startswith("/health"):
        # We skip auth for demo purposes if NOT configured, otherwise enforce
        if SUPABASE_URL and SUPABASE_ANON_KEY:
            # Skip auth for health check even if Supabase is configured
            if request.url.path == "/health":
                return await call_next(request)
            
            try:
                await get_current_user(request)
            except HTTPException as e:
                # Check if this is a development/local environment skip
                if os.getenv("ENV") == "development":
                    logger.debug(f"Skipping auth for {request.url.path} in development mode")
                else:
                    return JSONResponse(status_code=e.status_code, content={"detail": e.detail})

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
    """Poll downstream services and return summary for frontend."""
    results = {}
    async with httpx.AsyncClient(timeout=httpx.Timeout(2.0)) as client:
        # ML Models
        try:
            r = await client.get(f"{ML_URL}/ready")
            results["ml_models"] = {
                "status": "healthy" if r.is_success else "degraded",
                "count": r.json().get("loaded_models", 0) if r.is_success else 0
            }
        except Exception:
            results["ml_models"] = {"status": "offline", "count": 0}

        # LLM / Ollama
        try:
            r = await client.get(f"{LLM_URL}/health")
            results["ollama"] = {"status": "healthy" if r.is_success else "offline"}
        except Exception:
            results["ollama"] = {"status": "offline"}

    return {"gateway": "healthy", "services": results}




if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
