import asyncio
import random
import time
import math
import sys
from collections import Counter
from statistics import median
from shared.resilience import CircuitBreaker, CircuitBreakerError, retry_with_backoff
from shared.tracing import init_tracer, get_collector, get_tracer
from shared.metrics import get_or_create_metrics

metrics = get_or_create_metrics("enterprise-simulator")
tracer = init_tracer("enterprise-simulator")

class EnterpriseSimulator:
    def __init__(self):
        self.stats = {
            "ml_success": 0, "ml_fail": 0, "ml_latencies": [],
            "rag_success": 0, "rag_fail": 0, "rag_latencies": [],
            "llm_success": 0, "llm_fail": 0, "llm_latencies": [],
            "auth_success": 0, "auth_fail": 0,
            "autoscaling_events": []
        }
        
        # State simulating pod availability
        self.ml_replicas = 2
        self.rag_replicas = 2
        self.llm_replicas = 2
        self.gateway_replicas = 2
        
        self.pg_available = True
        self.ollama_available = True
        self.rag_service_available = True
        
        self.node_active = True
        
        # CPU tracking
        self.ml_cpu = 0
        self.rag_cpu = 0
        self.llm_cpu = 0
        self.gateway_cpu = 0

        # Circuit Breakers
        self.pg_cb = CircuitBreaker("pg_db", failure_threshold=3, recovery_timeout=2.0)
        self.ollama_cb = CircuitBreaker("ollama_llm", failure_threshold=5, recovery_timeout=5.0)
        self.rag_cb = CircuitBreaker("rag_svc", failure_threshold=3, recovery_timeout=3.0)

    # ----------------------------------------
    # Core Infrastructure Simulators
    # ----------------------------------------
    def hpa_simulate(self):
        """Simulate Kubernetes HPA modifying replicas based on CPU load."""
        if self.gateway_cpu > 70 and self.gateway_replicas < 10:
            self.gateway_replicas += 2
            self.stats["autoscaling_events"].append("Gateway Scaled UP")
        
        if self.ml_cpu > 60 and self.ml_replicas < 8:
            self.ml_replicas += 2
            self.stats["autoscaling_events"].append("ML Scaled UP")
            
        if self.llm_cpu > 65 and self.llm_replicas < 6:
            self.llm_replicas += 1
            self.stats["autoscaling_events"].append("LLM Scaled UP")

    def kubernetes_pod_failure(self):
        """Simulate random pod/node failures."""
        if not self.node_active:
            # Drop replicas significantly if a node dies
            self.ml_replicas = max(1, self.ml_replicas - 2)
            self.llm_replicas = max(1, self.llm_replicas - 1)
            self.stats["autoscaling_events"].append("NODE FAILURE DETECTED: Pods lost.")

    # ----------------------------------------
    # Service Simulators (Protected by CB)
    # ----------------------------------------
    async def _do_pg(self):
        if not self.pg_available:
            raise ConnectionError("PostgreSQL unreachable")
        await asyncio.sleep(0.01) # fast DB query
        return True

    async def call_postgres(self):
        return await self.pg_cb.call(self._do_pg)

    async def _do_ollama(self):
        if not self.ollama_available:
            raise ConnectionError("Ollama Connection Refused")
        await asyncio.sleep(random.uniform(0.5, 1.2)) # slow LLM gen
        return "Generated text."

    async def call_ollama(self):
        return await self.ollama_cb.call(self._do_ollama)

    async def _do_rag(self):
        if not self.rag_service_available:
            raise TimeoutError("RAG Service timed out")
        return await self.call_postgres()

    async def call_rag(self):
        return await self.rag_cb.call(self._do_rag)

    # ----------------------------------------
    # Traffic Handlers
    # ----------------------------------------
    async def handle_ml_request(self):
        start = time.time()
        self.ml_cpu += 0.5
        metrics.request_count.inc(method="POST", endpoint="/predict", status="200")
        try:
            if self.ml_replicas < 1:
                raise Exception("No ML Pods Available")
            
            # Base latency + penalty for overload (lack of replicas relative to CPU)
            delay = 0.03 + (self.ml_cpu / (self.ml_replicas * 10))
            await asyncio.sleep(min(delay, 0.4)) 
            
            with tracer.span("ml_inference") as span:
                span.set_attribute("model", "xgboost")
            
            lat = (time.time() - start) * 1000
            self.stats["ml_latencies"].append(lat)
            metrics.request_latency.observe(lat / 1000.0, method="POST", endpoint="/predict")
            self.stats["ml_success"] += 1
        except Exception as e:
            self.stats["ml_fail"] += 1
        finally:
            self.ml_cpu = max(0, self.ml_cpu - 0.5)

    async def handle_rag_request(self):
        start = time.time()
        self.rag_cpu += 0.8
        metrics.request_count.inc(method="POST", endpoint="/retrieve", status="200")
        try:
            if self.rag_replicas < 1:
                raise Exception("No RAG Pods Available")
            
            delay = 0.05 + (self.rag_cpu / (self.rag_replicas * 10))
            await asyncio.sleep(min(delay, 0.5))
            
            with tracer.span("rag_search") as span:
                try:
                    await self.call_rag()
                except CircuitBreakerError:
                    span.set_attribute("cb", "open")
                    # Fallback allowed internally
                except Exception:
                    pass

            lat = (time.time() - start) * 1000
            self.stats["rag_latencies"].append(lat)
            metrics.request_latency.observe(lat / 1000.0, method="POST", endpoint="/retrieve")
            self.stats["rag_success"] += 1
        except Exception:
            self.stats["rag_fail"] += 1
        finally:
            self.rag_cpu = max(0, self.rag_cpu - 0.8)

    async def handle_llm_request(self):
        start = time.time()
        self.llm_cpu += 2.0
        metrics.request_count.inc(method="POST", endpoint="/generate", status="200")
        try:
            if self.llm_replicas < 1:
                raise Exception("No LLM Pods Available")
                
            delay = 0.8 + (self.llm_cpu / (self.llm_replicas * 5))
            await asyncio.sleep(min(delay, 2.5))
            
            with tracer.span("llm_generation") as span:
                try:
                    await retry_with_backoff(self.call_ollama, max_attempts=2, base_delay=0.01)
                except CircuitBreakerError:
                    span.set_attribute("fallback", "canned_response")
                    
            lat = (time.time() - start) * 1000
            self.stats["llm_latencies"].append(lat)
            metrics.request_latency.observe(lat / 1000.0, method="POST", endpoint="/generate")
            self.stats["llm_success"] += 1
        except Exception:
            self.stats["llm_fail"] += 1
        finally:
            self.llm_cpu = max(0, self.llm_cpu - 2.0)

    # ----------------------------------------
    # Execution Scenarios
    # ----------------------------------------
    async def spawn_traffic(self, duration_sec: int, rps: int, mix: tuple):
        """Spawn mixed traffic representing X requests per second."""
        ml_pct, rag_pct, llm_pct = mix
        tasks = []
        end_time = time.time() + duration_sec
        
        while time.time() < end_time:
            batch = []
            for _ in range(rps):
                r = random.random()
                self.gateway_cpu += 0.1
                if r < ml_pct:
                    batch.append(asyncio.create_task(self.handle_ml_request()))
                elif r < (ml_pct + rag_pct):
                    batch.append(asyncio.create_task(self.handle_rag_request()))
                else:
                    batch.append(asyncio.create_task(self.handle_llm_request()))
            
            await asyncio.sleep(1.0) # wait 1 second to pace the RPS
            self.gateway_cpu = max(0, self.gateway_cpu - (rps * 0.1))
            self.hpa_simulate()
            self.kubernetes_pod_failure()
            tasks.extend(batch)
            
        await asyncio.gather(*tasks, return_exceptions=True)

    async def run_scenario_1_scale(self):
        print("\n--- Scenario 1: Enterprise Large-Scale Traffic ---")
        self.stats = {k: 0 if isinstance(v, int) else [] for k, v in self.stats.items()}
        print("Simulating 1000 concurrent users via 100 RPS for 10 seconds (40% ML, 30% RAG, 30% LLM)...")
        await self.spawn_traffic(10, 100, (0.4, 0.3, 0.3))
        self.print_stats()

    async def run_scenario_2_dependency_chaos(self):
        print("\n--- Scenario 2: Dependency Failure Simulation ---")
        print("Trashing PostgreSQL and Ollama while under 50 RPS load...")
        self.pg_available = False
        self.ollama_available = False
        self.rag_service_available = False
        await self.spawn_traffic(5, 50, (0.4, 0.3, 0.3))
        print("PG Circuit Breaker State:", self.pg_cb.state)
        print("Ollama Circuit Breaker State:", self.ollama_cb.state)
        print("RAG Circuit Breaker State:", self.rag_cb.state)
        print("Restoring dependencies...")
        self.pg_available = True
        self.ollama_available = True
        self.rag_service_available = True
        await asyncio.sleep(5) # wait for recovery timeouts
        # verify recovery
        try:
            await self.call_postgres()
            print("PostgreSQL recovered successfully.")
        except Exception as e:
             print("PG Recovery failed:", e)

    async def run_scenario_3_k8s_failure(self):
        print("\n--- Scenario 3: Kubernetes Infrastructure Failure ---")
        print("Simulating a Node failure dropping replicas...")
        self.node_active = False
        self.kubernetes_pod_failure()
        print(f"Replicas after node death - ML: {self.ml_replicas}, LLM: {self.llm_replicas}")
        print("Applying 50 RPS load during degraded cluster state...")
        await self.spawn_traffic(5, 50, (0.5, 0.0, 0.5))
        self.node_active = True
        self.hpa_simulate() # HPA should recreate lost pods to handle load.
        print(f"Replicas recovering via HPA - ML: {self.ml_replicas}, LLM: {self.llm_replicas}")
        
    async def run_scenario_4_observability(self):
        print("\n--- Scenario 4 & 5: Resource Pressure & Observability ---")
        print("Generating sustained heavy LLM batch pressure...")
        await self.spawn_traffic(5, 120, (0.0, 0.0, 1.0))
        
        collector = get_collector()
        traces = len(collector._spans)
        prom_text = metrics.to_prometheus_text()
        
        print(f"Total distributed traces captured: {traces}")
        print("Prometheus metrics successfully serialized:")
        print("  - Output Size:", len(prom_text), "bytes")
        assert traces > 0, "No traces captured"

    def print_stats(self):
        def p(arr):
            if not arr: return "N/A", "N/A", "N/A"
            arr.sort()
            p50 = arr[int(len(arr)*0.5)]
            p95 = arr[int(len(arr)*0.95)]
            p99 = arr[int(len(arr)*0.99)]
            return f"{p50:.1f}ms", f"{p95:.1f}ms", f"{p99:.1f}ms"

        ml_p50, ml_p95, ml_p99 = p(self.stats["ml_latencies"])
        rag_p50, rag_p95, rag_p99 = p(self.stats["rag_latencies"])
        llm_p50, llm_p95, llm_p99 = p(self.stats["llm_latencies"])

        print("\n[Results]")
        print(f"ML  - Success: {self.stats['ml_success']}, Fail: {self.stats['ml_fail']} | P50: {ml_p50}, P95: {ml_p95}, P99: {ml_p99}")
        print(f"RAG - Success: {self.stats['rag_success']}, Fail: {self.stats['rag_fail']} | P50: {rag_p50}, P95: {rag_p95}, P99: {rag_p99}")
        print(f"LLM - Success: {self.stats['llm_success']}, Fail: {self.stats['llm_fail']} | P50: {llm_p50}, P95: {llm_p95}, P99: {llm_p99}")
        print("Recent Autoscaler Events:", set(self.stats["autoscaling_events"][-5:]))


async def main():
    sim = EnterpriseSimulator()
    await sim.run_scenario_1_scale()
    await sim.run_scenario_2_dependency_chaos()
    await sim.run_scenario_3_k8s_failure()
    await sim.run_scenario_4_observability()
    print("\n--- ENTERPRISE SIMULATION COMPLETE ---")

if __name__ == "__main__":
    asyncio.run(main())
