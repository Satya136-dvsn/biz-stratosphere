## 1. Phase 1 - Zero-API Foundation & Deterministic Data Engine

- [ ] 1.1 Implement local data persistence hub (`src/lib/localDatabase.ts`) with in-memory store and LocalStorage fallback
- [ ] 1.2 Implement client-side PII detection and masking filter scrubbing customer names, emails, and identifiers
- [ ] 1.3 Seed rich initial dataset with representative accounts, transactions, support tickets, and telemetry
- [ ] 1.4 Configure zero-API network interceptor to guarantee zero outbound network requests in standalone mode

## 2. Phase 2 - Dynamic KPI Calculation & Client-Side Feature Engineering

- [ ] 2.1 Implement dynamic KPI math engine calculating ARR, ARR at Risk, Churn Probability, LTV, and NRR
- [ ] 2.2 Implement account health score algorithm (0-100) aggregating usage velocity, ticket count, and payment recency
- [ ] 2.3 Implement aggregate portfolio summary calculator for instant sub-5ms metric recomputations
- [ ] 2.4 Add reactive state hooks (`useAccountKPIs`, `usePortfolioSummary`) for real-time dashboard subscriptions

## 3. Phase 3 - Local ML Inference Engine & Risk Flagging (>80%)

- [ ] 3.1 Implement client-side deterministic ML scoring model computing retention/churn risk probability (0.00 - 1.00)
- [ ] 3.2 Implement threshold logic flagging accounts exceeding 80% (0.80) risk with `CRITICAL_RISK` escalation tag
- [ ] 3.3 Implement client-side SHAP-like feature attribution engine isolating key drivers of high risk (e.g., ticket spike, usage decline)
- [ ] 3.4 Wire ML scoring into account table components with color-coded risk badges and factor explanation tooltips

## 4. Phase 4 - In-Memory Vector Store & Playbook RAG Retrieval (PB-001 to PB-004)

- [ ] 4.1 Create standardized mitigation playbook repository containing `PB-001`, `PB-002`, `PB-003`, and `PB-004`
- [ ] 4.2 Build in-memory vector index with TF-IDF tokenization and unit vector normalization
- [ ] 4.3 Implement deterministic cosine similarity ranking function for sub-millisecond retrieval
- [ ] 4.4 Implement `retrieveMitigationPlaybooks` retrieval tool returning ranked playbooks given account risk profiles

## 5. Phase 5 - ReAct Agent Orchestration & Natural Language Synthesis

- [ ] 5.1 Implement client-side ReAct agent runtime managing stateful Thought -> Action -> Observation cycles
- [ ] 5.2 Register local agent tools: `queryHighRiskAccounts(threshold)`, `calculatePortfolioKPIs()`, and `retrieveMitigationPlaybooks()`
- [ ] 5.3 Implement deterministic agent execution path for the query: "Identify high-risk accounts and summarize our mitigation strategy."
- [ ] 5.4 Format synthesized output into an executive decision briefing linking flagged accounts (>80% risk) to specific playbooks

## 6. Phase 6 - End-to-End Workflow Integration, Testing & Resilience Envelope Verification

- [ ] 6.1 Implement UI dashboard and AI chat components rendering the end-to-end ReAct trace and mitigation summary
- [ ] 6.2 Enforce resilience envelope with component error boundaries, input sanitization, and fallback heuristics
- [ ] 6.3 Add automated unit and integration tests verifying PII masking, KPI calculation, ML risk scoring, and RAG retrieval
- [ ] 6.4 Validate change artifacts using OpenSpec CLI and verify 4/4 artifacts valid
