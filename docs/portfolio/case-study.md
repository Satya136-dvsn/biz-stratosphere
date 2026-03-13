# System Design Case Study: Biz Stratosphere

## The Problem Statement
Modern businesses generate massive amounts of structured (databases, CRM) and unstructured (PDFs, knowledge bases, emails) data. Providing actionable, AI-driven insights requires merging traditional Machine Learning (which excels at structured predictive data) with Generative AI (which excels at parsing and summarizing unstructured text).

However, combining these technologies natively introduces significant architecture bottlenecks:
1. **Latency:** ML inference typically takes `<50ms`, while LLM generation takes `>2000ms`. Coupling them naively results in terrible UX.
2. **Reliability:** LLMs are memory-heavy and prone to timeouts or out-of-memory (OOM) errors.
3. **Cost/Privacy:** Sending sensitive business data to external APIs (OpenAI) introduces compliance risks and massive API costs at scale.

**Biz Stratosphere** was engineered to solve these problems via a robust, local-first microservice architecture.

---

## Architectural Decisions

### 1. Isolated Microservices over Monolith
Instead of a single Python backend handling everything, the system is split domain-specifically:
- `ml-inference`: Dedicated strictly to CPU-bound predictive modeling (XGBoost).
- `rag-service`: Dedicated to I/O bound database querying (Vector Search).
- `llm-orchestrator`: Dedicated to memory-heavy LLM stream management.

*Decision:* If the LLM goes out of memory, it should crash the orchestrator pod, not the ML engine. Isolation ensures partial availability.

### 2. Aggressive Parallelization at the API Gateway
The API Gateway does not wait for step 1 to finish before starting step 2. When a query is received, it queries the `ml-inference` and `rag-service` **concurrently** using `asyncio`. Both results are gathered in < 150ms and forwarded to the LLM. 

### 3. Local-First AI with Ollama and pgvector
To guarantee data privacy and zero API costs, Biz Stratosphere uses **Ollama** running Llama 3 for generation, and **pgvector** as an extension on standard PostgreSQL for vector search.
*Decision:* Bypassing dedicated vector databases (like Pinecone or Milvus) reduces architectural complexity while maintaining high performance via PostgreSQL indices (HNSW).

---

## Scaling Strategy

We utilize Kubernetes Horizontal Pod Autoscaler (HPA) to manage dynamic loads based on specific component bottlenecks.

- **CPU-Bound Scaling:** The API Gateway and ML Inference services scale linearly on CPU usage (Target: 60-70%). 
- **Memory-Bound Scaling:** The LLM Orchestrator is scaled more aggressively on memory footprint to prevent OOM errors during concurrent token generation bursts.
- **Asynchronous Batching:** The `embedding-worker` ingests documents asynchronously via a message queue paradigm. Its scale-down stabilization window is set to 300 seconds to prevent Kubernetes from killing pods mid-embedding job.

---

## Resilience & Reliability Mechanisms

Designing for failure is the core philosophy of Biz Stratosphere.

### Circuit Breakers
Network boundaries between services are guarded by custom stateful Circuit Breakers. If a service (e.g., RAG) fails 3 times consecutively, the circuit trips `OPEN`. 
*Impact:* Instead of waiting 10 seconds for a timeout and exhausting thread pools, the Gateway instantly "fast-fails" the RAG call. It then passes an empty context to the LLM, returning a degraded but successful answer based solely on ML data.

### Exponential Backoff
Transient database connection drops or network flapping are handled transparently via asynchronous `retry_with_backoff` logic, smoothing over micro-outages without failing the client request.

---

## Observability Design

To debug a highly distributed platform, deep observability is mandatory.

- **Metrics (Prometheus):** A custom FastAPI middleware injects `request_total` and `request_duration` metrics on every endpoint. Domain metrics export accurate ML inference timing vs. LLM token generation latency.
- **Distributed Tracing (Jaeger):** The platform parses and injects W3C `traceparent` headers. Because request handling is parallelized, spans successfully track the "fan-out" from the Gateway to the ML/RAG services, clearly identifying timeline bottlenecks in Jaeger UIs.
- **Visualization (Grafana):** Operator dashboards visualize the exact moment a circuit breaker trips or an HPA scaling event occurs. 

---

## Conclusion
Biz Stratosphere proves that combining advanced predictive AI and generative AI is primarily a massive **systems engineering** challenge. By applying distributed systems patterns—circuit breakers, parallel fan-out, horizontal autoscaling, and OpenTelemetry tracing—the platform achieves sub-second perceived latency and enterprise-grade reliability while maintaining 100% data privacy.
