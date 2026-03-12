"""
Shared health + readiness endpoint factory.
Biz Stratosphere Phase 5 – Every service mounts these routes at startup.
"""
from __future__ import annotations

import time
import logging
from typing import Any, Callable, Coroutine, Optional

from fastapi import APIRouter
from fastapi.responses import JSONResponse
from shared.resilience import get_all_breaker_status

logger = logging.getLogger(__name__)

_START_TIME = time.monotonic()


def make_health_router(
    service_name: str,
    version: str = "0.1.0",
    readiness_check: Optional[Callable[[], Coroutine[Any, Any, dict]]] = None,
) -> APIRouter:
    """
    Returns an APIRouter pre-wired with /health and /ready endpoints.

    Args:
        service_name: Name shown in JSON responses.
        version: Service semver string.
        readiness_check: Optional async callable that raises if not ready.
                         Must return a dict of extra context to include.
    """
    router = APIRouter(tags=["Observability"])

    @router.get("/health", summary="Liveness probe")
    async def health():
        uptime_seconds = round(time.monotonic() - _START_TIME, 1)
        return {
            "service": service_name,
            "version": version,
            "status": "healthy",
            "uptime_seconds": uptime_seconds,
            "circuit_breakers": get_all_breaker_status(),
        }

    @router.get("/ready", summary="Readiness probe")
    async def ready():
        extra: dict = {}
        if readiness_check:
            try:
                extra = await readiness_check()
            except Exception as exc:
                logger.error(f"[{service_name}] Readiness check failed: {exc}")
                return JSONResponse(
                    status_code=503,
                    content={
                        "service": service_name,
                        "status": "not_ready",
                        "reason": str(exc),
                    },
                )
        return {
            "service": service_name,
            "status": "ready",
            **extra,
        }

    return router
