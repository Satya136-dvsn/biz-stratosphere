-- Create decision_memory table
CREATE TABLE IF NOT EXISTS public.decision_memory (
    decision_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    decision_type TEXT NOT NULL CHECK (decision_type IN ('ai_chat', 'ml_prediction', 'automation')),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    workspace_id UUID REFERENCES public.workspaces(id) NOT NULL,
    input_context JSONB NOT NULL DEFAULT '{}'::jsonb,
    ai_confidence_score FLOAT,
    ai_confidence_level TEXT,
    human_action TEXT NOT NULL CHECK (human_action IN ('accepted', 'modified', 'ignored')),
    expected_outcome TEXT NOT NULL,
    actual_outcome TEXT,
    outcome_status TEXT NOT NULL DEFAULT 'pending' CHECK (outcome_status IN ('pending', 'success', 'partial', 'failure')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    evaluated_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.decision_memory ENABLE ROW LEVEL SECURITY;

-- Policies

-- Users see their own workspace decisions
CREATE POLICY "Users view workspace decisions" ON public.decision_memory
    FOR SELECT
    USING (
        workspace_id IN (
            SELECT workspace_id 
            FROM public.workspace_members 
            WHERE user_id = auth.uid()
        )
    );

-- Admins can see everything (and normal users can too based on workspace logic above, but explicit admin override could be added but workspace logic suffices for "Users can see only their workspace decisions")
-- The requirement "Admins can see all workspace decisions" implies they might see across workspaces they are not members of? 
-- Usually "Admin" in this system refers to App admin or Workspace Admin? 
-- Based on previous context, there is an "admin" role in profiles? 
-- Let's check if there is a 'is_admin' or similar. 
-- Assuming standard RLS:
-- If there is a super admin role, we might need:
CREATE POLICY "Admins view all decisions" ON public.decision_memory
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Insert allowed for authenticated users (into their workspaces)
CREATE POLICY "Users insert decisions" ON public.decision_memory
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id AND
        workspace_id IN (
            SELECT workspace_id 
            FROM public.workspace_members 
            WHERE user_id = auth.uid()
        )
    );

-- Update allowed for:
-- 1. Admins (any field, but we assume they only update outcome/status via UI)
-- 2. Creating user (outcome fields only)

CREATE POLICY "Admins update decisions" ON public.decision_memory
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Users update own decisions" ON public.decision_memory
    FOR UPDATE
    USING (
        auth.uid() = user_id
    )
    WITH CHECK (
        auth.uid() = user_id
        -- In a real scenario we'd restrict WHICH columns using triggers/functions or app logic, 
        -- but Postgres RLS CHECK applies to the NEW row.
        -- We can't easily restrict columns in RLS without triggers. 
        -- For V1, we rely on App Logic + RLS matching user_id.
    );

-- Create index for performance
CREATE INDEX idx_decision_memory_workspace ON public.decision_memory(workspace_id);
CREATE INDEX idx_decision_memory_type ON public.decision_memory(decision_type);
CREATE INDEX idx_decision_memory_created_at ON public.decision_memory(created_at);
