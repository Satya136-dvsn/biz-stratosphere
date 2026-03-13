# Reliability & Resilience Strategy

Biz Stratosphere implements a "Design for Failure" paradigm. Using advanced circuit breaking, retry mechanisms, and isolation boundaries, the system ensures that component failures do not cascade into global outages.

## 1. Circuit Breaker Implementation

To protect against catastrophic failures (e.g., a database crash or an LLM container getting OOM-killed), every service-to-service communication is wrapped in a custom, stateful `CircuitBreaker`.

### State Machine Behavior:
- **CLOSED:** Normal operation. Requests flow freely.
- **OPEN:** Triggered when the `failure_threshold` is met. Fast-fails all subsequent requests instantly (raising `CircuitBreakerError`) to shed load and prevent thread lockup.
- **HALF-OPEN:** After the `recovery_timeout`, a limited number of test requests are allowed through. If they succeed (`success_threshold`), the circuit closes. If they fail, it re-opens.

### Configuration Examples:
- **API Gateway → LLM Orchestrator:**
  - `failure_threshold`: 5 errors
  - `recovery_timeout`: 5 seconds
  - *Mitigation:* Gateway returns a cached response or a degraded service message instead of hanging the client request.
- **RAG Service → PostgreSQL:**
  - `failure_threshold`: 3 errors
  - `recovery_timeout`: 2 seconds
  - *Mitigation:* RAG service returns an empty context list; downstream LLM generates an answer without context rather than failing entirely.

## 2. Retry Policies & Exponential Backoff

For transient network errors or temporary resource exhaustion (e.g., brief Kubernetes pod scheduling delays), an asynchronous `retry_with_backoff` decorator is applied to critical network boundaries.

- **Base Delay:** 100ms
- **Maximum Delay:** 2000ms
- **Maximum Attempts:** 3 to 5 (depending on service criticality)
- **Jitter:** Applied to prevent the "thundering herd" problem when multiple pods retry simultaneously.

## 3. Kubernetes Autoscaling (HPA)

The platform utilizes Kubernetes Horizontal Pod Autoscalers (HPA) to dynamically adjust compute resources based on real-time utilization.

| Service | Min Pods | Max Pods | Target CPU | Scale-Down Stabilization |
| :--- | :---: | :---: | :---: | :--- |
| `api-gateway` | 2 | 8 | 70% | 120 seconds |
| `ml-inference` | 2 | 6 | 60% | 180 seconds |
| `llm-orchestrator` | 2 | 6 | 65% | 120 seconds |
| `rag-service` | 2 | 6 | 65% | 120 seconds |
| `embedding-worker` | 1 | 4 | 70% | 300 seconds (Batch retained) |

*Note: The `embedding-worker` has a much longer scale-down stabilization window to ensure background batch jobs are not interrupted abruptly.*

## 4. Phase 8 Chaos & Load Testing Results

Extensive chaos engineering validated the reliability of these mechanisms:

1. **Pod Deletion:** Random pod termination across all tiers resulted in an average recovery time of `< 2 seconds` with zero dropped client requests (thanks to client-side retries and Kubernetes Service routing).
2. **Cascading Failure Prevention:** A simulated hard crash of the `rag-service` successfully isolated the failure. The `ml-inference` tier remained at 100% availability, and the `llm-orchestrator` degraded gracefully.
3. **Resource Exhaustion:** Under 200 concurrent user requests, the circuit breakers correctly shed load when latencies breached the P99 budget (e.g., > 6000ms for full pipeline), preventing total cluster memory exhaustion.

**Final Reliability Assessment:** Passed with zero critical architectural flaws.
