-- Fix api_keys RLS policies - Simpler version without workspace_members dependency
-- Migration: 20241208_api_keys_fix_rls
-- Description: Updates RLS policies to work without workspace_members table

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their workspace API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can create workspace API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can update their workspace API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can delete their workspace API keys" ON public.api_keys;

-- Create simpler RLS policies (user can manage their own API keys)
CREATE POLICY "Users can view their own API keys"
    ON public.api_keys
    FOR SELECT
    USING (auth.uid() = created_by);

CREATE POLICY "Users can create their own API keys"
    ON public.api_keys
    FOR INSERT
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own API keys"
    ON public.api_keys
    FOR UPDATE
    USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own API keys"
    ON public.api_keys
    FOR DELETE
    USING (auth.uid() = created_by);
