# Data Lineage & Governance Architecture

## 1. Overview

Data Governance ensures that every piece of data in the system can be traced back to its origin, its transformations are logged, and access is audited. This is critical for enterprise compliance (GDPR, SOC2).

## 2. Data Lineage Tracking

### 2.1 Provenance Model

We track the lifecycle of data from `Source` -> `Ingestion` -> `Transformation` -> `Model Input` -> `Decision`.

**Schema (`data_provenance`):**

```sql
CREATE TABLE public.data_provenance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL CHECK (entity_type IN ('dataset', 'model', 'decision')),
    entity_id UUID NOT NULL,
    source_entity_type TEXT, -- e.g., 'user_upload' or 'api_integration'
    source_entity_id UUID,
    transformation_job_id UUID, -- Reference to Airflow job run
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB -- e.g., {"normalization_method": "min-max"}
);
```

### 2.2 Dataset Versioning

Every update to a dataset creates a new version pointer, ensuring ML models can be reproduced exactly.

```sql
CREATE TABLE public.dataset_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset_id UUID REFERENCES public.datasets(id),
    version_number INT,
    s3_path TEXT NOT NULL,
    row_count INT,
    schema_signature TEXT, -- Hash of column names/types
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 3. Governance & Audit Reporting

### 3.1 Immutable Audit Log

(Partially implemented in existing `audit_logs`, extending here for completeness).

- **Access Logs**: Who viewed what dashboard?
- **Modification Logs**: Who changed this rule?
- **Export Logs**: Who downloaded this CSV?

```sql
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS ip_address INET;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS user_agent TEXT;
```

### 3.2 Compliance Reports

Automated generation of reports for auditors:

1. **User Access Review**: List of users and their roles/permissions.
2. **Data Processing History**: Audit trail of a specific customer's data (GDPR "Right to Access").
3. **Model Explainability Audit**: History of SHAP values for high-risk predictions.

## 4. Implementation Checklist

- [ ] Create `dataset_versions` and `data_provenance` tables.
- [ ] Add `ip_address` to audit logging middleware.
- [ ] Create "Compliance Dashboard" view for Admins.
