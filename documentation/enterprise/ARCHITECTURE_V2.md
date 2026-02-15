# Biz Stratosphere V2: Technical Architecture

## 1. System Overview

Biz Stratosphere V2 is a **cloud-native, event-driven Decision Intelligence Platform**. It is designed for high availability (99.9%), strict compliance (SOC2), and hybrid scalability (Docker/K8s).

### 1.1 High-Level Diagram

```mermaid
graph TD
    User[User / Client] -->|HTTPS/TLS 1.3| LB[Load Balancer (Traefik)]
    LB -->|/api| API[FastAPI Gateway]
    LB -->|/| UI[React Frontend (Vite)]
    
    subgraph "Core Services"
        API -->|Auth & RBAC| Auth[Supabase Auth]
        API -->|Inference| ML[ML Service (Python)]
        API -->|Simulation| Sim[Prescriptive Engine]
    end
    
    subgraph "Data Persistence"
        ML -->|Read/Write| DB[(PostgreSQL + pgvector)]
        ML -->|Cache| Redis[(Redis / Upstash)]
        DB -->|CDC| ETL[Airflow ETL]
    end
    
    subgraph "Decision Intelligence"
        ML -->|Log| DM[Decision Memory™]
        DM -->|Feedback| RLHF[RL Feedback Loop]
    end
    
    subgraph "Observability"
        API -->|Metrics| Prom[Prometheus]
        API -->|Logs| Loki[Loki]
        API -->|Traces| Tempo[Tempo]
    end
```

## 2. Core Modules

### 2.1 Security Layer

- **Standard**: OIDC/OAuth2 via Supabase.
- **Enterprise**: Scoped API Keys (SHA-256), Role-Based Access Control (RBAC), and Row-Level Security (RLS) for multi-tenancy.
- **Reference**: [SECURITY-ENTERPRISE.md](./SECURITY-ENTERPRISE.md)

### 2.2 Decision Memory™ Engine

- **Purpose**: Immutable audit log of AI decisions using JSONB for flexible inputs.
- **Storage**: PostgreSQL with `pgsodium` encryption for sensitive context.
- **Reference**: [DECISION_MEMORY_V2.md](./DECISION_MEMORY_V2.md)

### 2.3 Prescriptive Engine

- **Capabilities**: Rule-based automation + Monte Carlo Simulations.
- **Scaling**: Asynchronous execution via Celery/Redis.
- **Reference**: [PRESCRIPTIVE_ENGINE.md](./PRESCRIPTIVE_ENGINE.md)

### 2.4 ML Operations (MLOps)

- **Tracking**: MLflow for model registry and versioning.
- **Monitoring**: Automated drift detection (Airflow DAGs).
- **Reference**: [ML_MONITORING.md](./ML_MONITORING.md)

## 3. Data Governance

- **Lineage**: Full trace from `Source CSV` -> `ETL Job` -> `Model Input` -> `Decision`.
- **Compliance**: GDPR-ready export and deletion workflows.
- **reference**: [GOVERNANCE.md](./GOVERNANCE.md)

## 4. Infrastructure

- **Deploy**: Docker Compose (MVP) -> Kubernetes (Scale).
- **CI/CD**: GitHub Actions with `trivy` security scanning.
- **Reference**: [INFRASTRUCTURE.md](./INFRASTRUCTURE.md)

## 5. Monetization

- **Model**: Hybrid (Seat + Usage).
- **Billing**: Stripe Integration with Usage Metering in Postgres.
- **Reference**: [MONETIZATION.md](./MONETIZATION.md)
