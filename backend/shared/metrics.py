"""
Prometheus Metrics – Biz Stratosphere Phase 6
Shared metrics factory for all microservices.

Usage:
    from shared.metrics import make_metrics_middleware, make_metrics_endpoint

    metrics = ServiceMetrics("api-gateway")
    app.add_middleware(BaseHTTPMiddleware, dispatch=metrics.middleware)
    app.include_router(make_metrics_endpoint())
"""
from __future__ import annotations

import time
import logging

from fastapi import APIRouter, Request, Response

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────
# Lightweight in-process metrics store
# (No dependency on prometheus_client – works everywhere)
# ──────────────────────────────────────────────
class Counter:
    """Thread-safe counter."""
    def __init__(self, name: str, description: str, labels: list[str] | None = None):
        self.name = name
        self.description = description
        self._labels = labels or []
        self._values: dict[tuple, float] = {}

    def inc(self, amount: float = 1.0, **labels) -> None:
        key = tuple(labels.get(label, "") for label in self._labels)
        self._values[key] = self._values.get(key, 0) + amount

    def collect(self) -> list[dict]:
        return [
            {"name": self.name, "labels": dict(zip(self._labels, k)), "value": v}
            for k, v in self._values.items()
        ]


class Histogram:
    """Simple histogram with configurable buckets."""
    DEFAULT_BUCKETS = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0, 30.0, 60.0]

    def __init__(self, name: str, description: str, labels: list[str] | None = None,
                 buckets: list[float] | None = None):
        self.name = name
        self.description = description
        self._labels = labels or []
        self._buckets = buckets or self.DEFAULT_BUCKETS
        self._observations: dict[tuple, list[float]] = {}

    def observe(self, value: float, **labels) -> None:
        key = tuple(labels.get(label, "") for label in self._labels)
        self._observations.setdefault(key, []).append(value)

    def collect(self) -> list[dict]:
        results = []
        for key, obs in self._observations.items():
            obs_sorted = sorted(obs)
            count = len(obs_sorted)
            total = sum(obs_sorted)
            bucket_counts = {}
            for b in self._buckets:
                bucket_counts[b] = sum(1 for o in obs_sorted if o <= b)
            bucket_counts[float("inf")] = count
            results.append({
                "name": self.name,
                "labels": dict(zip(self._labels, key)),
                "count": count,
                "sum": round(total, 6),
                "buckets": bucket_counts,
                "p50": obs_sorted[count // 2] if count else 0,
                "p95": obs_sorted[int(count * 0.95)] if count else 0,
                "p99": obs_sorted[int(count * 0.99)] if count else 0,
            })
        return results


# ──────────────────────────────────────────────
# Service Metrics Registry
# ──────────────────────────────────────────────
class ServiceMetrics:
    """Pre-configured metrics set for a single microservice."""

    def __init__(self, service_name: str):
        self.service_name = service_name

        # Counters
        self.request_count = Counter(
            f"{service_name}_request_total",
            "Total HTTP requests",
            labels=["method", "endpoint", "status"],
        )
        self.error_count = Counter(
            f"{service_name}_error_total",
            "Total error responses (4xx/5xx)",
            labels=["method", "endpoint", "status"],
        )

        # Histograms
        self.request_latency = Histogram(
            f"{service_name}_request_duration_seconds",
            "Request latency in seconds",
            labels=["method", "endpoint"],
        )

        # Domain-specific histograms (service fills these as needed)
        self.ml_inference_latency = Histogram(
            f"{service_name}_ml_inference_seconds",
            "ML model inference latency",
            labels=["model"],
        )
        self.rag_retrieval_latency = Histogram(
            f"{service_name}_rag_retrieval_seconds",
            "RAG retrieval latency",
            labels=["query_type"],
        )
        self.llm_generation_latency = Histogram(
            f"{service_name}_llm_generation_seconds",
            "LLM generation latency",
            labels=["model"],
        )
        self.embedding_latency = Histogram(
            f"{service_name}_embedding_seconds",
            "Embedding generation latency",
            labels=["model"],
        )
        self.cache_hit_total = Counter(
            f"{service_name}_cache_hit_total",
            "Total cache hits",
            labels=["cache_type"],
        )
        self.cache_miss_total = Counter(
            f"{service_name}_cache_miss_total",
            "Total cache misses",
            labels=["cache_type"],
        )
        self.cache_latency_seconds = Histogram(
            f"{service_name}_cache_latency_seconds",
            "Cache lookup latency",
            labels=["cache_type"],
        )

        self._all = [
            self.request_count, self.error_count,
            self.request_latency, self.ml_inference_latency,
            self.rag_retrieval_latency, self.llm_generation_latency,
            self.embedding_latency,
            self.cache_hit_total, self.cache_miss_total, self.cache_latency_seconds,
        ]

    async def middleware(self, request: Request, call_next) -> Response:
        """FastAPI middleware to auto-record request metrics."""
        start = time.monotonic()
        response = await call_next(request)
        elapsed = time.monotonic() - start
        endpoint = request.url.path
        method = request.method
        status = str(response.status_code)

        self.request_count.inc(method=method, endpoint=endpoint, status=status)
        self.request_latency.observe(elapsed, method=method, endpoint=endpoint)

        if response.status_code >= 400:
            self.error_count.inc(method=method, endpoint=endpoint, status=status)

        return response

    def collect_all(self) -> dict:
        """Collect all metrics in a JSON-friendly format."""
        result = {}
        for metric in self._all:
            collected = metric.collect()
            if collected:
                result[metric.name] = collected
        return result

    def to_prometheus_text(self) -> str:
        """Export in Prometheus text exposition format."""
        lines: list[str] = []
        for metric in self._all:
            if isinstance(metric, Counter):
                lines.append(f"# HELP {metric.name} {metric.description}")
                lines.append(f"# TYPE {metric.name} counter")
                for entry in metric.collect():
                    label_str = ",".join(f'{k}="{v}"' for k, v in entry["labels"].items())
                    lines.append(f'{metric.name}{{{label_str}}} {entry["value"]}')
            elif isinstance(metric, Histogram):
                lines.append(f"# HELP {metric.name} {metric.description}")
                lines.append(f"# TYPE {metric.name} histogram")
                for entry in metric.collect():
                    label_str = ",".join(f'{k}="{v}"' for k, v in entry["labels"].items())
                    for bucket_le, count in entry["buckets"].items():
                        le_str = "+Inf" if bucket_le == float("inf") else str(bucket_le)
                        lines.append(f'{metric.name}_bucket{{{label_str},le="{le_str}"}} {count}')
                    lines.append(f'{metric.name}_sum{{{label_str}}} {entry["sum"]}')
                    lines.append(f'{metric.name}_count{{{label_str}}} {entry["count"]}')
        return "\n".join(lines) + "\n"


# ──────────────────────────────────────────────
# FastAPI Router factory
# ──────────────────────────────────────────────
def make_metrics_router(metrics: ServiceMetrics) -> APIRouter:
    """Return an APIRouter with /metrics endpoint in Prometheus format."""
    router = APIRouter(tags=["Observability"])

    @router.get("/metrics", summary="Prometheus metrics")
    async def prometheus_metrics():
        return Response(
            content=metrics.to_prometheus_text(),
            media_type="text/plain; version=0.0.4; charset=utf-8",
        )

    @router.get("/metrics/json", summary="Metrics in JSON format")
    async def json_metrics():
        return metrics.collect_all()

    return router


# ──────────────────────────────────────────────
# Global registry
# ──────────────────────────────────────────────
_service_metrics: dict[str, ServiceMetrics] = {}


def get_or_create_metrics(service_name: str) -> ServiceMetrics:
    if service_name not in _service_metrics:
        _service_metrics[service_name] = ServiceMetrics(service_name)
    return _service_metrics[service_name]
