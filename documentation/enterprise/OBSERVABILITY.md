# Enterprise Observability Stack

## 1. Overview

To ensure production reliability, we implement the "Three Pillars of Observability": Logs, Metrics, and Traces. We standardize on **OpenTelemetry (OTel)** for instrumentation and the **LGTM Stack** (Loki, Grafana, Tempo, Mimir) or standard Prometheus/ELK for storage/visuals.

## 2. Architecture

### 2.1 Logging (Structured)

- **Format**: JSON-structured logs are mandatory for all services.
- **Fields**: All logs must include `trace_id`, `span_id`, `service_name`, `workspace_id`, and `user_id`.
- **Level**: `INFO` for production, `DEBUG` dynamically togglable.

**Example (Python implementation):**

```python
import structlog
logger = structlog.get_logger()
logger.info("prediction_generated", decision_id="uuid", model_version="v2", duration_ms=45)
```

### 2.2 Metrics (Prometheus)

- **Standard**: RED Method (Rate, Errors, Duration).
- **Custom Metrics**:
  - `decision_memory_writes_total`: Counter
  - `ml_inference_duration_seconds`: Histogram
  - `active_simulations_count`: Gauge

### 2.3 Distributed Tracing (Tempo/Jaeger)

- **Propagation**: W3C Trace Context headers injected into all HTTP/gRPC requests.
- **Coverage**: Full trace from React (Frontend) -> FastAPI (ML Service) -> Postgres (DB).
- **Instrumentation**: Auto-instrumentation for FastAPI, SQLAlchemy, and Requests.

## 3. Health Checks & Readiness

Every service must expose:

- `/health`: Shallow check (returns 200 OK).
- `/ready`: Deep check (checks DB connection, Redis, downstream dependencies).

## 4. Alerting Rules

- **High Error Rate**: > 1% 5xx errors over 5m.
- **High Latency**: p99 > 2s over 5m.
- **Saturation**: CPU/Memory > 80%.

## 5. Implementation Checklist

- [ ] Add `structlog` to Python dependencies.
- [ ] Configure `prometheus-fastapi-instrumentator`.
- [ ] Add OpenTelemetry SDK to React frontend.
- [ ] Deploy Grafana Agent to collect logs/metrics in K8s/Docker.
