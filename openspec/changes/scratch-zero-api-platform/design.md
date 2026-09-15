## Context

Modern enterprise business intelligence and decision automation platforms typically rely on cloud ecosystems: remote database connections (PostgreSQL/Supabase), third-party vector databases (Pinecone/Milvus), and hosted large language models (OpenAI, Anthropic, Gemini). In air-gapped, security-constrained, or regulated environments, this dependency creates critical roadblocks: potential PII data leaks, network latency, unpredictable API rate limits, and catastrophic service failure during offline operation.

The **scratch-zero-api-platform** architecture re-engineers every intelligence layer into an autonomous, client-side, zero-network runtime. (See [proposal.md](file:///c:/biz-stratosphere-main/openspec/changes/scratch-zero-api-platform/proposal.md) for full motivation and scope).

## Goals / Non-Goals

**Goals:**
- Enforce a strict **Zero External API Mandate**: zero outbound HTTP/HTTPS calls required for core BI, ML inference, RAG retrieval, and ReAct agent decision workflows.
- Provide end-to-end data flow with client-side PII masking before analytics and indexing.
- Implement an ultra-fast dynamic KPI calculation engine running sub-5ms aggregations in memory.
- Provide a deterministic client-side ML inference engine that evaluates account churn risk and automatically flags accounts exceeding the 80% (0.80) threshold.
- Deliver an in-memory vector index hosting standardized mitigation playbooks (`PB-001` to `PB-004`) with deterministic cosine similarity ranking.
- Implement an autonomous ReAct agent loop executing Thought -> Action -> Observation cycles for the target query: *"Identify high-risk accounts and summarize our mitigation strategy."*
- Define a comprehensive resilience envelope guaranteeing zero-crash operation under edge cases, malformed data, or memory pressure.

**Non-Goals:**
- Completely removing the ability to configure live cloud APIs when an enterprise explicitly enables them in hybrid mode.
- Embedding multi-gigabyte neural weight checkpoints (e.g. LLaMA/Gemma) into browser bundles.
- Implementing heavy server-side distributed training clusters.

## Decisions

### 1. Strict Zero External API Mandate & Sovereign Client Runtime
- **Rationale**: By enforcing that all data processing, PII scrubbing, statistical inference, vector search, and agent orchestration execute within the browser/client memory space, data sovereignty is guaranteed. No customer data leaves the local memory boundary.
- **Alternatives Considered**: 
  - *Self-hosted local microservices (Docker/FastAPI)*: Requires Docker or Python daemon running on user host machine, which fails on locked-down developer or auditor workstations without admin rights.
  - *Cloud proxy with anonymization*: Still introduces outbound network traffic and external server dependency.

### 2. In-Memory Vector Store with Synthetic Deterministic Embeddings
- **Rationale**: An in-memory vector store utilizing TF-IDF tokenization, n-gram hashing, and vector normalization provides sub-millisecond cosine similarity ranking over business documents and playbooks without requiring multi-megabyte WASM models or remote vector databases.
- **Alternatives Considered**: 
  - *Transformers.js / WebAssembly ONNX embeddings*: Offers higher semantic nuance but adds 40-100MB download payload and significant initialization lag on lower-spec machines.
  - *Exact keyword substring search*: Lacks semantic scoring and ranking nuance needed for multi-factor playbook matching.

### 3. Deterministic ReAct Agent Engine (Thought-Action-Observation Loop)
- **Rationale**: A deterministic client-side ReAct engine implements the formal ReAct protocol (Thought, Action, Action Input, Observation, Final Answer). It invokes registered local tools (`queryHighRiskAccounts`, `calculatePortfolioKPIs`, `retrieveMitigationPlaybooks`) and synthesizes structured executive decisions predictably, without hallucination or token billing.
- **Alternatives Considered**: 
  - *Prompting external LLM over network*: Violates zero-API mandate and exposes PII.
  - *Hardcoded static template response*: Fails to react dynamically to changing account filters or newly added accounts.

### 4. Client-Side ML Inference & Factor Attribution (SHAP Proxy)
- **Rationale**: A client-side decision-tree / weighted logistic scoring pipeline evaluates multi-dimensional risk signals (health score, usage drop, support ticket spike, billing latency, contract duration) and computes precise risk scores (0.00 - 1.00). Any score > 0.80 triggers a `CRITICAL_RISK` flag along with primary factor attributions.
- **Alternatives Considered**:
  - *Remote scikit-learn REST service*: Subject to network latency and offline failure.
  - *Simple arbitrary thresholding*: Does not provide multi-factor weight calibration or attribution breakdown.

## Technical Architecture & Data Flow

```
+---------------------------------------------------------------------------------------+
|                                ZERO-API PLATFORM RUNTIME                              |
+---------------------------------------------------------------------------------------+
                                           |
                                [Raw Ingested Data]
                                           |
                                           v
                 +---------------------------------------------------+
                 | 1. PII Detection & Anonymization Engine           |
                 | - Deterministic regex & token replacement         |
                 | - Masks: Email, Name, Phone, Account ID          |
                 +---------------------------------------------------+
                                           |
                                   [Sanitized Records]
                                           |
                     +---------------------+---------------------+
                     |                                           |
                     v                                           v
+------------------------------------------+ +------------------------------------------+
| 2. Dynamic KPI Engine                    | | 3. Local ML Inference Engine             |
| - ARR at Risk Aggregation                | | - Calibrated Risk Scoring (0.0 - 1.0)    |
| - Health Score (0-100)                   | | - Flag >80% Critical Risk Threshold      |
| - Churn Probability Formula              | | - SHAP-like Factor Attribution           |
+------------------------------------------+ +------------------------------------------+
                     |                                           |
                     +---------------------+---------------------+
                                           |
                                [High-Risk Signal]
                                           |
                                           v
                 +---------------------------------------------------+
                 | 4. In-Memory Vector Store & Playbook RAG          |
                 | - Standardized Playbooks (PB-001 to PB-004)       |
                 | - Normalized synthetic vector embeddings          |
                 | - Deterministic Cosine Similarity Search          |
                 +---------------------------------------------------+
                                           |
                            [Ranked Mitigation Playbooks]
                                           |
                                           v
                 +---------------------------------------------------+
                 | 5. ReAct Agent Orchestration Loop                 |
                 | Query: "Identify high-risk accounts and summarize |
                 |         our mitigation strategy."                 |
                 | - Thought: Reason about accounts & risk > 80%     |
                 | - Action: queryHighRiskAccounts(threshold=0.80)   |
                 | - Observation: Accounts flagged with metrics      |
                 | - Thought: Match accounts with playbooks          |
                 | - Action: retrieveMitigationPlaybooks(factors)    |
                 | - Observation: PB-001, PB-002, PB-003, PB-004     |
                 | - Thought: Synthesize executive action plan       |
                 | - Final Answer: Structured Executive Briefing     |
                 +---------------------------------------------------+
                                           |
                                           v
                 +---------------------------------------------------+
                 | 6. Reactive UI & Decision Memory Dashboard        |
                 | - Zero-API status indicator badge                 |
                 | - Interactive metrics, risk tables & action logs  |
                 +---------------------------------------------------+
```

### Standardized Enterprise Mitigation Playbooks

The in-memory RAG index stores four pre-configured enterprise mitigation playbooks:
1. **`PB-001` - Executive Escalation & C-Level Alignment**:
   - *Target*: Accounts with ARR > $100k and Churn Risk > 80%.
   - *Actions*: Sponsor alignment call within 24h, roadmap acceleration agreement, weekly executive steering.
2. **`PB-002` - Proactive Customer Outreach & Commercial Concession**:
   - *Target*: Mid-market accounts experiencing budget tightening or price sensitivity.
   - *Actions*: Immediate CSM check-in, flexible billing cycle adjustment, temporary module discount.
3. **`PB-003` - Technical Architecture Review & SLA Remediation**:
   - *Target*: Accounts with >5 open P1/P2 support tickets or degraded uptime satisfaction.
   - *Actions*: Dedicated senior solutions architect assignment, 48h emergency patch audit, SLA credit issuance.
4. **`PB-004` - Contract Restructuring & Multi-Year Renewal Incentive**:
   - *Target*: Accounts with contract renewal due within 90 days and usage stagnation.
   - *Actions*: Tier restructuring, multi-year lock-in with 15% discount, complimentary enterprise onboarding tokens.

## In-Memory Vector Fallback

When operating in zero-API standalone mode, the platform utilizes an optimized local vector engine:
- **Index Structure**: In-memory inverted index combined with fixed-dimensional normalized vector representations.
- **Embedding Generation**: Deterministic token hash projection with inverse document frequency (TF-IDF) weighting, mapping text chunks into normalized unit vectors $\vec{v} \in \mathbb{R}^{d}$.
- **Similarity Metric**: Cosine similarity $\cos(\theta) = \frac{\vec{u} \cdot \vec{v}}{\|\vec{u}\| \|\vec{v}\|}$, executed in JavaScript typed arrays (`Float32Array`) for sub-millisecond execution.
- **Fallback Guarantee**: If zero external vector API is reachable, the in-memory engine seamlessly activates with 0ms transition time and zero network calls.

## Resilience Envelope

To ensure uninterrupted uptime and rock-solid stability, the platform establishes five resilience boundaries:

1. **Zero-Network Isolation Guard**: An interceptor wraps all underlying data fetching hooks; if any remote call fails or is unconfigured, it instantly routes to the local mock database and in-memory caches without throwing uncaught exceptions.
2. **Deterministic Data Engine**: Seed data is automatically synthesized and re-populated into LocalStorage if the local store is ever found empty or corrupted.
3. **Input Sanitization & Schema Validation**: Ingested datasets undergo type coercion and validation; missing numerical values default to medians, and missing strings are set to safe sentinels.
4. **Agent Execution Guardrails**: ReAct agent loops enforce a hard limit of 5 iterations to prevent infinite loops, with automatic fallback to heuristic synthesis if a step encounters unexpected data.
5. **Component-Level Error Boundaries**: React error boundaries isolate chart components, prediction tables, and chat interfaces so an isolated rendering glitch never crashes the main dashboard.

## Risks / Trade-offs

- **[Risk]** In-memory storage volatile across browser profile resets.
  - → **Mitigation**: Automatically synchronize critical entities (decisions, custom rules, configurations) to LocalStorage and auto-seed if empty.
- **[Risk]** Synthetic local vector embeddings do not capture deep linguistic metaphors as effectively as 1536-dimensional neural models.
  - → **Mitigation**: Standardized playbooks utilize precise enterprise domain keywords and structured category tags (`executive`, `pricing`, `technical`, `contract`), maximizing cosine similarity precision.
- **[Risk]** Local calculation of large datasets (>50,000 rows) could cause main thread UI stutters.
  - → **Mitigation**: Implement batch chunking, memoized selectors, and Web Worker offloading for dataset operations exceeding 5,000 rows.
