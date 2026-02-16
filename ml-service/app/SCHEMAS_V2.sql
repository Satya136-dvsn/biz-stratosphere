-- ============================================================================
-- Biz Stratosphere V2: Consolidated Enterprise Schema (Idempotent)
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================================================
-- MODULE: SECURITY & IAM
-- ============================================================================

-- API Keys
-- Handle existing table from 20241208_api_keys.sql
DO $$ 
BEGIN 
    -- 1. Create table if it doesn't exist
    CREATE TABLE IF NOT EXISTS public.api_keys (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        workspace_id UUID REFERENCES public.workspaces(id) NOT NULL,
        user_id UUID REFERENCES auth.users(id) NOT NULL,
        name TEXT NOT NULL,
        prefix TEXT NOT NULL,
        hash TEXT NOT NULL,
        scopes TEXT[] NOT NULL DEFAULT '{}',
        expires_at TIMESTAMPTZ,
        last_used_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        is_active BOOLEAN DEFAULT TRUE
    );

    -- 2. Backfill columns if table existed but columns didn't (Migration Logic)
    -- Check for 'prefix' (new) vs 'key_prefix' (old)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='api_keys' AND column_name='prefix') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='api_keys' AND column_name='key_prefix') THEN
            ALTER TABLE public.api_keys RENAME COLUMN key_prefix TO prefix;
        ELSE
            ALTER TABLE public.api_keys ADD COLUMN prefix TEXT;
        END IF;
    END IF;

    -- Check for 'hash' (new) vs 'key_hash' (old)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='api_keys' AND column_name='hash') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='api_keys' AND column_name='key_hash') THEN
             ALTER TABLE public.api_keys RENAME COLUMN key_hash TO hash;
        ELSE
             ALTER TABLE public.api_keys ADD COLUMN hash TEXT;
        END IF;
    END IF;

    -- Check for 'scopes' (new) vs 'permissions' (old)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='api_keys' AND column_name='scopes') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='api_keys' AND column_name='permissions') THEN
             ALTER TABLE public.api_keys RENAME COLUMN permissions TO scopes;
        ELSE
             ALTER TABLE public.api_keys ADD COLUMN scopes TEXT[] DEFAULT '{}';
        END IF;
    END IF;

    -- Ensure other columns exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='api_keys' AND column_name='created_at') THEN
        ALTER TABLE public.api_keys ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Index (Idempotent)
DROP INDEX IF EXISTS idx_api_keys_hash;
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON public.api_keys(hash);

-- ============================================================================
-- MODULE: DECISION MEMORY™
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.decision_memory (
    decision_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES public.workspaces(id) NOT NULL,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    decision_type TEXT NOT NULL CHECK (decision_type IN ('ai_chat', 'ml_prediction', 'automation')),
    input_context JSONB NOT NULL DEFAULT '{}'::jsonb,
    model_version TEXT,
    ai_recommendation JSONB,
    ai_confidence_score FLOAT CHECK (ai_confidence_score BETWEEN 0 AND 1),
    shap_values JSONB,
    human_action TEXT CHECK (human_action IN ('accepted', 'modified', 'rejected', 'ignored')),
    outcome_status TEXT DEFAULT 'pending',
    actual_outcome JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    evaluated_at TIMESTAMPTZ
);

-- Safely enable RLS
ALTER TABLE public.decision_memory ENABLE ROW LEVEL SECURITY;

-- Idempotent Index
DROP INDEX IF EXISTS idx_dm_workspace_type;
CREATE INDEX IF NOT EXISTS idx_dm_workspace_type ON public.decision_memory(workspace_id, decision_type);

-- Idempotent Policy
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'decision_memory' AND policyname = 'Workspace Isolation DM'
    ) THEN
        CREATE POLICY "Workspace Isolation DM" ON public.decision_memory
        USING (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()));
    END IF;
END $$;

-- Feedback Loop
CREATE TABLE IF NOT EXISTS public.decision_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    decision_id UUID REFERENCES public.decision_memory(decision_id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    feedback_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- MODULE: PRESCRIPTIVE ENGINE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.simulation_scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES public.workspaces(id),
    name TEXT NOT NULL,
    base_model_id TEXT NOT NULL,
    variables JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS public.simulation_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_id UUID REFERENCES public.simulation_scenarios(id) ON DELETE CASCADE,
    iteration_index INT,
    input_values JSONB,
    predicted_outcome JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- MODULE: ML MONITORING
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.model_monitoring_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name TEXT NOT NULL,
    model_version TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    metric_value FLOAT NOT NULL,
    threshold FLOAT NOT NULL,
    status TEXT CHECK (status IN ('ok', 'warning', 'critical')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- MODULE: GOVERNANCE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.data_provenance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    source_entity_type TEXT,
    source_entity_id UUID,
    transformation_job_id UUID,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.dataset_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset_id UUID REFERENCES public.datasets(id),
    version_number INT,
    s3_path TEXT NOT NULL,
    row_count INT,
    schema_signature TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- MODULE: MONETIZATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.subscriptions (
    workspace_id UUID PRIMARY KEY REFERENCES public.workspaces(id),
    stripe_subscription_id TEXT,
    plan_tier TEXT CHECK (plan_tier IN ('starter', 'pro', 'enterprise')),
    status TEXT CHECK (status IN ('active', 'past_due', 'canceled')),
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    seat_quantity INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.usage_meters (
    workspace_id UUID REFERENCES public.workspaces(id),
    metric_name TEXT NOT NULL,
    period_start TIMESTAMPTZ NOT NULL,
    current_usage BIGINT DEFAULT 0,
    reset_at TIMESTAMPTZ,
    PRIMARY KEY (workspace_id, metric_name, period_start)
);
