## Purpose

Provides formal behavioral requirements for an end-to-end Zero-API Business Intelligence & AI Decision Platform workflow, incorporating client-side PII sanitization, dynamic KPI calculation, local deterministic ML risk scoring (>80% risk flag), in-memory RAG playbook retrieval (PB-001 to PB-004), and autonomous ReAct agent orchestration with zero external cloud dependencies.

## ADDED Requirements

### Requirement: Client-Side PII Detection and Masking
The system SHALL detect and mask personally identifiable information (PII) including individual names, email addresses, phone numbers, and identifier strings prior to downstream analytics, vector indexing, or user display.

#### Scenario: Masking customer emails and names in account records
- **WHEN** raw account datasets containing customer names, emails, or phone numbers are loaded into the platform
- **THEN** the system sanitizes all identifiable fields using deterministic pseudonyms and masked patterns (e.g., `[EMAIL_MASKED]`, `[NAME_MASKED]`) while preserving relational foreign keys and analytical dimensions

#### Scenario: Preventing PII leakage into agent prompt context
- **WHEN** the ReAct agent accesses account records to form observations
- **THEN** the observations contain only sanitized identifiers and metrics, preventing raw PII from entering reasoning traces or log outputs

### Requirement: Dynamic KPI Calculation Engine
The system SHALL calculate core business intelligence key performance indicators (KPIs) dynamically in memory from raw account telemetry, including Annual Recurring Revenue (ARR), Churn Probability, Customer Lifetime Value (LTV), Account Health Score, and Risk Exposure.

#### Scenario: Calculating account health score and churn probability
- **WHEN** account operational metrics (usage trends, support ticket volume, payment recency, contract days remaining) are evaluated
- **THEN** the system dynamically computes an account health score (0-100) and churn probability (0.00-1.00) using deterministic weighted formula models without external computation endpoints

#### Scenario: Dynamic aggregate portfolio exposure calculation
- **WHEN** portfolio filters are adjusted or new account records are ingested
- **THEN** the system instantly recalculates total ARR at risk, average portfolio health score, and high-risk count across the active dataset

### Requirement: Local ML Inference and Risk Flagging (>80% Threshold)
The system SHALL execute deterministic machine learning inference locally to classify account retention risk and MUST automatically flag any account exhibiting a risk score greater than 80% (0.80).

#### Scenario: Flagging accounts with risk score exceeding 80%
- **WHEN** the local ML inference engine scores an account and generates a risk probability strictly greater than 0.80 (>80%)
- **THEN** the system marks the account with a `CRITICAL_RISK` flag, assigns highest escalation priority, and exposes feature attribution factors explaining why the score exceeded 80%

#### Scenario: Sub-80% risk classification
- **WHEN** an account is evaluated and generates a risk score less than or equal to 0.80
- **THEN** the system classifies the account into its appropriate risk tier (`LOW_RISK` for <= 0.30, `MEDIUM_RISK` for 0.31-0.60, `ELEVATED_RISK` for 0.61-0.80) without triggering critical escalation flags

### Requirement: In-Memory RAG Playbook Retrieval (PB-001 to PB-004)
The system SHALL maintain an in-memory vector index of standardized enterprise mitigation playbooks and MUST retrieve relevant playbooks (PB-001 through PB-004) based on risk factors and account distress profiles without external vector database APIs.

#### Scenario: Indexing standardized enterprise mitigation playbooks
- **WHEN** the RAG subsystem initializes
- **THEN** it indexes playbooks PB-001 (Executive Escalation & C-Level Alignment), PB-002 (Proactive Outreach & Pricing Concession), PB-003 (Technical Architecture Review & SLA Remediation), and PB-004 (Contract Restructuring & Renewal Incentive) into the local vector index

#### Scenario: Retrieving matching playbooks for high-risk accounts
- **WHEN** a retrieval query or agent tool call requests mitigation strategies for high-risk or churn-flagged accounts
- **THEN** the system performs local cosine similarity search across the in-memory playbook index and returns ranked playbook matches with full action steps and timeline recommendations

### Requirement: Deterministic ReAct Agent Orchestration
The system SHALL provide an autonomous Reason-and-Act (ReAct) agent orchestrator that executes multi-step Thought, Action, and Observation cycles entirely client-side without external LLM API calls, specifically fulfilling the query: "Identify high-risk accounts and summarize our mitigation strategy."

#### Scenario: Orchestrating high-risk account identification and mitigation query
- **WHEN** a user submits the prompt "Identify high-risk accounts and summarize our mitigation strategy."
- **THEN** the ReAct agent executes a sequential plan: Thought 1 (identify accounts with risk > 80%), Action 1 (invoke local ML filter tool), Observation 1 (receive list of flagged accounts), Thought 2 (retrieve appropriate mitigation playbooks), Action 2 (invoke RAG playbook retrieval tool for PB-001 to PB-004), Observation 2 (receive matched playbooks), and generates a final executive synthesis mapping each flagged account to its specific playbook and action plan

#### Scenario: Fallback and error containment in ReAct loop
- **WHEN** an unexpected data format or missing attribute is encountered during an agent action step
- **THEN** the agent falls back to safe default heuristics, logs an observation warning, and completes the synthesis without terminating or crashing the runtime
