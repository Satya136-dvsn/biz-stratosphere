"""Shared reliability library for Biz Stratosphere microservices."""
from .errors import (
    ErrorResponse,
    SuccessResponse,
    ErrorDetail,
    ErrorCodes,
    build_error_response,
    build_error_json,
    make_exception_handlers,
)
from .resilience import (
    CircuitBreaker,
    CircuitBreakerError,
    CircuitState,
    retry_with_backoff,
    make_breaker,
    get_all_breaker_status,
)
from .http_client import (
    Timeouts,
    make_gateway_client,
    make_orchestrator_client,
    make_ollama_client,
    make_health_client,
)
from .health import make_health_router

__all__ = [
    "ErrorResponse", "SuccessResponse", "ErrorDetail", "ErrorCodes",
    "build_error_response", "build_error_json", "make_exception_handlers",
    "CircuitBreaker", "CircuitBreakerError", "CircuitState",
    "retry_with_backoff", "make_breaker", "get_all_breaker_status",
    "Timeouts", "make_gateway_client", "make_orchestrator_client",
    "make_ollama_client", "make_health_client",
    "make_health_router",
]
