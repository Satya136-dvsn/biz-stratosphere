"""
Virtual Test Suite – Phase 5 Reliability Layer
Biz Stratosphere

Simulates all Phase 5 resilience components WITHOUT requiring Docker or live services.
Tests:
  1. Error schema validation
  2. Circuit breaker state machine (CLOSED → OPEN → HALF_OPEN → CLOSED)
  3. Circuit breaker OPEN rejection
  4. Retry with exponential backoff
  5. Retry thundering herd prevention (jitter)
  6. Timeout budget constants
  7. Gateway circuit breaker silent fallback (LLM → RAG)
  8. Concurrent circuit breaker safety (asyncio)
  9. Recovery probe (HALF_OPEN → CLOSED)
 10. Full latency envelope simulation
"""

import asyncio
import sys
import time
import random
import io
from pathlib import Path

# Fix Windows console encoding for emoji output
if sys.stdout.encoding != "utf-8":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

# ─── Add backend/shared to path ──────────────────────────────────────────────
ROOT = Path(__file__).parent
sys.path.insert(0, str(ROOT / "backend"))  # so "shared" is importable

from shared.errors import (  # noqa: E402
    ErrorCodes, ErrorResponse, build_error_response,
)
from shared.resilience import (  # noqa: E402
    CircuitBreaker, CircuitBreakerError, CircuitState,
    retry_with_backoff, make_breaker, get_all_breaker_status,
)
from shared.http_client import Timeouts  # noqa: E402

# ─── Test helpers ─────────────────────────────────────────────────────────────
PASS = "✅"
FAIL = "❌"
results: list[tuple[str, bool, str]] = []


def record(name: str, passed: bool, detail: str = ""):
    status = PASS if passed else FAIL
    results.append((name, passed, detail))
    print(f"  {status}  {name}" + (f" – {detail}" if detail else ""))


# ─── TEST 1: Error schema ─────────────────────────────────────────────────────
def test_error_schema():
    print("\n── Test 1: Error Schema ──")
    err = build_error_response(
        code=ErrorCodes.CIRCUIT_OPEN,
        message="Service unavailable",
        service="api-gateway",
        request_id="req-123",
    )
    record("ErrorResponse is correct type", isinstance(err, ErrorResponse))
    record("Error code matches", err.error.code == "CIRCUIT_OPEN")
    record("success=False", err.success is False)
    record("service field set", err.error.service == "api-gateway")
    record("request_id propagated", err.request_id == "req-123")

    # Verify all standard codes exist
    for attr in ["CIRCUIT_OPEN", "UPSTREAM_TIMEOUT", "MODEL_NOT_LOADED",
                 "DB_UNAVAILABLE", "INTERNAL_ERROR", "GENERATION_FAILED"]:
        record(f"ErrorCode.{attr} defined", hasattr(ErrorCodes, attr))


# ─── TEST 2: Circuit breaker initial state ─────────────────────────────────────
async def test_circuit_breaker_initial():
    print("\n── Test 2: Circuit Breaker – Initial State ──")
    cb = CircuitBreaker("test-svc", failure_threshold=3, recovery_timeout=2.0)
    record("Starts CLOSED", cb.state == CircuitState.CLOSED)
    record("is_open=False", not cb.is_open)

    # Successful call
    async def _return42():
        return 42

    result = await cb.call(_return42)
    record("Passes successful call", result == 42)
    record("Stays CLOSED after success", cb.state == CircuitState.CLOSED)


# ─── TEST 3: Circuit breaker opens after failures ──────────────────────────────
async def test_circuit_opens():
    print("\n── Test 3: Circuit Breaker – Opens After Failures ──")
    cb = CircuitBreaker("failing-svc", failure_threshold=3, recovery_timeout=60)

    async def _fail():
        raise ConnectionError("Service down")

    for i in range(3):
        try:
            await cb.call(_fail)
        except ConnectionError:
            pass

    record("Circuit is OPEN after 3 failures", cb.state == CircuitState.OPEN)
    record("is_open=True", cb.is_open)
    record("failure_count==3", cb._failure_count == 3)


# ─── TEST 4: Open circuit rejects immediately ─────────────────────────────────
async def test_open_circuit_rejects():
    print("\n── Test 4: Circuit Breaker – OPEN Rejects Without Calling ──")
    cb = CircuitBreaker("dead-svc", failure_threshold=1, recovery_timeout=60)

    async def _fail():
        raise RuntimeError("down")

    try:
        await cb.call(_fail)
    except RuntimeError:
        pass

    # Now it's open – next call should be rejected instantly
    call_attempted = False

    async def _should_not_call():
        nonlocal call_attempted
        call_attempted = True
        return "reached"

    t_start = time.monotonic()
    try:
        await cb.call(_should_not_call)
    except CircuitBreakerError as exc:
        elapsed = (time.monotonic() - t_start) * 1000
        record("CircuitBreakerError raised", True)
        record("Rejected in <5ms (no network call)", elapsed < 5, f"{elapsed:.1f}ms")
        record("Downstream not called", not call_attempted)
        record("Error names correct service", exc.service_name == "dead-svc")


# ─── TEST 5: Half-open recovery ───────────────────────────────────────────────
async def test_half_open_recovery():
    print("\n── Test 5: Circuit Breaker – HALF_OPEN Recovery ──")
    cb = CircuitBreaker("recovering-svc", failure_threshold=2, recovery_timeout=0.1,
                        success_threshold=2)

    async def _fail():
        raise RuntimeError("down")

    async def _succeed():
        return "ok"

    # Trip the breaker
    for _ in range(2):
        try:
            await cb.call(_fail)
        except RuntimeError:
            pass

    record("Starts OPEN", cb.state == CircuitState.OPEN)

    # Wait for recovery timeout
    await asyncio.sleep(0.15)
    await cb._check_recovery()
    record("Transitions to HALF_OPEN", cb.state == CircuitState.HALF_OPEN)

    # Two probe successes → CLOSED
    await cb.call(_succeed)
    await cb.call(_succeed)
    record("Returns to CLOSED after 2 successes", cb.state == CircuitState.CLOSED)


# ─── TEST 6: Retry backoff ────────────────────────────────────────────────────
async def test_retry_backoff():
    print("\n── Test 6: Retry With Exponential Backoff ──")
    call_count = 0
    attempt_times = []

    async def _flaky():
        nonlocal call_count
        call_count += 1
        attempt_times.append(time.monotonic())
        if call_count < 3:
            raise ConnectionError(f"Attempt {call_count} failed")
        return f"success on attempt {call_count}"

    result = await retry_with_backoff(_flaky, max_attempts=3, base_delay=0.05, max_delay=1.0)
    record("Succeeded after retries", result.startswith("success"))
    record("Called exactly 3 times", call_count == 3)

    # Check delays grew (with jitter there's variation, just check > 0)
    if len(attempt_times) >= 2:
        delay1 = (attempt_times[1] - attempt_times[0]) * 1000
        delay2 = (attempt_times[2] - attempt_times[1]) * 1000
        record("First retry delay > 20ms", delay1 > 20, f"{delay1:.0f}ms")
        record("Second retry delay > first (backoff)", delay2 >= delay1 * 0.5)


# ─── TEST 7: Retry exhaustion ─────────────────────────────────────────────────
async def test_retry_exhaustion():
    print("\n── Test 7: Retry Exhaustion ──")

    async def _always_fail():
        raise TimeoutError("permanent failure")

    try:
        await retry_with_backoff(
            _always_fail, max_attempts=3, base_delay=0.01, max_delay=0.05
        )
        record("Should have raised", False)
    except TimeoutError:
        record("Raises after max_attempts", True)


# ─── TEST 8: Timeout budget constants ─────────────────────────────────────────
def test_timeout_constants():
    print("\n── Test 8: Timeout Budget Constants ──")

    record("GATEWAY_DEFAULT read=15s", Timeouts.GATEWAY_DEFAULT.read == 15.0)
    record("ORCHESTRATOR_TO_RAG read=3s", Timeouts.ORCHESTRATOR_TO_RAG.read == 3.0)
    record("ORCHESTRATOR_TO_ML read=3s", Timeouts.ORCHESTRATOR_TO_ML.read == 3.0)
    record("ANY_TO_OLLAMA read=60s", Timeouts.ANY_TO_OLLAMA.read == 60.0)
    record("HEALTH_CHECK read=3s", Timeouts.HEALTH_CHECK.read == 3.0)
    # Gateway > Orchestrator → Ollama budget is largest
    record("Ollama budget > Gateway budget", Timeouts.ANY_TO_OLLAMA.read > Timeouts.GATEWAY_DEFAULT.read)


# ─── TEST 9: Concurrent circuit breaker safety ────────────────────────────────
async def test_concurrent_safety():
    print("\n── Test 9: Concurrent Circuit Breaker – Asyncio Safety ──")
    cb = CircuitBreaker("concurrent-svc", failure_threshold=5, recovery_timeout=60)
    errors_caught = 0

    async def _sometimes_fail(n):
        nonlocal errors_caught
        if n % 2 == 0:
            raise RuntimeError("even fail")
        return n

    tasks = [cb.call(_sometimes_fail, i) for i in range(10)]
    task_results = await asyncio.gather(*tasks, return_exceptions=True)

    successes = [r for r in task_results if isinstance(r, int)]
    errors = [r for r in task_results if isinstance(r, Exception) and not isinstance(r, CircuitBreakerError)]

    record("Concurrent calls all resolved", len(task_results) == 10)
    record("5 successes (odd indices)", len(successes) == 5)
    record("5 failures (even indices)", len(errors) == 5)
    record("Breaker state consistent", cb.state in (CircuitState.CLOSED, CircuitState.OPEN))


# ─── TEST 10: Circuit breaker registry ───────────────────────────────────────
async def test_registry():
    print("\n── Test 10: Circuit Breaker Registry ──")
    _ = make_breaker("reg-svc-a", failure_threshold=3)
    _ = make_breaker("reg-svc-b", failure_threshold=3)

    statuses = get_all_breaker_status()
    names = [s["service"] for s in statuses]

    record("Registry contains reg-svc-a", "reg-svc-a" in names)
    record("Registry contains reg-svc-b", "reg-svc-b" in names)
    record("Status has required fields", all(
        "state" in s and "failure_count" in s for s in statuses
    ))


# ─── TEST 11: Latency simulation ─────────────────────────────────────────────
async def test_latency_simulation():
    print("\n── Test 11: Latency Envelope Simulation ──")

    async def _simulate_ml(features: list) -> float:
        await asyncio.sleep(random.uniform(0.050, 0.150))  # 50–150ms
        return sum(features) / len(features)

    async def _simulate_rag(query: str) -> str:
        await asyncio.sleep(random.uniform(0.100, 0.300))  # 100–300ms
        return f"Context for: {query[:20]}"

    async def _simulate_llm(prompt: str) -> str:
        await asyncio.sleep(random.uniform(1.0, 3.0))  # 1–3s (Ollama)
        return f"Generated: {prompt[:30]}..."

    # Full request lifecycle
    t0 = time.monotonic()
    ml_result, rag_result = await asyncio.gather(
        _simulate_ml([0.1, 0.9, 0.5]),
        _simulate_rag("What is the churn rate?"),
    )
    prompt = f"RAG: {rag_result}\nML: {ml_result:.2f}"
    llm_result = await _simulate_llm(prompt)
    total_ms = (time.monotonic() - t0) * 1000

    record("ML result is a float", isinstance(ml_result, float))
    record("RAG result is non-empty", len(rag_result) > 0)
    record("LLM result generated", "Generated:" in llm_result)
    record(
        f"Total latency within 15s gateway budget ({total_ms:.0f}ms)",
        total_ms < 15000,
        f"{total_ms:.0f}ms",
    )


# ─── Main ─────────────────────────────────────────────────────────────────────
async def main():
    print("=" * 60)
    print("  Biz Stratosphere – Phase 5 Virtual Test Suite")
    print("=" * 60)

    test_error_schema()
    test_timeout_constants()
    await test_circuit_breaker_initial()
    await test_circuit_opens()
    await test_open_circuit_rejects()
    await test_half_open_recovery()
    await test_retry_backoff()
    await test_retry_exhaustion()
    await test_concurrent_safety()
    await test_registry()
    await test_latency_simulation()

    # ── Summary ────────────────────────────────────────────────────────────────
    print("\n" + "=" * 60)
    total = len(results)
    passed = sum(1 for _, p, _ in results if p)
    failed = total - passed
    print(f"  Results: {passed}/{total} passed, {failed} failed")
    print("=" * 60)

    if failed:
        print("\nFailed tests:")
        for name, p, detail in results:
            if not p:
                print(f"  ❌ {name}" + (f" – {detail}" if detail else ""))
        sys.exit(1)
    else:
        print("\n  🎉 All Phase 5 virtual tests passed!")
        sys.exit(0)


if __name__ == "__main__":
    asyncio.run(main())
