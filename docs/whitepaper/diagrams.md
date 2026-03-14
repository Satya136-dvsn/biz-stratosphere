# System Architecture Diagrams

Visual representations of the Biz Stratosphere deployment and data flow.

## 1. System Architecture Diagram

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#0d47a1', 'primaryTextColor': '#fff', 'primaryBorderColor': '#1565c0', 'lineColor': '#888', 'secondaryColor': '#e65100', 'tertiaryColor': '#4a148c' }}}%%
graph TD
    %% External
    Client([Client Application])
    Ingress[NGINX Ingress]

    %% Observability
    subgraph Observability Stack
        Prom[Prometheus]
        Graf[Grafana]
        Jaeg[Jaeger]
    end

    %% Stateless Application Services
    subgraph Stateless Compute Services
        GW(API Gateway)
        ML(ML Inference)
        RAG(RAG Service)
        ORCH(LLM Orchestrator)
        WORK(Embedding Worker)
    end

    %% Stateful Data Services
    subgraph Stateful Data Layer
        PG[(PostgreSQL + pgvector)]
        LLM[[Ollama LLM Engine]]
    end

    %% Routing
    Client -->|HTTPS| Ingress
    Ingress -->|Route /api| GW
    Ingress -->|Route /grafana| Graf
    Ingress -->|Route /jaeger| Jaeg

    %% API Gateway Flow
    GW -->|REST + CB| ML
    GW -->|REST + CB| RAG
    GW -->|REST + CB| ORCH

    %% Backend Dependencies
    RAG -->|SQL / Vector Search| PG
    WORK -->|Batch Upsert| PG
    ORCH -->|Streamed Prompting| LLM

    %% Metrics Collection
    GW -.->|Scrape| Prom
    ML -.->|Scrape| Prom
    RAG -.->|Scrape| Prom
    ORCH -.->|Scrape| Prom
    WORK -.->|Scrape| Prom
    
    %% Dashboard
    Prom -.->|Datasource| Graf
    
    %% Traces
    GW -.->|OTLP| Jaeg
    ML -.->|OTLP| Jaeg
    RAG -.->|OTLP| Jaeg
    ORCH -.->|OTLP| Jaeg

    classDef stateless fill:#0d47a1,stroke:#1565c0,stroke-width:2px,color:#fff;
    classDef stateful fill:#e65100,stroke:#ef6c00,stroke-width:2px,color:#fff;
    classDef obs fill:#4a148c,stroke:#6a1b9a,stroke-width:2px,color:#fff;
    
    class GW,ML,RAG,ORCH,WORK stateless;
    class PG,LLM stateful;
    class Prom,Graf,Jaeg obs;
```

## 2. Request Lifecycle Data Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant G as API Gateway
    participant P as Prometheus / Jaeger
    participant M as ML Inference
    participant R as RAG Service
    participant O as LLM Orchestrator
    
    C->>G: POST /api/v1/analyze (User Context)
    activate G
    G-->>P: Start Root Trace Span
    
    par Parallel Execution
        G->>M: POST /predict (Features)
        activate M
        M-->>P: Log ML Latency Metric
        M-->>G: 200 OK (Churn Risk: 85%)
        deactivate M
    and
        G->>R: GET /retrieve (Query)
        activate R
        note over R: Query pgvector DB
        R-->>P: Log Retrieval Latency Metric
        R-->>G: 200 OK (Top 3 Snippets)
        deactivate R
    end

    G->>O: POST /generate (Predictions + Snippets)
    activate O
    note over O: Format Prompt & Query Ollama
    O-->>G: 200 OK (Streamed Analytical Response)
    deactivate O
    
    G-->>P: End Root Span & Log Gateway Metrics
    G-->>C: 200 OK (Final Combined JSON)
    deactivate G
```

## 3. Resilience / Circuit Breaker Flow

```mermaid
stateDiagram-v2
    direction LR
    
    state "Gateway Calls Upstream" as Call
    state "Upstream Processing" as Process
    state "Circuit Breaker" as CB
    
    [*] --> Call
    Call --> CB : Evaluate State
    
    state CB {
        [*] --> CLOSED
        CLOSED --> CLOSED : Request Success
        CLOSED --> OPEN : Failures > Threshold
        OPEN --> OPEN : Fast-Fail (Reject)
        OPEN --> HALF_OPEN : Recovery Timeout Exceeded
        HALF_OPEN --> CLOSED : Probe Success > Threshold
        HALF_OPEN --> OPEN : Probe Failure
    }
    
    CB --> Process : State == CLOSED or HALF_OPEN
    CB --> Fallback : State == OPEN (CircuitBreakerError)
    
    Process --> CB : Success / HTTP 500
    
    Fallback --> [*] : Return Degraded Response
    Process --> [*] : Return Standard Response
```
