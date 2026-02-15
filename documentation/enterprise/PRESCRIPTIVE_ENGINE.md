# Prescriptive Intelligence Engine Architecture

## 1. Overview

The Prescriptive Intelligence Engine moves beyond predicting *what will happen* to recommending *what to do*. It combines rule-based logic, Monte Carlo simulations, and constrained optimization to provide actionable business strategies.

## 2. Components

### 2.1 Rule-Based Recommendation Engine

A lightweight engine for real-time, deterministic advice based on thresholds.

**Workflow:**

1. **Ingest**: Real-time KPI stream (e.g., "Churn Probability > 80%").
2. **Evaluate**: Check against user-defined `automation_rules`.
3. **Prescribe**: Generate action (e.g., "Offer 20% discount coupon").

**Schema Extension:**

```sql
ALTER TABLE public.automation_rules ADD COLUMN IF NOT EXISTS prescription_template TEXT; 
-- e.g., "High Churn Risk detected for {customer_id}. Recommended Action: Send retention email."
```

### 2.2 What-If Simulation Engine

A Monte Carlo simulation module allowing users to test hypotheses (e.g., "What if we increase price by 5%?").

**Architecture:**

- **Input**: `Scenario Configuration` (Variables, Ranges).
- **Process**: Parallel execution of ML models with perturbed inputs.
- **Output**: Distribution of outcomes (P10, P50, P90).

**Schema:**

```sql
CREATE TABLE public.simulation_scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES public.workspaces(id),
    name TEXT NOT NULL,
    base_model_id TEXT NOT NULL, -- Reference to MLflow model
    variables JSONB NOT NULL, -- e.g., {"price": {"min": 10, "max": 20}}
    created_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'pending' -- pending, running, completed, failed
);

CREATE TABLE public.simulation_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_id UUID REFERENCES public.simulation_scenarios(id) ON DELETE CASCADE,
    iteration_index INT,
    input_values JSONB, -- Specific values used in this iteration
    predicted_outcome JSONB, -- Model output
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.3 Optimization Module

Uses linear programming (or SciPy) to find optimal inputs to maximize a target (e.g., Revenue) subject to constraints (e.g., Budget < $10k).

**API Contract (`POST /api/v1/optimize`):**

```json
{
  "objective": "maximize",
  "target_metric": "roi",
  "constraints": [
    {"metric": "marketing_spend", "operator": "<=", "value": 10000},
    {"metric": "churn_rate", "operator": "<=", "value": 0.05}
  ],
  "decision_variables": ["ad_spend_fb", "ad_spend_google"]
}
```

## 3. Integration with Frontend

1. **Scenario Builder UI**: Drag-and-drop interface to define simulation ranges.
2. **Results Visualization**:
    - **Distribution Plot**: Histogram of outcomes.
    - **Sensitivity Analysis (Tornado Plot)**: Showing which variable impacts the outcome most (utilizing SHAP).

## 4. Implementation Checklist

- [ ] Create `simulation_scenarios` and `simulation_results` tables.
- [ ] Implement `SimulationService` in Python (using `numpy` for vectorization).
- [ ] Create API endpoint `POST /simulations/run`.
- [ ] Build React UI for "Scenario Planning".
