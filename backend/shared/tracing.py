"""
OpenTelemetry Distributed Tracing – Biz Stratosphere Phase 6
Shared tracing setup for all microservices.

Usage:
    from shared.tracing import init_tracer, trace_span, inject_trace_headers

    init_tracer("api-gateway")

    async def my_endpoint():
        with trace_span("process_request", {"user_id": "123"}) as span:
            result = do_work()
            span.set_attribute("result.count", len(result))
"""
from __future__ import annotations

import time
import uuid
import logging
from typing import Any, Optional
from contextlib import contextmanager

from fastapi import APIRouter, Request

logger = logging.getLogger(__name__)


# ──────────────────────────────────────────────
# Lightweight Span implementation
# (No dependency on opentelemetry SDK – portable)
# ──────────────────────────────────────────────
class Span:
    """Represents a single trace span."""

    def __init__(
        self,
        name: str,
        trace_id: str,
        span_id: str,
        parent_span_id: Optional[str] = None,
        service_name: str = "unknown",
        attributes: Optional[dict[str, Any]] = None,
    ):
        self.name = name
        self.trace_id = trace_id
        self.span_id = span_id
        self.parent_span_id = parent_span_id
        self.service_name = service_name
        self.attributes = attributes or {}
        self.start_time: float = time.time()
        self.end_time: Optional[float] = None
        self.status: str = "OK"
        self.events: list[dict] = []

    def set_attribute(self, key: str, value: Any) -> None:
        self.attributes[key] = value

    def add_event(self, name: str, attributes: Optional[dict] = None) -> None:
        self.events.append({
            "name": name,
            "timestamp": time.time(),
            "attributes": attributes or {},
        })

    def set_error(self, exc: Exception) -> None:
        self.status = "ERROR"
        self.set_attribute("error.type", type(exc).__name__)
        self.set_attribute("error.message", str(exc))

    def end(self) -> None:
        self.end_time = time.time()

    @property
    def duration_ms(self) -> float:
        end = self.end_time or time.time()
        return round((end - self.start_time) * 1000, 2)

    def to_dict(self) -> dict:
        return {
            "trace_id": self.trace_id,
            "span_id": self.span_id,
            "parent_span_id": self.parent_span_id,
            "name": self.name,
            "service": self.service_name,
            "start_time": self.start_time,
            "duration_ms": self.duration_ms,
            "status": self.status,
            "attributes": self.attributes,
            "events": self.events,
        }


# ──────────────────────────────────────────────
# Trace Context (W3C Traceparent format)
# ──────────────────────────────────────────────
TRACEPARENT_HEADER = "traceparent"
TRACE_ID_HEADER = "X-Trace-ID"
SPAN_ID_HEADER = "X-Span-ID"


def _generate_id(length: int = 16) -> str:
    return uuid.uuid4().hex[:length]


def parse_traceparent(header: Optional[str]) -> tuple[str, str]:
    """Parse W3C traceparent header: 00-{trace_id}-{parent_span_id}-{flags}"""
    if header:
        parts = header.split("-")
        if len(parts) == 4:
            return parts[1], parts[2]
    return _generate_id(32), ""


def build_traceparent(trace_id: str, span_id: str) -> str:
    """Build W3C traceparent header."""
    return f"00-{trace_id}-{span_id}-01"


# ──────────────────────────────────────────────
# Span collector (in-memory for Jaeger export)
# ──────────────────────────────────────────────
class SpanCollector:
    """Collects completed spans for export."""

    def __init__(self, max_spans: int = 10000):
        self._spans: list[dict] = []
        self._max_spans = max_spans

    def record(self, span: Span) -> None:
        self._spans.append(span.to_dict())
        if len(self._spans) > self._max_spans:
            self._spans = self._spans[-self._max_spans:]

    def get_recent(self, count: int = 100) -> list[dict]:
        return self._spans[-count:]

    def get_by_trace(self, trace_id: str) -> list[dict]:
        return [s for s in self._spans if s["trace_id"] == trace_id]

    def clear(self) -> None:
        self._spans.clear()


# Global collector
_collector = SpanCollector()


# ──────────────────────────────────────────────
# Tracer
# ──────────────────────────────────────────────
class Tracer:
    """Lightweight tracer for a single service."""

    def __init__(self, service_name: str):
        self.service_name = service_name
        self._current_trace_id: Optional[str] = None
        self._current_span_id: Optional[str] = None

    @contextmanager
    def span(self, name: str, attributes: Optional[dict] = None,
             trace_id: Optional[str] = None, parent_span_id: Optional[str] = None):
        """Create a trace span context manager."""
        tid = trace_id or self._current_trace_id or _generate_id(32)
        sid = _generate_id(16)
        parent = parent_span_id or self._current_span_id

        s = Span(
            name=name,
            trace_id=tid,
            span_id=sid,
            parent_span_id=parent,
            service_name=self.service_name,
            attributes=attributes or {},
        )

        # Set current context
        prev_trace = self._current_trace_id
        prev_span = self._current_span_id
        self._current_trace_id = tid
        self._current_span_id = sid

        try:
            yield s
        except Exception as exc:
            s.set_error(exc)
            raise
        finally:
            s.end()
            _collector.record(s)
            # Restore context
            self._current_trace_id = prev_trace
            self._current_span_id = prev_span

    def inject_headers(self, headers: Optional[dict] = None) -> dict:
        """Inject trace context into outgoing HTTP headers."""
        h = headers or {}
        if self._current_trace_id and self._current_span_id:
            h[TRACEPARENT_HEADER] = build_traceparent(
                self._current_trace_id, self._current_span_id
            )
            h[TRACE_ID_HEADER] = self._current_trace_id
            h[SPAN_ID_HEADER] = self._current_span_id
        return h

    def extract_context(self, request: Request) -> tuple[str, str]:
        """Extract trace context from incoming request headers."""
        traceparent = request.headers.get(TRACEPARENT_HEADER)
        if traceparent:
            return parse_traceparent(traceparent)
        trace_id = request.headers.get(TRACE_ID_HEADER, _generate_id(32))
        parent_span = request.headers.get(SPAN_ID_HEADER, "")
        return trace_id, parent_span


# ──────────────────────────────────────────────
# Global tracer registry
# ──────────────────────────────────────────────
_tracers: dict[str, Tracer] = {}


def init_tracer(service_name: str) -> Tracer:
    """Initialize or get a tracer for a service."""
    if service_name not in _tracers:
        _tracers[service_name] = Tracer(service_name)
        logger.info(f"[Tracing] Initialized tracer for '{service_name}'")
    return _tracers[service_name]


def get_tracer(service_name: str) -> Tracer:
    return _tracers.get(service_name, init_tracer(service_name))


def get_collector() -> SpanCollector:
    return _collector


# ──────────────────────────────────────────────
# FastAPI Router for trace inspection
# ──────────────────────────────────────────────
def make_traces_router() -> APIRouter:
    router = APIRouter(tags=["Observability"])

    @router.get("/traces/recent", summary="Recent trace spans")
    async def recent_traces(count: int = 50):
        return {"spans": _collector.get_recent(count)}

    @router.get("/traces/{trace_id}", summary="Spans by trace ID")
    async def trace_detail(trace_id: str):
        spans = _collector.get_by_trace(trace_id)
        return {"trace_id": trace_id, "span_count": len(spans), "spans": spans}

    return router
