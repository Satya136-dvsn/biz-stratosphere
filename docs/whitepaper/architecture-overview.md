# Biz Stratosphere: Production Architecture Overview

## Executive Summary
Biz Stratosphere is an AI-powered business analytics platform built on a highly resilient, cloud-native microservices architecture. Designed to process complex analytical queries with minimum latency, the platform integrates Machine Learning inference, Retrieval-Augmented Generation (RAG), and Large Language Model (LLM) orchestration into a single, cohesive user experience.

The system is deployed on Kubernetes, employing aggressive autoscaling, circuit-breaker isolation, and comprehensive observability to achieve an enterprise-grade reliability standard.

## Microservice Architecture & Responsibilities

The backend is composed of five distinct microservices, communicating via strictly defined REST API contracts and orchestrated by Kubernetes Service Discovery.

### 1. API Gateway (`api-gateway`)
- **Role:** The singular entry point for all frontend traffic.
- **Responsibilities:** 
  - Request routing and API contract enforcement.
  - Aggregating data from backend services (e.g., parallelizing ML predictions and RAG queries).
  - Enforcing global rate limits and authentication.
  - Exposing fallback responses and graceful degradation when upstream services fail.

### 2. ML Inference Service (`ml-inference`)
- **Role:** High-performance predictive modeling engine.
- **Responsibilities:**
  - Serving XGBoost and Random Forest models (e.g., customer churn prediction, revenue forecasting).
  - In-memory feature preprocessing and scaling.
  - Returning sub-50ms predictions.
  - **Contract:** Unaffected by NLP or generative failures; strictly isolated from LLM workloads.

### 3. RAG Retrieval Service (`rag-service`)
- **Role:** Semantic search and knowledge retrieval.
- **Responsibilities:**
  - Querying PostgreSQL `pgvector` for semantic similarity against indexed business documents.
  - Re-ranking search results based on contextual relevance and recency.
  - Returning optimized context snippets for downstream LLM generation.

### 4. LLM Orchestrator (`llm-orchestrator`)
- **Role:** Generative AI coordinator.
- **Responsibilities:**
  - Managing interactions with the local Ollama execution engine.
  - Constructing optimized prompt chains using context injected from the RAG service.
  - Managing model context windows and token streaming back to the API Gateway.

### 5. Embedding Worker (`embedding-worker`)
- **Role:** Asynchronous background processing.
- **Responsibilities:**
  - Ingesting new business documents and reports.
  - Segmenting text and generating vector embeddings.
  - Upserting vectorized data into the PostgreSQL `pgvector` database.

## Request Lifecycle & Data Flow

1. **Ingress:** A client application sends an HTTP request to the configured Ingress Controller (e.g., `api.biz-stratosphere.local/api/v1/analyze`).
2. **Gateway Processing:** The `api-gateway` receives the request. Concurrently, it dispatches calls to the `ml-inference` service (for predictive metrics) and the `rag-service` (for historical context).
3. **Data Retrieval:** The `rag-service` queries the `postgres` database via `pgvector` and returns the top relevant text snippets.
4. **LLM Generation:** The gateway forwards the ML predictions and RAG context to the `llm-orchestrator`.
5. **Inference Execution:** The orchestrator formats a strict system prompt and streams it to the stateful `ollama` container, retrieving the generated insights.
6. **Egress:** The gateway compiles the final payload (predictions + generative analysis) and returns a unified JSON response to the client.

## Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **API Framework** | FastAPI (Python 3.11), Pydantic, Uvicorn |
| **Database** | PostgreSQL 16 with `pgvector` extension |
| **Machine Learning** | Scikit-Learn, XGBoost, Pandas |
| **Generative AI**| Ollama (Llama 3 / Mistral), HuggingFace Transformers |
| **Containerization** | Docker, Docker Compose |
| **Orchestration** | Kubernetes, Kustomize, Horizontal Pod Autoscalers |
| **Observability** | Prometheus, Grafana, Jaeger (OpenTelemetry) |
