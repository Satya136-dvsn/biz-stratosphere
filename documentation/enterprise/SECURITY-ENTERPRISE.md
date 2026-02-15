# Enterprise Security Architecture - Biz Stratosphere

## 1. Executive Summary

This document defines the security architecture required to transition Biz Stratosphere to a SOC2-ready, enterprise-grade platform. It covers Identity & Access Management (IAM), Data Protection, Infrastructure Security, and Compliance.

## 2. Identity & Access Management (IAM)

### 2.1 Role-Based Access Control (RBAC) Matrix

We will implement a granular RBAC system using Supabase Auth claims and a dedicated `user_roles` table.

| Role | Description | Access Level |
| :--- | :--- | :--- |
| **Super Admin** | Platform owner having full access to all workspaces and system settings. | `*` (All Scopes) |
| **Workspace Owner** | Creator of the workspace. Can manage billing, critical settings, and delete the workspace. | `workspace:read`, `workspace:write`, `workspace:delete`, `billing:manage` |
| **Workspace Admin** | Can manage users, integrations, and non-destructive settings within a workspace. | `workspace:read`, `workspace:write`, `users:invite`, `users:remove` |
| **Analyst** | Can create/edit dashboards, run ML models, and view data. Cannot change settings. | `data:read`, `data:write`, `models:run`, `dashboards:manage` |
| **Viewer** | Read-only access to dashboards and reports. | `dashboards:read`, `reports:read` |
| **Auditor** | Read-only access to audit logs and compliance reports. | `audit:read`, `compliance:read` |

**Implementation Strategy:**

- **Supabase JWT Claims**: Embed `role` and `workspace_ids` in the JWT access token to reduce database lookups for permissions.
- **RLS Policies**: Enforce data access at the row level based on `auth.uid()` and `workspace_id`.
- **Middleware**: API-level enforcement for non-database resources (e.g., feature gating).

### 2.2 API Key Management

For programmatic access (e.g., automated ETL, CI/CD pipes), we introduce Scoped API Keys.

**Schema Definition:**

```sql
CREATE TABLE public.api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES public.workspaces(id) NOT NULL,
    user_id UUID REFERENCES auth.users(id) NOT NULL, -- Creator
    name TEXT NOT NULL,
    prefix TEXT NOT NULL, -- First 7 chars for display
    hash TEXT NOT NULL, -- SHA-256 hash of the full key
    scopes TEXT[] NOT NULL DEFAULT '{}', -- Array of permissions e.g., ['data:write']
    expires_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);
```

**Security Controls:**

- **Hashing**: Keys are never stored in plain text. Only the hash is stored.
- **Rotation**: Users can generate new keys and revoke old ones instantly.
- **prefix**: Allows users to identify keys without exposing the secret.

## 3. Data Protection

### 3.1 Encryption Strategy

- **At Rest**:
  - **Database**: Supabase (PostgreSQL) TDE (Transparent Data Encryption) enables encryption of data files on disk.
  - **Sensitive Columns**: Use `pgsodium` for column-level encryption of highly sensitive fields (e.g., PII, external API credentials).
- **In Transit**:
  - Force TLS 1.3 for all connections (HTTPS, WSS).
  - HSTS (HTTP Strict Transport Security) enabled on all domains.

### 3.2 Key Management

- Uses Supabase Vault or AWS KMS for managing encryption keys.
- **Key Rotation Policy**: Master keys rotated annually; Data keys rotated every 90 days.

## 4. Operational Security

### 4.1 Rate Limiting Strategy

To preventing abuse and DDoS, we implement a multi-layered rate limiting strategy using Redis (Upstash) and Middleware.

| Tier | Endpoints | Limit | Action |
| :--- | :--- | :--- | :--- |
| **Public** | Auth, Landing Page | 10 req/min | Block IP |
| **Authenticated** | Standard API | 1000 req/hr | 429 Retry-After |
| **ML Inference** | Model Predictions | 50 req/day (Tier 1), 1000/day (Tier 2) | Hard Stop/Upgrade Prompt |
| **API Keys** | System Integration | Configurable (Default 100 req/min) | 429 Retry-After |

### 4.2 Multi-tenant Isolation

We use **Row-Level Security (RLS)** as the primary isolation mechanism.

- Every query **MUST** include `workspace_id`.
- RLS Policy Example:

```sql
CREATE POLICY "Tenant Isolation" ON public.data_points
USING (workspace_id = (SELECT workspace_id FROM users WHERE id = auth.uid()));
```

- **Logical Separation**: All tenants share the same database schema (efficient for SaaS).
- **Audit**: `security_barrier` views used to prevent side-channel leaks.

## 5. Compliance Readiness (SOC2)

- **Audit Logging**: Immutable logs for all `WRITE`, `UPDATE`, `DELETE` operations.
- **Change Management**: All schema changes migrated via CI/CD (Liquibase or Supabase migrations).
- **Incident Response**: PagerDuty integration for critical alerts (e.g., elevated error rates, security breaches).

## 6. Implementation Checklist

- [ ] Create `user_roles` enum and `api_keys` table.
- [ ] Update all RLS policies to check `workspace_id` recursively.
- [ ] Implement Redis-based Rate Limiter in API Middleware.
- [ ] Enable `pgsodium` extension and migrate sensitive columns.
