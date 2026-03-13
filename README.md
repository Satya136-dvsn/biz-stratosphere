# Biz Stratosphere

**Biz Stratosphere** is an enterprise-grade, AI-powered business analytics platform designed as a comprehensive system design case study. It demonstrates modern microservice architecture, demonstrating how to seamlessly integrate Machine Learning inference, Retrieval-Augmented Generation (RAG), and Local LLM orchestration within a highly resilient, cloud-native Kubernetes deployment.

![Biz Stratosphere Dashboard Workflow](docs/portfolio/assets/dashboard-preview.png) *(Note: Placeholder for actual dashboard screenshot)*

---

## 🎯 Platform Pitch & Purpose

Biz Stratosphere isn't just an application; it's a blueprint for production-grade AI integration. It proves that complex AI workflows—combining sub-50ms predictive analytics with context-aware generative AI—can be achieved locally and securely without relying on expensive, black-box third-party APIs. 

The platform is designed to answer complex business questions (e.g., *"What is the churn risk for user A, and how can we mitigate it based on our internal playbooks?"*) by fetching structural data, predicting outcomes, searching unstructured documents, and reasoning over the combined context.

## 🏗️ High-Level Architecture

The backend utilizes an isolated microservice mesh orchestrated by Kubernetes:

1. **API Gateway:** Central routing, rate limiting, and request parallelization.
2. **ML Inference Service:** High-speed XGBoost/RandomForest predictive modeling.
3. **RAG Service:** Semantic vector search using PostgreSQL `pgvector`.
4. **LLM Orchestrator:** Generative reasoning using a local Ollama models (Llama 3/Mistral).
5. **Embedding Worker:** Asynchronous document ingestion and vectorization.

**Core Resilience Features:**
- Custom **Circuit Breakers** isolating catastrophic component failures.
- **Exponential Backoff Retries** for transient network stability.
- Dynamic scaling via **Horizontal Pod Autoscalers (HPA)**.
- Complete observability via **Prometheus, Grafana, and Jaeger (OpenTelemetry)**.

## 💻 Technology Stack

| Category | Technologies |
| :--- | :--- |
| **Backend Framework** | Python 3.11, FastAPI, Pydantic, Uvicorn |
| **Frontend Framework** | React 18, Vite, Tailwind CSS, Recharts |
| **Database & Vector Store** | PostgreSQL 16 `pgvector`, SQLAlchemy, asyncpg |
| **Machine Learning** | Scikit-Learn, XGBoost, Pandas |
| **Generative AI** | Ollama, HuggingFace Sentence Transformers |
| **Deployment & Orchestration** | Docker, Docker Compose, Kubernetes, Kustomize |
| **Observability** | Prometheus (Metrics), Grafana (Dashboards), Jaeger (Distributed Tracing) |

## 🚀 Quick Links

Explore the detailed portfolio documentation to understand the engineering decisions behind the platform:

- 📖 [System Design Case Study](docs/portfolio/case-study.md) - Deep dive into architecture, scaling, and reliability.
- 📐 [Simplified Architecture Diagrams](docs/portfolio/architecture.md) - Visual overview of the services and data flow.
- 🔄 [Request Lifecycle Walkthrough](docs/portfolio/architecture.md#request-lifecycle) - Step-by-step breakdown of a concurrent ML + RAG + LLM request.
- 🏃 [Demo & Quick Start Guide](docs/portfolio/demo-and-quickstart.md) - How to run the platform locally or on a Kubernetes cluster.
- 📜 [Full Production Architecture Whitepaper](docs/whitepaper/architecture-overview.md) - The exhaustive technical specification.

---

*This project is built and maintained as a demonstration of advanced systems engineering, scalable microservices, and applied artificial intelligence.*
