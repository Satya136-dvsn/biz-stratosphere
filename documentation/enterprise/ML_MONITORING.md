# ML Monitoring & Drift Detection Strategy

## 1. Overview

To ensure the reliability of AI decisions, we must continuously monitor model performance and data distribution. This module integrates MLflow for experiment tracking and Airflow for automated retraining pipelines.

## 2. Drift Detection Architecture

### 2.1 Concept Drift vs. Data Drift

- **Data Drift**: Changes in the distribution of input features (P(X)).
- **Concept Drift**: Changes in the relationship between inputs and outputs (P(Y|X)).

### 2.2 Implementation Strategy

We will use a scheduled Airflow DAG (`detect_drift`) that runs daily.

**Workflow:**

1. **Reference Data**: Fetch baseline statistics (mean, std, distribution) from the training set stored in MLflow.
2. **Current Data**: Query `decision_memory` for the last 24 hours of inference inputs.
3. **Comparison**: Calculate Population Stability Index (PSI) or Kullback-Leibler (KL) Divergence for continuous features.
4. **Threshold**: If PSI > 0.1 for any key feature, trigger an alert.

**Schema Support:**

```sql
CREATE TABLE public.model_monitoring_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name TEXT NOT NULL,
    model_version TEXT NOT NULL,
    metric_name TEXT NOT NULL, -- e.g., 'PSI_feature_age'
    metric_value FLOAT NOT NULL,
    threshold FLOAT NOT NULL,
    status TEXT CHECK (status IN ('ok', 'warning', 'critical')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 3. Automated Retraining Loop

### 3.1 Trigger Mechanism

Retraining is triggered by:

1. **Drift Alert**: Automatically if drift exceeds critical threshold.
2. **Performance Drop**: If feedback loop (from `decision_feedback`) shows accuracy < 80%.
3. **Schedule**: Monthly fallback.

### 3.2 Airflow DAG (`retrain_model`)

1. **Extract**: Pull latest labelled data (including corrections from Decision Memory).
2. **Train**: Run `training_job` in Python.
3. **Validate**: Compare new model AUC vs current production model.
4. **Promote**: If better, tag as `staging` in MLflow and notify admin for approval.

## 4. Performance Monitoring Alerts

Using the Observability Stack (Prometheus/Grafana):

- **Latency**: Alert if p95 inference time > 500ms.
- **Error Rate**: Alert if > 1% of predictions fail.
- **Drift**: Critical alert if drift detected in > 20% of features.

## 5. Implementation Checklist

- [ ] Implement `DriftCalculator` class in ML Service.
- [ ] Create Airflow DAG `check_drift`.
- [ ] Add `model_monitoring_logs` table.
- [ ] Configure Email/Slack alerts for "Model Drift Detected".
