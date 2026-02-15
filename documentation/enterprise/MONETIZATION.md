# SaaS Monetization Architecture

## 1. Overview

We implement a hybrid pricing model combining **Seat-Based Subscriptions** with **Usage-Based Metering** for high-value AI features. This maximizes revenue while ensuring fair pricing for heavy users.

## 2. Pricing Tiers

| Feature | Starter (Free) | Pro ($49/seat/mo) | Enterprise (Custom) |
| :--- | :--- | :--- | :--- |
| **Members** | Up to 3 | Up to 10 | Unlimited |
| **AI Decisions** | 100 / mo | 10,000 / mo | Unlimited |
| **Data Retention** | 30 Days | 1 Year | Unlimited |
| **Support** | Community | Email (24h) | Dedicated SAM |
| **SSO** | ❌ | ❌ | ✅ (SAML/OIDC) |

## 3. Database Schema

### 3.1 Subscription Management (`subscriptions`)

Tracks the active plan for each workspace.

```sql
CREATE TABLE public.subscriptions (
    workspace_id UUID PRIMARY KEY REFERENCES public.workspaces(id),
    stripe_subscription_id TEXT,
    plan_tier TEXT CHECK (plan_tier IN ('starter', 'pro', 'enterprise')),
    status TEXT CHECK (status IN ('active', 'past_due', 'canceled')),
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    seat_quantity INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.2 Usage Metering (`usage_meters`)

Tracks real-time consumption of metered features (e.g., GPT-4 tokens, ML predictions).

```sql
CREATE TABLE public.usage_meters (
    workspace_id UUID REFERENCES public.workspaces(id),
    metric_name TEXT NOT NULL, -- e.g., 'ai_predictions_count'
    period_start TIMESTAMPTZ NOT NULL,
    current_usage BIGINT DEFAULT 0,
    reset_at TIMESTAMPTZ, -- When the meter resets (monthly)
    PRIMARY KEY (workspace_id, metric_name, period_start)
);
```

### 3.3 Feature Gating Logic

A PostgreSQL function checks limits before allowing actions.

```sql
CREATE OR REPLACE FUNCTION check_quota(workspace_id UUID, feature_name TEXT) 
RETURNS BOOLEAN AS $$
DECLARE
    limit_val INT;
    current_val INT;
BEGIN
    -- Get limit based on tier
    SELECT get_limit(feature_name, s.plan_tier) INTO limit_val 
    FROM subscriptions s WHERE s.workspace_id = checking_workspace_id;
    
    -- Get current usage
    SELECT current_usage INTO current_val 
    FROM usage_meters WHERE ...;
    
    RETURN current_val < limit_val;
END;
$$ LANGUAGE plpgsql;
```

## 4. Integration Strategy

- **Billing Provider**: Stripe or Paddle.
- **Webhooks**: Listen for `invoice.payment_succeeded` to update `subscriptions` table.
- **Frontend**: Show "Upgrade to Pro" banner when 80% of quota is reached.

## 5. Implementation Checklist

- [ ] Create `subscriptions` and `usage_meters` tables.
- [ ] Implement `QuotaMiddleware` in FastAPI.
- [ ] Design "Billing Settings" page in Frontend.
- [ ] Set up Stripe Webhook handler.
