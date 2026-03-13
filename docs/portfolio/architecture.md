# Simplified Architecture & Request Lifecycle

Biz Stratosphere is built on a loosely-coupled, highly-cohesive microservice architecture. 

## High-Impact Architecture

At its core, the platform splits workloads into domain-specific services to prevent resource contention. Computationally heavy ML inference is isolated from memory-heavy LLM generation.

```mermaid
graph TD
    Client((Client App))
    
    subgraph K8s Cluster [Kubernetes Cluster]
        ingress[Ingress Controller]
        
        GW[API Gateway]
        
        subgraph Compute Tier
            ML[ML Service<br/>(XGBoost)]
            RAG[RAG Service<br/>(Semantic Search)]
            ORCH[LLM Orchestrator<br/>(Prompt Engine)]
        end
        
        subgraph Data Tier
            DB[(PostgreSQL<br/>with pgvector)]
            LLM[[Ollama<br/>(Local Llama3)]]
        end
    end
    
    Client -->|HTTPS| ingress
    ingress --> GW
    
    GW -->|REST| ML
    GW -->|REST| RAG
    GW -->|REST| ORCH
    
    RAG -->|SQL| DB
    ORCH -.->|Stream| LLM
    
    style K8s Cluster fill:#f8f9fa,stroke:#dee2e6,stroke-dasharray: 5 5
    style GW fill:#e3f2fd,stroke:#2196f3
    style Compute Tier fill:#e8f5e9,stroke:#4caf50
    style Data Tier fill:#fff3e0,stroke:#ff9800
```

---

## The 400ms Problem: Request Lifecycle Walkthrough

To provide a seamless UX, the system must gather ML predictions, search vectors, and formulate an LLM prompt as fast as possible. 

We solve this using **Aggressive Parallelization** at the API Gateway level.

### 1. Ingress & Dispatch (0ms - 20ms)
The user submits a complex analytical query (e.g., *"Why is User ID 4522 at risk of churning?"*). The API Gateway intercepts this request and simultaneously forks two asynchronous tasks.

### 2. Parallel Processing (20ms - 150ms)
- **Task A (ML Service):** The Gateway asks the ML service for User 4522's churn probability. The XGBoost model calculates a prediction (`Risk: 87%`) in ~50ms.
- **Task B (RAG Service):** Concurrently, the Gateway passes the query to the RAG service. The query is vectorized and compared against business playbooks in PostgreSQL via `pgvector`. It returns the top 3 mitigation strategies in ~100ms.

### 3. Contextual Assembly (150ms - 160ms)
The API Gateway awaits both tasks. Once both resolve, it bundles the structured ML result and the unstructured RAG text snippets into an enriched context payload.

### 4. LLM Orchestration & Streaming (160ms - 500ms+)
The enriched payload is sent to the LLM Orchestrator. The orchestrator structures a rigid system prompt:
>`System: You are an AI analyst. The user's churn risk is 87%. Here is the company playbook on high-risk churn: [RAG Context]. Answer the user's query.`

The orchestrator sends this to the Local Ollama engine. Within ~300ms, Ollama begins streaming the first tokens of the generated response back through the Orchestrator, through the Gateway, and directly to the Client's UI via Server-Sent Events (SSE).

### 5. Fallback States
If at Step 2, the RAG service crashes, the Gateway's **Circuit Breaker** trips. Instead of a 500 Internal Server Error, the Gateway injects an empty RAG context and proceeds to Step 4. The LLM simply answers based on the ML data alone, achieving graceful degradation.
