# Biz Stratosphere

**Biz Stratosphere** is an enterprise-grade, AI-powered business analytics platform designed as a comprehensive system design case study. It demonstrates modern microservice architecture, demonstrating how to seamlessly integrate Machine Learning inference, Retrieval-Augmented Generation (RAG), and Local LLM orchestration within a highly resilient, cloud-native Kubernetes deployment.

![Biz Stratosphere Dashboard Workflow](docs/portfolio/assets/dashboard-preview.png) *(Note: Placeholder for actual dashboard screenshot)*

---

## 🎯 Platform Pitch & Purpose

Biz Stratosphere isn't just an application; it's a blueprint for production-grade AI integration. It proves that complex AI workflows—combining sub-50ms predictive analytics with context-aware generative AI—can be achieved locally and securely without relying on expensive, black-box third-party APIs.

The platform is designed to answer complex business questions (e.g., *"What is the churn risk for user A, and how can we mitigate it based on our internal playbooks?"*) by fetching structural data, predicting outcomes, searching unstructured documents, and reasoning over the combined context.

## 🏗️ High-Level Architecture

The backend utilizes an isolated microservice mesh orchestrated by Kubernetes. We have recently introduced an **AI Agent Orchestration Layer** that can plan, execute tools, and reason over multi-step decisions.

1. **API Gateway:** Central routing, rate limiting, and request parallelization.
2. **Agent Controller (LLM Orchestrator):** Multi-step ReAct reasoning, orchestrating underlying microservices as tools.
3. **ML Inference Service:** High-speed XGBoost/RandomForest predictive models exposed as the `ml_predict` tool.
4. **RAG Service:** Semantic vector search using PostgreSQL `pgvector` exposed as the `rag_retrieve` tool.
5. **Embedding Worker:** Asynchronous document ingestion and vectorization.

### 10-Second Agent Architecture

![Biz Stratosphere Agent Diagram](docs/agent_architecture.md)
*(View `docs/agent_architecture.md` for the Mermaid source)*

**Core Resilience Features:**
- Custom **Circuit Breakers** isolating catastrophic component failures limit blast radius.
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

## ⚙️ Backend Configuration

### API Gateway – Authentication Setup

The API Gateway validates every request using a **Supabase JWT** signed with your project's JWT Secret (HS256). The secret must be configured before running the backend in production. This is a deliberately strict **fail-safe**: without the secret the gateway returns `503` rather than silently granting open access.

#### Getting your `SUPABASE_JWT_SECRET`

1. Open your project in the [Supabase Dashboard](https://app.supabase.com).
2. Go to **Project Settings → API**.
3. Scroll to the **JWT Settings** section and copy the **JWT Secret** value.
4. Set it as an environment variable for the API Gateway service:

```bash
# .env.production  (see .env.production.example for the full template)
SUPABASE_JWT_SECRET=your-jwt-secret-from-supabase-dashboard
```

> **⚠️ Important:** The `SUPABASE_JWT_SECRET` is **not** the same as the `SUPABASE_ANON_KEY`. The anon key is for client-side SDK use; the JWT secret is used by the gateway to cryptographically verify signed tokens.

#### Local / Demo Development (No JWT Required)

For local development and demos you can bypass JWT validation entirely by setting `DEMO_MODE=true`. The gateway then returns a fixed demo identity for all requests without validating tokens.

```bash
# .env.local
DEMO_MODE=true   # auth disabled — for local development only
```

> **🔴 Never set `DEMO_MODE=true` in a production environment.** The gateway logs a startup warning when demo mode is active so it cannot go unnoticed.

#### Startup Validation

The gateway validates its configuration at startup and emits clear log messages:

| Condition | Startup behaviour |
|---|---|
| `SUPABASE_JWT_SECRET` set, `DEMO_MODE=false` | ✅ Normal — JWT validation enforced |
| `DEMO_MODE=true` | ⚠️ Warning logged — auth disabled (local dev only) |
| `SUPABASE_JWT_SECRET` missing, `DEMO_MODE=false` | 🔴 Error logged — gateway starts but every protected route returns `503` until secret is set |

### Frontend Build Configuration

`vite.config.ts` contains two categories of changes that are both intentional and preserved:

| Setting | Value | Reason |
|---|---|---|
| `import { defineConfig } from "vite"` | _preserved_ | Custom local fix: avoids the `vitest/config` import that caused Vite transformation errors under Node v24 |
| `VitePWA({})` | _commented out_ | Custom local fix: disabled to resolve core build issues; can be re-enabled when PWA support is needed |
| `build.minify` | `true` | Production improvement: enables Terser/esbuild minification for smaller bundle sizes |
| `build.sourcemap` | `process.env.NODE_ENV !== 'production'` | Production improvement: sourcemaps generated in dev/staging but omitted from production builds |

---

## 🚀 Quick Links

Explore the detailed portfolio documentation to understand the engineering decisions behind the platform:

- 📖 [System Design Case Study](docs/portfolio/case-study.md) - Deep dive into architecture, scaling, and reliability.
- 📐 [Simplified Architecture Diagrams](docs/portfolio/architecture.md) - Visual overview of the services and data flow.
- 🔄 [Request Lifecycle Walkthrough](docs/portfolio/architecture.md#request-lifecycle) - Step-by-step breakdown of a concurrent ML + RAG + LLM request.
- 🏃 [Demo & Quick Start Guide](docs/portfolio/demo-and-quickstart.md) - How to run the platform locally or on a Kubernetes cluster.
- 📜 [Full Production Architecture Whitepaper](docs/whitepaper/architecture-overview.md) - The exhaustive technical specification.

---

*This project is built and maintained as a demonstration of advanced systems engineering, scalable microservices, and applied artificial intelligence.*
