# Decision Memory™

**Decision Memory™** is a decision intelligence primitive that turns every AI interaction into a learnable asset. Unlike traditional logging (which tracks *what* happened) or analytics (which tracks *stats*), Decision Memory tracks the **context of choice**.

## Why It Exists

In AI-driven business environments, trust is the bottleneck. To trust an agent, you must be able to:

1. Review its advice.
2. Confirm the human decision made on top of that advice.
3. Measure the outcome of that decision over time.

Decision Memory provides this closed loop.

## Core Concepts

### 1. The Decision Record

Every record contains:

- **Input Context**: What data/prompt led to the insight?
- **AI Confidence**: How certain was the system? (Score + Level)
- **Human Action**: Did the user accept, modify, or ignore it?
- **Expected Outcome**: What did we hope would happen?
- **Actual Outcome**: What actually happened? (Filled later)

### 2. Decision Triggers

We currently track decisions from:

- **AI Chat**: When a user explicitly acts on an insight ("Use Insight").
- **ML Predictions**: When a user applies a churn or revenue prediction.
- **Automation**: When a user enables a rule or triggers a manual run.

### 3. The Lifecycle

1. **Pending**: Decision recorded. Outcome unknown.
2. **Success/Failure**: Admin or System evaluates the result.
3. **Audit**: Review high-confidence failures to improve the model.

## Limitations (V1)

- **Manual Outcomes**: Currently, "Actual Outcome" must be tagged manually by Admins. Future versions will auto-correlate with metrics (e.g., did Churn actually decrease?).
- **Immutable Context**: Context snapshots are JSON blobs.

## Usage

### Recording a Decision (Devs)

```typescript
const { createDecision } = useDecisionMemory();

createDecision.mutate({
  decision_type: 'ai_chat',
  input_context: { ... },
  expected_outcome: 'Increase sales',
  human_action: 'accepted',
  ai_confidence_score: 0.9,
  ai_confidence_level: 'high'
});
```

### Reviewing Decisions (Admins)

Visit `/admin/decision-memory` to filter and audit decisions.
