-- Create api_keys table for API key management
-- Migration: 20241208_api_keys
-- Description: Enables secure API key generation and management for workspace access

-- Create api_keys table
CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id TEXT NOT NULL,
    name TEXT NOT NULL,
    key_prefix TEXT NOT NULL,
    key_hash TEXT NOT NULL,
    permissions TEXT[] NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    expires_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_api_keys_workspace_id ON public.api_keys(workspace_id);
CREATE INDEX idx_api_keys_created_by ON public.api_keys(created_by);
CREATE INDEX idx_api_keys_key_prefix ON public.api_keys(key_prefix);
CREATE INDEX idx_api_keys_is_active ON public.api_keys(is_active);

-- Enable Row Level Security
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own workspace API keys
CREATE POLICY "Users can view their workspace API keys"
    ON public.api_keys
    FOR SELECT
    USING (
        auth.uid() = created_by
        OR workspace_id IN (
            SELECT workspace_id 
            FROM public.workspace_members 
            WHERE user_id = auth.uid()
        )
    );

-- Users can create API keys for their workspaces
CREATE POLICY "Users can create workspace API keys"
    ON public.api_keys
    FOR INSERT
    WITH CHECK (
        auth.uid() = created_by
    );

-- Users can update their own API keys
CREATE POLICY "Users can update their workspace API keys"
    ON public.api_keys
    FOR UPDATE
    USING (
        auth.uid() = created_by
        OR workspace_id IN (
            SELECT workspace_id 
            FROM public.workspace_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- Users can delete their own API keys
CREATE POLICY "Users can delete their workspace API keys"
    ON public.api_keys
    FOR DELETE
    USING (
        auth.uid() = created_by
        OR workspace_id IN (
            SELECT workspace_id 
            FROM public.workspace_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_api_keys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_api_keys_updated_at
    BEFORE UPDATE ON public.api_keys
    FOR EACH ROW
    EXECUTE FUNCTION update_api_keys_updated_at();

-- Add comment
COMMENT ON TABLE public.api_keys IS 'Stores API keys for programmatic access to workspace data';
