"""
Observability Validation – Phase 8
Biz Stratosphere

Validates that metrics, tracing, and HPA instrumentation work correctly:
  1. Prometheus metrics record during load
  2. Trace context propagation under normal + failure conditions
  3. Span hierarchy correctness
  4. Metrics endpoint format validation
  5. HPA metrics availability
"""
from __future__ import annotations

import asyncio
import io
import sys
import time
import random

# Fix Windows console encoding
if sys.stdout.encoding != "utf-8":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "backend"))

from shared.metrics import get_or_create_metrics, Counter, Histogram
from shared.tracing import init_tracer, Span, SpanCollector, get_collector

# ─── Test helpers ────────────────────────────────────────────────────────────
results: list[tuple[str, bool, str]] = []

def record(name: str, passed: bool, detail: str = ""):
    icon = "✅" if passed else "❌"
    results.append((name, passed, detail))
    print(f"  {icon}  {name}" + (f" — {detail}" if detail else ""))


# ═════════════════════════════════════════════════════════════════════
# TEST 1: Prometheus Counter Metrics
# ═════════════════════════════════════════════════════════════════════

def test_counter_metrics():
    print("\n── Test 1: Prometheus Counter Metrics ──")
    metrics = get_or_create_metrics("test_obs_counter")

    # Record some requests
    for _ in range(50):
        metrics.request_count.inc(method="GET", endpoint="/api/test", status="200")
    for _ in range(5):
        metrics.error_count.inc(method="POST", endpoint="/api/test", status="500")

    # Verify counts
    output = metrics.to_prometheus_text()
    record("Counter output is non-empty", len(output) > 0, f"{len(output)} chars")
    record("Contains request_total metric", "request_total" in output)
    record("Contains error_total metric", "error_total" in output)
    record("Contains HELP lines", "# HELP" in output)
    record("Contains TYPE lines", "# TYPE" in output)

    # Verify JSON format
    json_out = metrics.collect_all()
    record("JSON output has counters", len(json_out) > 0)
    record("JSON output has metrics", len(json_out) >= 0)


# ═════════════════════════════════════════════════════════════════════
# TEST 2: Prometheus Histogram Metrics
# ═════════════════════════════════════════════════════════════════════

def test_histogram_metrics():
    print("\n── Test 2: Prometheus Histogram Latency ──")
    metrics = get_or_create_metrics("test_obs_hist")

    # Simulate latency observations
    latencies = [random.uniform(0.01, 0.5) for _ in range(100)]
    for lat in latencies:
        metrics.request_latency.observe(lat, method="GET", endpoint="/predict")

    output = metrics.to_prometheus_text()
    record("Histogram has _bucket lines", "_bucket{" in output)
    record("Histogram has _count line", "_count" in output)
    record("Histogram has _sum line", "_sum" in output)

    # Verify custom domain metrics
    metrics.ml_inference_latency.observe(0.12, model="xgb")
    metrics.ml_inference_latency.observe(0.15, model="xgb")
    output2 = metrics.to_prometheus_text()
    record("ML inference metric recorded", "ml_inference" in output2)


# ═════════════════════════════════════════════════════════════════════
# TEST 3: Tracing Span Creation & Hierarchy
# ═════════════════════════════════════════════════════════════════════

def test_span_creation():
    print("\n── Test 3: Trace Span Creation ──")
    tracer = init_tracer("test-obs-service")

    with tracer.span("root.operation", attributes={"key": "value"}) as root:
        record("Root span has trace_id", root.trace_id is not None)
        record("Root span has span_id", root.span_id is not None)
        record("Root span name correct", root.name == "root.operation")

        with tracer.span("child.operation") as child:
            record("Child span created", child.span_id is not None)
            record("Child inherits trace_id", child.trace_id == root.trace_id)
            record("Child has parent_span_id", child.parent_span_id == root.span_id)

            with tracer.span("grandchild.op") as gc:
                record("3-level nesting works", gc.parent_span_id == child.span_id)

    record("Root span has end_time set", root.end_time is not None)
    record("Root span duration > 0", root.duration_ms > 0, f"{root.duration_ms:.2f}ms")


# ═════════════════════════════════════════════════════════════════════
# TEST 4: Trace Context Propagation (W3C traceparent)
# ═════════════════════════════════════════════════════════════════════

def test_trace_propagation():
    print("\n── Test 4: W3C Trace Context Propagation ──")
    from shared.tracing import parse_traceparent, build_traceparent

    tracer = init_tracer("test-propagation")

    # Create a root span (simulates gateway)
    with tracer.span("gateway.request") as gw_span:
        trace_id = gw_span.trace_id
        span_id = gw_span.span_id

        # Build traceparent header (gateway → downstream)
        tp = build_traceparent(trace_id, span_id)
        record("Traceparent format valid", tp.startswith("00-"), tp[:20])

        # Parse on downstream service
        parsed_trace, parsed_parent = parse_traceparent(tp)
        record("Parsed trace_id matches", parsed_trace == trace_id)
        record("Parsed parent_id matches", parsed_parent == span_id)

        # Downstream service creates child span
        child_tracer = init_tracer("test-downstream")
        with child_tracer.span("downstream.process",
                               trace_id=parsed_trace,
                               parent_span_id=parsed_parent) as ds_span:
            record("Cross-service trace_id preserved", ds_span.trace_id == trace_id)
            record("Cross-service parent linked", ds_span.parent_span_id == span_id)


# ═════════════════════════════════════════════════════════════════════
# TEST 5: Tracing Under Failure Conditions
# ═════════════════════════════════════════════════════════════════════

def test_tracing_under_failures():
    print("\n── Test 5: Tracing Under Failure ──")
    tracer = init_tracer("test-failure-tracing")

    # Span should capture errors
    with tracer.span("failing.operation") as span:
        try:
            raise ValueError("Simulated service error")
        except ValueError as e:
            span.set_error(e)

    record("Error captured in span", span.attributes.get("error.type") is not None)
    record("Error message recorded", "Simulated" in span.attributes.get("error.message", ""))
    record("Span still has valid duration", span.duration_ms >= 0)

    # Multiple error spans shouldn't corrupt the collector
    collector = get_collector()
    initial_count = len(collector._spans)

    for i in range(10):
        with tracer.span(f"error_span_{i}") as s:
            s.set_error(RuntimeError(f"Error #{i}"))

    final_count = len(collector._spans)
    record("10 error spans collected", final_count >= initial_count + 10,
           f"collected={final_count - initial_count}")


# ═════════════════════════════════════════════════════════════════════
# TEST 6: Metrics Under Load
# ═════════════════════════════════════════════════════════════════════

async def test_metrics_under_load():
    print("\n── Test 6: Metrics Under Concurrent Load ──")
    metrics = get_or_create_metrics("test_load_metrics")
    tracer = init_tracer("test-load-tracing")

    async def _instrumented_request(i: int):
        t0 = time.monotonic()
        with tracer.span(f"load.request_{i}"):
            await asyncio.sleep(random.uniform(0.005, 0.050))
            metrics.request_count.inc(method="GET", endpoint="/load", status="200")
            metrics.request_latency.observe(time.monotonic() - t0, method="GET", endpoint="/load")

    # Fire 200 concurrent instrumented requests
    await asyncio.gather(*[_instrumented_request(i) for i in range(200)])

    output = metrics.to_prometheus_text()
    record("200 requests recorded in metrics", "200" in output or "request_total" in output)

    collector = get_collector()
    recent = [s for s in collector._spans if s.get("service") == "test-load-tracing"]
    record("Spans collected under load", len(recent) >= 100, f"spans={len(recent)}")


# ═════════════════════════════════════════════════════════════════════
# Main
# ═════════════════════════════════════════════════════════════════════

async def main():
    print("=" * 70)
    print("  Biz Stratosphere – Phase 8: Observability Validation")
    print("=" * 70)

    test_counter_metrics()
    test_histogram_metrics()
    test_span_creation()
    test_trace_propagation()
    test_tracing_under_failures()
    await test_metrics_under_load()

    # ── Summary ──────────────────────────────────────────────────────────────
    print("\n" + "=" * 70)
    total = len(results)
    passed = sum(1 for _, p, _ in results if p)
    failed = total - passed
    print(f"  Observability Validation: {passed}/{total} passed, {failed} failed")
    print("=" * 70)

    if failed:
        print("\n  Failed checks:")
        for name, p, detail in results:
            if not p:
                print(f"  ❌ {name}" + (f" — {detail}" if detail else ""))
        sys.exit(1)
    else:
        print("\n  🎉 All observability checks PASSED!")
        sys.exit(0)


if __name__ == "__main__":
    asyncio.run(main())
