## Why

Enterprise organizations in regulated industries (finance, healthcare, defense, and cross-border commerce) require advanced business intelligence and automated AI decision-making without exposing sensitive customer data to third-party cloud APIs. Existing platforms depend heavily on external LLM gateways, remote vector databases, and cloud-hosted microservices, introducing critical vulnerabilities: data exfiltration risk, regulatory non-compliance (GDPR, HIPAA, SOC2), network latency, rate limits, and service downtime.

This proposal introduces **scratch-zero-api-platform**, a clean-slate Zero-API Business Intelligence & AI Decision Platform engineered to operate 100% locally and offline. By eliminating all outbound network calls and replacing external cloud services with deterministic client-side engines—including local PII masking, dynamic KPI math, deterministic ML risk scoring (>80% risk flagging), in-memory RAG playbook retrieval (PB-001 to PB-004), and a local ReAct agent loop—the platform delivers sovereign, reliable, instant-response decision intelligence directly on the user device.

## What Changes

- **Zero-API Core Mandate**: Architect a standalone execution runtime with zero outbound network calls, zero external API keys, and zero cloud service dependencies.
- **Local PII Detection & Anonymization Engine**: Implement a client-side regex and heuristic PII masking filter that scrubs names, emails, phone numbers, and identifier strings prior to downstream analytics or visualization.
- **Dynamic KPI Computation Hub**: Build a dynamic KPI engine calculating churn probability, customer lifetime value (LTV), account health scores, net revenue retention (NRR), and ARR risk exposure directly in memory.
- **Client-Side Machine Learning Inference**: Provide a local deterministic ML inference engine capable of scoring account churn and distress indicators, automatically flagging accounts exhibiting >80% risk with factor attribution.
- **In-Memory Vector Store & Playbook RAG**: Create a self-contained in-memory vector index and similarity retrieval engine hosting standardized enterprise mitigation playbooks (`PB-001` through `PB-004`).
- **Deterministic ReAct Agent Orchestrator**: Implement an autonomous reasoning-and-acting orchestrator that processes complex business prompts—specifically `"Identify high-risk accounts and summarize our mitigation strategy"`—through structured Thought, Action, and Observation cycles without external LLM inference.
- **Resilience Envelope & Diagnostic Monitoring**: Provide local fallback chains, strict validation boundaries, zero-crash error boundaries, and real-time execution audit logs.

## Capabilities

### New Capabilities
- `zero-api-workflow`: End-to-end zero-API business intelligence and AI decision platform workflow comprising PII masking, dynamic KPI calculation, local ML risk inference (>80%), in-memory RAG playbook retrieval (PB-001 to PB-004), and ReAct agent orchestration for high-risk account identification and mitigation.

### Modified Capabilities
<!-- No existing capabilities are modified; this is a clean-slate zero-API workflow capability -->

## Scope

### In-Scope
- Pure client-side/local execution runtime with zero external API dependencies.
- Automated PII masking for structured and semi-structured tabular records.
- Deterministic formula evaluation for core SaaS and enterprise BI metrics (ARR, Churn, LTV, Health Score).
- Decision-tree and heuristic proxy scoring producing risk scores from 0.00 to 1.00, flagging accounts > 0.80 (>80%).
- Full indexing and retrieval of four enterprise mitigation playbooks:
  - `PB-001`: Executive Escalation & C-Level Alignment
  - `PB-002`: Proactive Customer Outreach & Commercial Concession
  - `PB-003`: Technical Architecture Review & SLA Remediation
  - `PB-004`: Contract Restructuring & Multi-Year Renewal Incentive
- ReAct agent runtime executing iterative Thought -> Action (Tool Call) -> Observation cycles for the target query.
- In-memory data store with LocalStorage persistence fallback for offline reliability.

### Out-of-Scope
- Outbound network requests to external LLM providers (OpenAI, Anthropic, Google Gemini).
- Remote vector database hosting (Pinecone, Weaviate, Milvus, Qdrant).
- Cloud authentication services requiring active internet connectivity.
- Heavyweight multi-gigabyte neural model downloads in the client runtime.

## Success Criteria

1. **Zero External API Mandate**: 100% of platform features execute with zero network traffic emitted; network isolation tests pass with zero failed requests or timeouts.
2. **PII Masking Compliance**: 100% of sensitive fields (names, email addresses, phone numbers, internal account identifiers) are sanitized with deterministic masks before reaching analytical or agent components.
3. **Dynamic KPI Accuracy**: Dynamic KPI calculations match exact mathematical definitions across test datasets with 0% divergence.
4. **Local ML Risk Flagging**: All accounts exhibiting simulated or calculated distress metrics exceeding the 80% (0.80) threshold are flagged with high-risk priority and attributed risk factors.
5. **RAG Playbook Retrieval Precision**: RAG queries for high-risk mitigation correctly retrieve playbooks `PB-001`, `PB-002`, `PB-003`, and `PB-004` ranked by semantic and categorical relevance.
6. **ReAct Orchestrator Execution**: The query *"Identify high-risk accounts and summarize our mitigation strategy."* successfully triggers the complete ReAct cycle (Thought -> Action -> Observation -> Final Synthesis) producing an actionable executive summary with zero unhandled exceptions.
7. **OpenSpec Validation**: All OpenSpec artifacts pass validation via `openspec validate scratch-zero-api-platform` with 4/4 artifacts valid.

## Impact

- **Security & Compliance**: Eliminates third-party data egress risks; complies out-of-the-box with strict data residency and isolation protocols.
- **System Architecture**: Introduces clean separation between UI components, local reactive storage, local inference engines, and autonomous agent loops.
- **Performance**: Zero network roundtrips result in sub-100ms response times for KPI aggregation, ML scoring, RAG retrieval, and agent reasoning.
- **Dependencies**: Operates strictly on standard browser/client-side libraries with no external API keys, tokens, or network endpoints required.
