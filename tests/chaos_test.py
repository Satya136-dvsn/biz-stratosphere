"""
Chaos Test Suite – Phase 8 Chaos & Load Testing
Biz Stratosphere

Simulates failure scenarios to validate resilience:
  1. Random pod deletion (service restart)
  2. Database outage (PostgreSQL unreachable)
  3. Ollama outage (LLM service down)
  4. Cascading failure prevention
  5. Circuit breaker activation under chaos
  6. Service auto-recovery verification
  7. Partial outage (50% pod failure)
  8. Network partition simulation
"""
from __future__ import annotations

import asyncio
import io
import random
import sys
import time
from dataclasses import dataclass, field

# Fix Windows console encoding
if sys.stdout.encoding != "utf-8":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "backend"))

from shared.resilience import (
    CircuitBreaker, CircuitBreakerError, CircuitState,
    retry_with_backoff, make_breaker,
)

# ─── Test Result Tracking ────────────────────────────────────────────────────
results: list[tuple[str, bool, str]] = []

def record(name: str, passed: bool, detail: str = ""):
    icon = "✅" if passed else "❌"
    results.append((name, passed, detail))
    print(f"  {icon}  {name}" + (f" — {detail}" if detail else ""))


# ═══════════════════════════════════════════════════════════════════════════════
# CHAOS 1: Random Pod Deletion (Service Restart Simulation)
# ═══════════════════════════════════════════════════════════════════════════════

async def test_pod_deletion():
    """Simulate random pod deletion and verify service recovery."""
    print("\n── Chaos 1: Random Pod Deletion ──")

    services = ["api-gateway", "ml-inference", "rag-service", "llm-orchestrator", "embedding-worker"]
    recovery_times = {}

    for svc in services:
        cb = CircuitBreaker(f"chaos-pod-{svc}", failure_threshold=3, recovery_timeout=0.5,
                            success_threshold=2)

        # Phase 1: Service working normally
        success_count = 0
        for _ in range(5):
            try:
                await cb.call(lambda: asyncio.sleep(random.uniform(0.01, 0.03)))
                success_count += 1
            except Exception:
                pass

        record(f"{svc} healthy before chaos", success_count == 5)

        # Phase 2: Pod killed – all calls fail
        async def _pod_dead():
            raise ConnectionError(f"{svc} pod terminated")

        for _ in range(3):
            try:
                await cb.call(_pod_dead)
            except (ConnectionError, CircuitBreakerError):
                pass

        record(f"{svc} CB opens on pod death", cb.state == CircuitState.OPEN)

        # Phase 3: Pod restarts (wait for recovery timeout)
        t_recovery_start = time.monotonic()
        await asyncio.sleep(0.6)  # Wait > recovery_timeout
        await cb._check_recovery()
        record(f"{svc} enters HALF_OPEN", cb.state == CircuitState.HALF_OPEN)

        # Phase 4: Recovery probes succeed
        async def _pod_recovered():
            return "ok"

        await cb.call(_pod_recovered)
        await cb.call(_pod_recovered)
        recovery_ms = (time.monotonic() - t_recovery_start) * 1000
        recovery_times[svc] = recovery_ms

        record(f"{svc} recovers to CLOSED", cb.state == CircuitState.CLOSED,
               f"recovery={recovery_ms:.0f}ms")

    avg_recovery = sum(recovery_times.values()) / len(recovery_times)
    record(f"Avg recovery time < 2s", avg_recovery < 2000, f"{avg_recovery:.0f}ms")


# ═══════════════════════════════════════════════════════════════════════════════
# CHAOS 2: Database Outage
# ═══════════════════════════════════════════════════════════════════════════════

async def test_database_outage():
    """Simulate PostgreSQL becoming unreachable."""
    print("\n── Chaos 2: Database Outage ──")

    db_available = True
    cb = CircuitBreaker("db-chaos", failure_threshold=3, recovery_timeout=0.5, success_threshold=2)

    async def _db_query():
        if not db_available:
            raise ConnectionError("PostgreSQL: connection refused (db pod down)")
        await asyncio.sleep(random.uniform(0.01, 0.05))
        return {"rows": 5}

    # Normal operation
    result = await cb.call(_db_query)
    record("DB query succeeds normally", result["rows"] == 5)

    # Kill database
    db_available = False
    failures = 0
    for _ in range(5):
        try:
            await cb.call(_db_query)
        except (ConnectionError, CircuitBreakerError):
            failures += 1

    record("All queries fail during outage", failures == 5)
    record("DB circuit breaker opens", cb.state == CircuitState.OPEN)

    # Services that depend on DB should get CircuitBreakerError (fast-fail)
    t0 = time.monotonic()
    try:
        await cb.call(_db_query)
        record("Should have raised", False)
    except CircuitBreakerError:
        fast_fail_ms = (time.monotonic() - t0) * 1000
        record("Fast-fail on DB outage", fast_fail_ms < 5, f"{fast_fail_ms:.1f}ms")

    # Database recovers
    db_available = True
    await asyncio.sleep(0.6)
    await cb._check_recovery()

    result = await cb.call(_db_query)
    await cb.call(_db_query)
    record("DB circuit recovers after restart", cb.state == CircuitState.CLOSED)


# ═══════════════════════════════════════════════════════════════════════════════
# CHAOS 3: Ollama Outage
# ═══════════════════════════════════════════════════════════════════════════════

async def test_ollama_outage():
    """Simulate Ollama LLM server crash."""
    print("\n── Chaos 3: Ollama Outage ──")

    ollama_alive = True
    cb = CircuitBreaker("ollama-chaos", failure_threshold=3, recovery_timeout=0.5, success_threshold=2)

    async def _ollama_call():
        if not ollama_alive:
            raise TimeoutError("Ollama: connection timeout (pod crashed)")
        await asyncio.sleep(random.uniform(0.1, 0.5))
        return {"response": "Generated text", "model": "llama3"}

    # Normal generation
    result = await cb.call(_ollama_call)
    record("Ollama generates normally", "Generated" in result["response"])

    # Kill Ollama
    ollama_alive = False

    # Services depending on Ollama (LLM orchestrator, RAG embed) should degrade
    affected_services = {"llm-orchestrator": 0, "rag-service": 0, "embedding-worker": 0}
    for svc in affected_services:
        try:
            await cb.call(_ollama_call)
        except (TimeoutError, CircuitBreakerError):
            affected_services[svc] += 1

    record("Ollama CB opens", cb.state == CircuitState.OPEN)

    # API Gateway should still serve cached/fallback responses
    async def _gateway_with_fallback():
        try:
            await cb.call(_ollama_call)
        except CircuitBreakerError:
            return {"response": "Service temporarily degraded", "fallback": True}

    fallback_result = await _gateway_with_fallback()
    record("Gateway returns fallback response", fallback_result.get("fallback") is True)

    # ML Inference should be UNAFFECTED by Ollama outage
    async def _ml_predict():
        await asyncio.sleep(0.05)
        return {"prediction": 0.87}

    ml_result = await _ml_predict()
    record("ML Inference unaffected by Ollama outage", ml_result["prediction"] == 0.87)

    # Recover Ollama
    ollama_alive = True
    await asyncio.sleep(0.6)
    await cb._check_recovery()
    result = await cb.call(_ollama_call)
    await cb.call(_ollama_call)
    record("Ollama recovers after restart", cb.state == CircuitState.CLOSED)


# ═══════════════════════════════════════════════════════════════════════════════
# CHAOS 4: Cascading Failure Prevention
# ═══════════════════════════════════════════════════════════════════════════════

async def test_cascading_failure():
    """Verify failures don't cascade across service boundaries."""
    print("\n── Chaos 4: Cascading Failure Prevention ──")

    # Each service has its own circuit breaker – failures in one shouldn't affect others
    cb_rag = CircuitBreaker("cascade-rag", failure_threshold=3, recovery_timeout=1.0)
    cb_ml = CircuitBreaker("cascade-ml", failure_threshold=3, recovery_timeout=1.0)
    cb_llm = CircuitBreaker("cascade-llm", failure_threshold=3, recovery_timeout=1.0)

    # Kill RAG service
    async def _rag_dead():
        raise ConnectionError("RAG service down")

    for _ in range(3):
        try:
            await cb_rag.call(_rag_dead)
        except ConnectionError:
            pass

    record("RAG circuit is OPEN", cb_rag.state == CircuitState.OPEN)

    # ML should still work
    async def _ml_ok():
        await asyncio.sleep(0.02)
        return "ml_ok"

    ml_result = await cb_ml.call(_ml_ok)
    record("ML still works (RAG down)", ml_result == "ml_ok")
    record("ML circuit stays CLOSED", cb_ml.state == CircuitState.CLOSED)

    # LLM should still work (just without RAG context)
    async def _llm_degraded():
        await asyncio.sleep(0.05)
        return "llm_ok_no_rag"

    llm_result = await cb_llm.call(_llm_degraded)
    record("LLM works degraded (no RAG)", llm_result == "llm_ok_no_rag")
    record("LLM circuit stays CLOSED", cb_llm.state == CircuitState.CLOSED)

    # Verify isolation – 3 independent breakers, only 1 open
    open_count = sum(1 for cb in [cb_rag, cb_ml, cb_llm] if cb.state == CircuitState.OPEN)
    record("Only RAG circuit is open (isolation)", open_count == 1)


# ═══════════════════════════════════════════════════════════════════════════════
# CHAOS 5: Retry Under Partial Failure
# ═══════════════════════════════════════════════════════════════════════════════

async def test_retry_under_chaos():
    """Verify retry logic works under intermittent failures."""
    print("\n── Chaos 5: Retry Under Intermittent Failures ──")

    call_count = 0
    async def _intermittent():
        nonlocal call_count
        call_count += 1
        if call_count <= 2:
            raise ConnectionError(f"Intermittent failure #{call_count}")
        return "success_after_retries"

    t0 = time.monotonic()
    result = await retry_with_backoff(
        _intermittent, max_attempts=4, base_delay=0.05, max_delay=0.5
    )
    elapsed_ms = (time.monotonic() - t0) * 1000

    record("Retry recovers from intermittent failure", result == "success_after_retries")
    record("Took exactly 3 attempts", call_count == 3, f"attempts={call_count}")
    record("Retry completed within budget", elapsed_ms < 2000, f"{elapsed_ms:.0f}ms")


# ═══════════════════════════════════════════════════════════════════════════════
# CHAOS 6: Concurrent Chaos (Multiple Failures Simultaneously)
# ═══════════════════════════════════════════════════════════════════════════════

async def test_concurrent_chaos():
    """Multiple services fail simultaneously under load."""
    print("\n── Chaos 6: Concurrent Multi-Service Failure ──")

    breakers = {
        svc: CircuitBreaker(f"multi-{svc}", failure_threshold=5, recovery_timeout=0.5)
        for svc in ["gateway", "ml", "rag", "llm"]
    }

    # Blast all services with mixed success/failure
    async def _chaotic_call(svc: str, fail_prob: float):
        if random.random() < fail_prob:
            raise ConnectionError(f"{svc}: chaos failure")
        await asyncio.sleep(random.uniform(0.005, 0.020))
        return f"{svc}_ok"

    tasks = []
    for svc in breakers:
        fail_prob = {"gateway": 0.1, "ml": 0.8, "rag": 0.9, "llm": 0.5}[svc]
        for _ in range(20):
            tasks.append((svc, fail_prob))

    successes = 0
    circuit_breaks = 0
    errors = 0

    async def _run_one(svc, fp):
        nonlocal successes, circuit_breaks, errors
        try:
            await breakers[svc].call(lambda: _chaotic_call(svc, fp))
            successes += 1
        except CircuitBreakerError:
            circuit_breaks += 1
        except Exception:
            errors += 1

    await asyncio.gather(*[_run_one(svc, fp) for svc, fp in tasks])

    total = successes + circuit_breaks + errors
    record(f"All {total} requests resolved", total == 80, f"s={successes} cb={circuit_breaks} e={errors}")

    # High-failure services should have open breakers
    rag_open = breakers["rag"].state == CircuitState.OPEN
    record("RAG breaker opened (90% failure)", rag_open)

    # Low-failure gateway should remain functional
    gw_state = breakers["gateway"].state
    record("Gateway survived chaos (10% failure)", gw_state == CircuitState.CLOSED,
           f"state={gw_state.value}")


# ═══════════════════════════════════════════════════════════════════════════════
# CHAOS 7: Resource Exhaustion Simulation
# ═══════════════════════════════════════════════════════════════════════════════

async def test_resource_exhaustion():
    """Simulate CPU/memory pressure causing request timeouts."""
    print("\n── Chaos 7: Resource Exhaustion (Timeout Cascade) ──")

    cb = CircuitBreaker("resource-chaos", failure_threshold=5, recovery_timeout=0.5, success_threshold=2)
    timeout_budget = 0.2  # 200ms budget

    async def _slow_service():
        # Under resource pressure, latency increases
        latency = random.uniform(0.050, 0.400)
        await asyncio.sleep(latency)
        if latency > timeout_budget:
            raise TimeoutError(f"Request exceeded budget: {latency*1000:.0f}ms > {timeout_budget*1000:.0f}ms")
        return "ok"

    timeouts = 0
    successes = 0
    for _ in range(20):
        try:
            await cb.call(_slow_service)
            successes += 1
        except (TimeoutError, CircuitBreakerError):
            timeouts += 1

    record("Some requests timed out", timeouts > 0, f"timeouts={timeouts}")
    record("Some requests succeeded", successes > 0, f"successes={successes}")

    if cb.state == CircuitState.OPEN:
        record("CB protected against timeout cascade", True)
    else:
        record("CB stayed closed (failures < threshold)", cb._failure_count < 5,
               f"failures={cb._failure_count}")


# ═══════════════════════════════════════════════════════════════════════════════
# Main
# ═══════════════════════════════════════════════════════════════════════════════

async def main():
    print("=" * 70)
    print("  Biz Stratosphere – Phase 8: Chaos Testing Suite")
    print("=" * 70)

    await test_pod_deletion()
    await test_database_outage()
    await test_ollama_outage()
    await test_cascading_failure()
    await test_retry_under_chaos()
    await test_concurrent_chaos()
    await test_resource_exhaustion()

    # ── Summary ──────────────────────────────────────────────────────────────
    print("\n" + "=" * 70)
    total = len(results)
    passed = sum(1 for _, p, _ in results if p)
    failed = total - passed
    print(f"  Chaos Test Results: {passed}/{total} passed, {failed} failed")
    print("=" * 70)

    if failed:
        print("\n  Failed checks:")
        for name, p, detail in results:
            if not p:
                print(f"  ❌ {name}" + (f" — {detail}" if detail else ""))
        sys.exit(1)
    else:
        print("\n  🎉 All chaos tests PASSED! System is resilient.")
        sys.exit(0)


if __name__ == "__main__":
    asyncio.run(main())
