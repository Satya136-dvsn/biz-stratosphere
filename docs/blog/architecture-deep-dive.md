# How We Built a Decision Intelligence Platform (Not Just Another Dashboard)

*A technical deep dive into Biz Stratosphere's architecture — Decision Memory™, SHAP explainability, and why we chose PostgreSQL over a dedicated ML database.*

---

## The Problem Nobody Talks About

Every BI tool on the market does the same thing: show you what happened. Some predict what *will* happen. Almost none tell you what to *do about it* — and **zero** of them remember what you did last time.

We've all been there. Your ML model flags a customer as "82% likely to churn." You offer a discount. The customer stays. Six months later, a different analyst sees a similar prediction and does nothing. The customer churns.

The institutional knowledge of *which actions actually worked* was trapped in someone's head, a Slack thread, or nowhere at all.

That's why we built **Decision Memory™** — and that's what this post is about.

---

## Architecture Overview

Biz Stratosphere is a cloud-native platform built on four layers:

```
┌─────────────────────────────────────────────────┐
│                   React Frontend                │
│         (Vite + TypeScript + Recharts)           │
├─────────────────────────────────────────────────┤
│               Supabase Edge Functions            │
│         (Auth, RBAC, Row-Level Security)         │
├──────────────────┬──────────────────────────────┤
│    ML Service    │     Prescriptive Engine       │
│   (FastAPI +     │   (Monte Carlo Simulations    │
│    scikit-learn) │    + Rule Automation)          │
├──────────────────┴──────────────────────────────┤
│            PostgreSQL + pgvector                 │
│   (Decision Memory™ + Model Registry + CDC)      │
└─────────────────────────────────────────────────┘
```

### Why This Stack?

**React + Vite + TypeScript** — Hot reload is under 100ms. TypeScript catches 90% of bugs before they hit production.

**Supabase** — We get auth, Row-Level Security, realtime subscriptions, and Edge Functions without managing infrastructure. RLS means tenant data isolation happens at the *database* level, not the application level.

**PostgreSQL (not a dedicated ML database)** — This is the controversial one. We store predictions, feature vectors, SHAP values, and decision outcomes all in Postgres. Why? Because Decision Memory™ requires *relational* queries across all four: "Show me every time we predicted churn > 80%, what action was taken, and whether it worked." That's a SQL JOIN, not a vector search.

---

## Decision Memory™: The Technical Design

The core insight is simple: **AI predictions are useless without a feedback loop.**

### Schema Design

```sql
CREATE TABLE decision_memory (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id),
  workspace_id  UUID REFERENCES workspaces(id),
  
  -- What the model said
  prediction_id UUID REFERENCES ml_predictions(id),
  model_version TEXT NOT NULL,
  predicted_value JSONB NOT NULL,  -- Flexible: probability, regression, classification
  confidence    FLOAT,
  
  -- What the human did
  action_taken  TEXT,
  action_metadata JSONB,           -- e.g., {"discount_pct": 20, "channel": "email"}
  
  -- What actually happened
  outcome       TEXT,
  outcome_value JSONB,
  outcome_at    TIMESTAMPTZ,
  
  -- Audit
  created_at    TIMESTAMPTZ DEFAULT now(),
  
  -- RLS: workspace isolation
  CONSTRAINT fk_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
);

-- Enable Row-Level Security
ALTER TABLE decision_memory ENABLE ROW LEVEL SECURITY;
```

### Why JSONB?

We use `JSONB` for `predicted_value`, `action_metadata`, and `outcome_value` deliberately. Different models produce different output shapes:

- **Churn model** → `{"probability": 0.82, "label": "high_risk"}`
- **Revenue forecast** → `{"q1": 124000, "q2": 131000}`
- **Anomaly detector** → `{"anomaly_score": 0.91, "affected_metric": "support_tickets"}`

JSONB lets us store all of these without schema migrations, while still indexing with GIN for fast filtering.

### The Feedback Loop

```
Prediction → Human Action → Real-World Outcome → Model Retraining Data
     ↑                                                    │
     └────────────────────────────────────────────────────┘
```

Every decision log entry becomes a training signal. When the model is retrained, the `decision_memory` table provides ground-truth labels that no synthetic dataset can match.

---

## SHAP Explainability: Why We Don't Hide Behind "AI Said So"

One of the biggest complaints from our early testers was: *"The model says 82% churn risk, but WHY?"*

We solved this with **SHAP (SHapley Additive exPlanations)** values computed at inference time and visualized as waterfall charts:

```typescript
// SHAPWaterfall component renders feature contributions
const chartData = features
  .sort((a, b) => Math.abs(b.importance) - Math.abs(a.importance))
  .slice(0, 8)
  .map((f) => ({
    name: f.feature,
    value: f.impact === 'negative' ? -f.importance : f.importance,
    fill: f.impact === 'positive' ? 'hsl(142, 71%, 45%)' : 'hsl(0, 84%, 60%)',
  }));
```

Each prediction comes with a bar chart showing which features pushed the prediction up (green) or down (red). For a churn prediction of 82%, the analyst can see:

- **Support tickets (+18%)** — 4 tickets this month pushed risk up
- **Contract length (-8%)** — 2-year contract pulled risk down
- **Payment delays (+12%)** — 2 late payments

This isn't just a nice-to-have. In regulated industries (fintech, healthcare), *explainable AI is a compliance requirement*.

---

## Multi-Tenant Security: RLS Over Application Logic

Many platforms handle multi-tenancy in application code:

```python
# ❌ Application-level filtering (fragile)
def get_data(user):
    return db.query("SELECT * FROM data WHERE workspace_id = %s", user.workspace_id)
```

We use PostgreSQL Row-Level Security instead:

```sql
-- ✅ Database-level isolation (bulletproof)
CREATE POLICY workspace_isolation ON business_data
    USING (workspace_id IN (
        SELECT workspace_id FROM workspace_members
        WHERE user_id = auth.uid()
    ));
```

**Why this matters**: Even if there's a bug in the application code — a missing `WHERE` clause, a bad JOIN — the database *itself* prevents data leakage. It's defense-in-depth at the storage layer.

---

## What We'd Do Differently

**1. Start with a monorepo earlier.** We split the ML service into a separate repo initially. Sharing types between the Python backend and TypeScript frontend was painful until we consolidated.

**2. SHAP computation is expensive.** Real-time SHAP on large models takes 200-500ms per prediction. We're moving toward pre-computing SHAP values during batch inference and caching them in Redis.

**3. Decision Memory needs a retention policy.** Without one, the table grows unbounded. We're implementing partitioning by `created_at` with automated archival to cold storage after 12 months.

---

## Key Takeaways

1. **BI without feedback loops is just a dashboard.** Decision Memory™ closes the gap between prediction and outcome.
2. **Explainability isn't optional.** SHAP waterfall charts turn "82% churn risk" into an actionable insight.
3. **RLS > application-level filtering.** Multi-tenancy should be enforced at the database level.
4. **JSONB is underrated for ML.** Heterogeneous prediction outputs fit naturally into JSONB columns with GIN indexes.

---

*Biz Stratosphere is an open-source Decision Intelligence platform. [Try the live demo →](https://biz-stratosphere.vercel.app)*
