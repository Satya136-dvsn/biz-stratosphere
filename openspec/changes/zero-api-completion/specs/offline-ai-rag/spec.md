## Purpose

Provides an offline deterministic business intelligence assistant and local keyword-based semantic retrieval engine for AI chat and decision workflows.

## ADDED Requirements

### Requirement: Offline Business Intelligence Assistant
The system SHALL answer analytical business questions using deterministic heuristic logic and loaded dataset metrics when no LLM API is configured.

#### Scenario: User queries customer churn risk
- **WHEN** user asks "What is the churn risk of Northstar Logistics?" in AI Chat
- **THEN** the offline assistant calculates the churn score, identifies risk factors, and provides recommended mitigation steps

### Requirement: Local semantic embeddings and retrieval
The system SHALL generate synthetic vector embeddings locally to support context search over uploaded CSV files without external embedding APIs.

#### Scenario: Semantic retrieval over dataset
- **WHEN** user uploads a CSV and triggers RAG search
- **THEN** the system generates local vector embeddings and returns the most relevant rows based on cosine similarity
