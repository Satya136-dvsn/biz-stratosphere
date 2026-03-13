"""
Load Test Suite – Phase 8 Chaos & Load Testing
Biz Stratosphere

Simulates concurrent load across all service tiers:
  1. API Gateway concurrent request flood
  2. ML Inference burst predictions
  3. RAG Retrieval burst queries
  4. LLM Generation burst prompts
  5. Full pipeline stress (gateway → all backends)

Measures:
  - P50/P95/P99 latency
  - Error rate
  - Throughput (req/s)
  - CPU/memory utilization simulation
"""
from __future__ import annotations

import asyncio
import io
import math
import os
import random
import statistics
import sys
import time
from dataclasses import dataclass, field
from typing import Callable, Awaitable

# Fix Windows console encoding
if sys.stdout.encoding != "utf-8":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

# ─── Shared imports ──────────────────────────────────────────────────────────
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "backend"))

from shared.resilience import CircuitBreaker, CircuitBreakerError, retry_with_backoff
from shared.metrics import get_or_create_metrics
from shared.tracing import init_tracer

# ─── Result Container ────────────────────────────────────────────────────────
@dataclass
class LoadTestResult:
    name: str
    total_requests: int = 0
    successes: int = 0
    failures: int = 0
    circuit_breaks: int = 0
    latencies_ms: list[float] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)
    start_time: float = 0.0
    end_time: float = 0.0

    @property
    def error_rate(self) -> float:
        return (self.failures / max(self.total_requests, 1)) * 100

    @property
    def throughput(self) -> float:
        elapsed = max(self.end_time - self.start_time, 0.001)
        return self.total_requests / elapsed

    def percentile(self, p: int) -> float:
        if not self.latencies_ms:
            return 0.0
        sorted_lat = sorted(self.latencies_ms)
        idx = int(math.ceil(p / 100.0 * len(sorted_lat))) - 1
        return sorted_lat[max(0, idx)]

    @property
    def p50(self) -> float:
        return self.percentile(50)

    @property
    def p95(self) -> float:
        return self.percentile(95)

    @property
    def p99(self) -> float:
        return self.percentile(99)

    def summary(self) -> str:
        return (
            f"  Requests:  {self.total_requests}\n"
            f"  Success:   {self.successes} ({100 - self.error_rate:.1f}%)\n"
            f"  Failures:  {self.failures} ({self.error_rate:.1f}%)\n"
            f"  CB Breaks: {self.circuit_breaks}\n"
            f"  P50:       {self.p50:.1f}ms\n"
            f"  P95:       {self.p95:.1f}ms\n"
            f"  P99:       {self.p99:.1f}ms\n"
            f"  Throughput:{self.throughput:.1f} req/s"
        )


# ═══════════════════════════════════════════════════════════════════════════════
# Service Simulators (replicate real service behavior without live containers)
# ═══════════════════════════════════════════════════════════════════════════════

async def simulate_api_gateway(failure_rate: float = 0.02) -> dict:
    """Simulate gateway request processing: auth → route → proxy."""
    await asyncio.sleep(random.uniform(0.005, 0.020))  # 5-20ms auth
    if random.random() < failure_rate:
        raise ConnectionError("Gateway: upstream timeout")
    await asyncio.sleep(random.uniform(0.010, 0.050))  # 10-50ms routing
    return {"status": 200, "service": "api-gateway"}


async def simulate_ml_inference(failure_rate: float = 0.03) -> dict:
    """Simulate ML model prediction: load features → predict → respond."""
    await asyncio.sleep(random.uniform(0.050, 0.200))  # 50-200ms inference
    if random.random() < failure_rate:
        raise RuntimeError("ML: model inference timeout")
    return {"prediction": round(random.uniform(0.0, 1.0), 4), "model": "churn_xgb"}


async def simulate_rag_retrieval(failure_rate: float = 0.04) -> dict:
    """Simulate RAG: embed query → pgvector search → rank → return."""
    await asyncio.sleep(random.uniform(0.030, 0.080))  # 30-80ms embed
    if random.random() < failure_rate:
        raise ConnectionError("RAG: database connection pool exhausted")
    await asyncio.sleep(random.uniform(0.050, 0.250))  # 50-250ms search
    return {"snippets": [{"text": "result", "score": 0.92}], "count": random.randint(1, 5)}


async def simulate_llm_generation(failure_rate: float = 0.05) -> dict:
    """Simulate LLM: fetch context → generate → stream."""
    await asyncio.sleep(random.uniform(0.100, 0.400))  # 100-400ms context fetch
    if random.random() < failure_rate:
        raise TimeoutError("LLM: Ollama generation timeout")
    await asyncio.sleep(random.uniform(0.500, 2.500))  # 500ms-2.5s generation
    return {"response": "Generated analysis...", "tokens": random.randint(50, 500)}


async def simulate_full_pipeline(failure_rate: float = 0.05) -> dict:
    """Simulate full: gateway → (ML + RAG parallel) → LLM → response."""
    # Gateway
    await asyncio.sleep(random.uniform(0.005, 0.015))
    # Parallel ML + RAG
    ml_task = simulate_ml_inference(failure_rate)
    rag_task = simulate_rag_retrieval(failure_rate)
    ml_result, rag_result = await asyncio.gather(ml_task, rag_task)
    # LLM generation
    llm_result = await simulate_llm_generation(failure_rate)
    return {"ml": ml_result, "rag": rag_result, "llm": llm_result}


# ═══════════════════════════════════════════════════════════════════════════════
# Load Test Runner
# ═══════════════════════════════════════════════════════════════════════════════

async def run_load_test(
    name: str,
    handler: Callable[..., Awaitable],
    concurrency: int,
    total_requests: int,
    circuit_breaker: CircuitBreaker | None = None,
) -> LoadTestResult:
    """Execute a load test with controlled concurrency."""
    result = LoadTestResult(name=name)
    semaphore = asyncio.Semaphore(concurrency)

    async def _execute_one():
        async with semaphore:
            t0 = time.monotonic()
            try:
                if circuit_breaker:
                    await circuit_breaker.call(handler)
                else:
                    await handler()
                elapsed_ms = (time.monotonic() - t0) * 1000
                result.latencies_ms.append(elapsed_ms)
                result.successes += 1
            except CircuitBreakerError:
                result.circuit_breaks += 1
                result.failures += 1
            except Exception as exc:
                elapsed_ms = (time.monotonic() - t0) * 1000
                result.latencies_ms.append(elapsed_ms)
                result.failures += 1
                result.errors.append(str(exc)[:80])
            result.total_requests += 1

    result.start_time = time.monotonic()
    tasks = [_execute_one() for _ in range(total_requests)]
    await asyncio.gather(*tasks)
    result.end_time = time.monotonic()
    return result


# ═══════════════════════════════════════════════════════════════════════════════
# HPA Autoscaling Simulator
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class HPASimulator:
    """Simulates K8s HPA scaling behavior."""
    name: str
    min_replicas: int
    max_replicas: int
    cpu_target: float  # 0.0-1.0
    current_replicas: int = 0
    scaling_events: list[dict] = field(default_factory=list)

    def __post_init__(self):
        self.current_replicas = self.min_replicas

    def evaluate(self, cpu_utilization: float, timestamp: float) -> int:
        """Evaluate scaling decision based on CPU utilization."""
        desired = math.ceil(self.current_replicas * (cpu_utilization / self.cpu_target))
        desired = max(self.min_replicas, min(self.max_replicas, desired))

        if desired != self.current_replicas:
            direction = "SCALE_UP" if desired > self.current_replicas else "SCALE_DOWN"
            self.scaling_events.append({
                "time": round(timestamp, 2),
                "from": self.current_replicas,
                "to": desired,
                "cpu": round(cpu_utilization * 100, 1),
                "event": direction,
            })
            self.current_replicas = desired
        return self.current_replicas


# ═══════════════════════════════════════════════════════════════════════════════
# Main Test Suite
# ═══════════════════════════════════════════════════════════════════════════════

async def main():
    print("=" * 70)
    print("  Biz Stratosphere – Phase 8: Load Testing Suite")
    print("=" * 70)

    all_results: list[LoadTestResult] = []

    # ── Test 1: API Gateway Flood ────────────────────────────────────────────
    print("\n── Test 1: API Gateway – 500 concurrent requests ──")
    cb1 = CircuitBreaker("gateway-load", failure_threshold=15, recovery_timeout=2.0)
    r1 = await run_load_test(
        name="API Gateway Flood",
        handler=lambda: simulate_api_gateway(failure_rate=0.02),
        concurrency=50,
        total_requests=500,
        circuit_breaker=cb1,
    )
    all_results.append(r1)
    print(r1.summary())

    # ── Test 2: ML Inference Burst ───────────────────────────────────────────
    print("\n── Test 2: ML Inference – 300 burst predictions ──")
    cb2 = CircuitBreaker("ml-load", failure_threshold=10, recovery_timeout=2.0)
    r2 = await run_load_test(
        name="ML Inference Burst",
        handler=lambda: simulate_ml_inference(failure_rate=0.03),
        concurrency=30,
        total_requests=300,
        circuit_breaker=cb2,
    )
    all_results.append(r2)
    print(r2.summary())

    # ── Test 3: RAG Retrieval Burst ──────────────────────────────────────────
    print("\n── Test 3: RAG Retrieval – 300 burst queries ──")
    cb3 = CircuitBreaker("rag-load", failure_threshold=12, recovery_timeout=2.0)
    r3 = await run_load_test(
        name="RAG Retrieval Burst",
        handler=lambda: simulate_rag_retrieval(failure_rate=0.04),
        concurrency=30,
        total_requests=300,
        circuit_breaker=cb3,
    )
    all_results.append(r3)
    print(r3.summary())

    # ── Test 4: LLM Generation Burst ────────────────────────────────────────
    print("\n── Test 4: LLM Generation – 100 burst prompts ──")
    cb4 = CircuitBreaker("llm-load", failure_threshold=8, recovery_timeout=3.0)
    r4 = await run_load_test(
        name="LLM Generation Burst",
        handler=lambda: simulate_llm_generation(failure_rate=0.05),
        concurrency=10,
        total_requests=100,
        circuit_breaker=cb4,
    )
    all_results.append(r4)
    print(r4.summary())

    # ── Test 5: Full Pipeline Stress ────────────────────────────────────────
    print("\n── Test 5: Full Pipeline – 200 end-to-end requests ──")
    cb5 = CircuitBreaker("pipeline-load", failure_threshold=20, recovery_timeout=3.0)
    r5 = await run_load_test(
        name="Full Pipeline Stress",
        handler=lambda: simulate_full_pipeline(failure_rate=0.03),
        concurrency=20,
        total_requests=200,
        circuit_breaker=cb5,
    )
    all_results.append(r5)
    print(r5.summary())

    # ── Test 6: HPA Autoscaling Simulation ──────────────────────────────────
    print("\n── Test 6: HPA Autoscaling Behavior ──")
    hpas = [
        HPASimulator("api-gateway", min_replicas=2, max_replicas=8, cpu_target=0.70),
        HPASimulator("ml-inference", min_replicas=2, max_replicas=6, cpu_target=0.60),
        HPASimulator("rag-service", min_replicas=2, max_replicas=6, cpu_target=0.65),
        HPASimulator("llm-orchestrator", min_replicas=2, max_replicas=6, cpu_target=0.65),
        HPASimulator("embedding-worker", min_replicas=1, max_replicas=4, cpu_target=0.70),
    ]

    # Simulate load ramp: idle → peak → cool-down
    load_profile = (
        [(t * 0.1, 0.20 + t * 0.08) for t in range(10)] +  # ramp up
        [(1.0 + t * 0.1, 0.85 + random.uniform(-0.05, 0.05)) for t in range(10)] +  # peak
        [(2.0 + t * 0.1, 0.80 - t * 0.06) for t in range(10)]  # cool-down
    )

    for hpa in hpas:
        for timestamp, cpu in load_profile:
            hpa.evaluate(cpu, timestamp)
        events = len(hpa.scaling_events)
        final = hpa.current_replicas
        print(f"  {hpa.name}: {hpa.min_replicas}→{final} pods ({events} scaling events)")
        for evt in hpa.scaling_events[:3]:
            print(f"    t={evt['time']:.1f}s CPU={evt['cpu']}% {evt['event']} {evt['from']}→{evt['to']}")
        if events > 3:
            print(f"    ... and {events - 3} more events")

    # ── Summary ─────────────────────────────────────────────────────────────
    print("\n" + "=" * 70)
    print("  LOAD TEST SUMMARY")
    print("=" * 70)
    print(f"  {'Test':<25} {'Reqs':>6} {'OK%':>6} {'P50':>8} {'P95':>8} {'P99':>8} {'Tput':>8}")
    print("  " + "-" * 65)
    for r in all_results:
        ok_pct = f"{100 - r.error_rate:.1f}%"
        print(f"  {r.name:<25} {r.total_requests:>6} {ok_pct:>6} "
              f"{r.p50:>7.1f}ms {r.p95:>7.1f}ms {r.p99:>7.1f}ms "
              f"{r.throughput:>6.0f}/s")
    print("=" * 70)

    # ── Pass/Fail Criteria ──────────────────────────────────────────────────
    all_passed = True
    checks = []

    for r in all_results:
        passed = r.error_rate < 15.0
        checks.append((f"{r.name} error rate < 15%", passed, f"{r.error_rate:.1f}%"))
        if not passed:
            all_passed = False

    # Latency budget checks
    checks.append(("Gateway P99 < 200ms", r1.p99 < 200, f"{r1.p99:.1f}ms"))
    checks.append(("ML P99 < 500ms", r2.p99 < 500, f"{r2.p99:.1f}ms"))
    checks.append(("RAG P99 < 800ms", r3.p99 < 800, f"{r3.p99:.1f}ms"))
    checks.append(("LLM P99 < 5000ms", r4.p99 < 5000, f"{r4.p99:.1f}ms"))
    checks.append(("Pipeline P99 < 6000ms", r5.p99 < 6000, f"{r5.p99:.1f}ms"))

    for check_name, passed, detail in checks:
        if not passed:
            all_passed = False

    # HPA checks
    for hpa in hpas:
        scaled = any(e["event"] == "SCALE_UP" for e in hpa.scaling_events)
        checks.append((f"HPA {hpa.name} scaled up", scaled, f"{len(hpa.scaling_events)} events"))
        if not scaled:
            all_passed = False

    print("\n  CHECKS:")
    for check_name, passed, detail in checks:
        icon = "✅" if passed else "❌"
        print(f"  {icon} {check_name} — {detail}")

    print("\n" + "=" * 70)
    if all_passed:
        print("  🎉 All load tests PASSED!")
        sys.exit(0)
    else:
        failed_count = sum(1 for _, p, _ in checks if not p)
        print(f"  ⚠️  {failed_count} check(s) failed")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
