"""Shared reliability + observability library for Biz Stratosphere microservices."""
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
from .metrics import (
    ServiceMetrics,
    get_or_create_metrics,
    make_metrics_router,
)
from .tracing import (
    Tracer,
    Span,
    SpanCollector,
    init_tracer,
    get_tracer,
    get_collector,
    make_traces_router,
)

__all__ = [
    # Errors
    "ErrorResponse", "SuccessResponse", "ErrorDetail", "ErrorCodes",
    "build_error_response", "build_error_json", "make_exception_handlers",
    # Resilience
    "CircuitBreaker", "CircuitBreakerError", "CircuitState",
    "retry_with_backoff", "make_breaker", "get_all_breaker_status",
    # HTTP Client
    "Timeouts", "make_gateway_client", "make_orchestrator_client",
    "make_ollama_client", "make_health_client",
    # Health
    "make_health_router",
    # Metrics (Phase 6)
    "ServiceMetrics", "get_or_create_metrics", "make_metrics_router",
    # Tracing (Phase 6)
    "Tracer", "Span", "SpanCollector",
    "init_tracer", "get_tracer", "get_collector", "make_traces_router",
]
