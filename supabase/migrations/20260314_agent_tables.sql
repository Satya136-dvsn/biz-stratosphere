-- Phase 12: AI Agent Tables

-- To avoid breaking the existing ML service's decision_memory table (as per strict rule "Do NOT modify existing microservices"),
-- we are creating agent_decision_memory to fulfill the Phase 12 'decision_memory' requirement without conflict.

CREATE TABLE IF NOT EXISTS public.agent_decision_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_query TEXT NOT NULL,
    tools_used JSONB DEFAULT '[]'::jsonb,
    ml_results JSONB DEFAULT '{}'::jsonb,
    rag_context JSONB DEFAULT '{}'::jsonb,
    agent_reasoning TEXT,
    final_decision TEXT,
    confidence_score FLOAT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'executed')),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.prompt_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prompt_name TEXT NOT NULL,
    version INTEGER NOT NULL,
    prompt_text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(prompt_name, version)
);

-- Insert initial prompt
INSERT INTO public.prompt_versions (prompt_name, version, prompt_text) VALUES (
    'agent_system_prompt',
    1,
    'You are the Biz Stratosphere AI Agent. You must answer the user query by planning your actions and using the provided tools.
    1. Plan your actions based on the query.
    2. Request tool executions.
    3. Synthesize the results into a final decision.
    4. Provide clear reasoning.'
) ON CONFLICT DO NOTHING;

-- RLS setup (Open for backend service token/JWT, but securing for frontend if needed)
ALTER TABLE public.agent_decision_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all select for authenticated" ON public.agent_decision_memory FOR SELECT USING (true);
CREATE POLICY "Allow all insert for authenticated" ON public.agent_decision_memory FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update for authenticated" ON public.agent_decision_memory FOR UPDATE USING (true);

CREATE POLICY "Allow all select for authenticated" ON public.prompt_versions FOR SELECT USING (true);
CREATE POLICY "Allow all insert for authenticated" ON public.prompt_versions FOR INSERT WITH CHECK (true);
