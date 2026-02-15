# Decision Memory™ V2 Architecture - Enterprise Edition

## 1. Overview

Decision Memory™ is the core engine of Biz Stratosphere, providing a persistent record of all AI-driven decisions, their context, and outcomes. V2 upgrades this to an enterprise-grade system with full auditability, versioning, and feedback loops.

## 2. Enhanced Database Schema

### 2.1 Core Decision Table (`decision_memory`)

Upgraded to support complex JSON payloads and ML metadata.

```sql
CREATE TABLE public.decision_memory (
    decision_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES public.workspaces(id) NOT NULL,
    user_id UUID REFERENCES auth.users(id) NOT NULL, -- Actor
    decision_type TEXT NOT NULL CHECK (decision_type IN ('ai_chat', 'ml_prediction', 'automation')),
    
    -- Context & Input
    input_context JSONB NOT NULL DEFAULT '{}'::jsonb, -- Full prompt/features
    model_version TEXT, -- e.g., 'churn_v2.1' or 'gemini-pro'
    
    -- AI Output
    ai_recommendation JSONB, -- Structured advice
    ai_confidence_score FLOAT CHECK (ai_confidence_score BETWEEN 0 AND 1),
    shap_values JSONB, -- Feature importance for explainability
    
    -- Outcome Tracking
    human_action TEXT CHECK (human_action IN ('accepted', 'modified', 'rejected', 'ignored')),
    outcome_status TEXT DEFAULT 'pending' CHECK (outcome_status IN ('pending', 'success', 'partial', 'failure')),
    actual_outcome JSONB, -- Real-world result (e.g., {"revenue_lift": 5000})
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    evaluated_at TIMESTAMPTZ, -- When the outcome was recorded
    
    -- Indexes
    CONSTRAINT fk_workspace FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id)
);

CREATE INDEX idx_dm_workspace_type ON public.decision_memory(workspace_id, decision_type);
CREATE INDEX idx_dm_created_at ON public.decision_memory(created_at DESC);
```

### 2.2 Outcome Feedback Loop (`decision_feedback`)

Captures explicit user feedback to improve future models (RLHF).

```sql
CREATE TABLE public.decision_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    decision_id UUID REFERENCES public.decision_memory(decision_id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    feedback_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 3. Row-Level Security (RLS) Policies

### 3.1 Isolation

Ensures users only see decisions within their workspace.

```sql
ALTER TABLE public.decision_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace Isolation" ON public.decision_memory
    USING (workspace_id IN (
        SELECT workspace_id FROM public.workspace_members 
        WHERE user_id = auth.uid()
    ));
```

### 3.2 Audit Immutability

Prevents modification of historical decision records, except for outcome updates.

```sql
CREATE POLICY "Append Only Decisions" ON public.decision_memory
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Update Outcomes Only" ON public.decision_memory
    FOR UPDATE USING (
        workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
    ) WITH CHECK (
        OLD.decision_id = NEW.decision_id AND -- ID unchanged
        OLD.created_at = NEW.created_at AND -- Timestamp unchanged
        OLD.input_context = NEW.input_context -- Input unchanged
        -- Only outcome fields can change
    );
```

## 4. Integration with MLflow

- **Model Registry**: MLflow builds are tagged with `production` or `staging`.
- **Inference Service**: When generating a prediction, the service fetches the active `model_version` from MLflow and records it in `decision_memory`.
- **Drift Detection**: A scheduled job compares `input_context` distribution in `decision_memory` against the training set in MLflow to trigger retraining alerts.

## 5. Implementation Checklist

- [ ] Run migration `20260215_decision_memory_v2.sql`.
- [ ] Update ML Service to include `model_version` in response.
- [ ] Implement feedback UI in Frontend (Thumbs up/down).
- [ ] Configure `pg_cron` job for drift detection analysis.
