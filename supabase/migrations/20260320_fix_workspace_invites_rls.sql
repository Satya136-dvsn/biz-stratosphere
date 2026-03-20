-- Fix: Enable RLS and add policy for workspace_invites table
-- Allows workspace owners/admins to create invites for their workspaces.

-- Enable RLS on workspace_invites if not already enabled
ALTER TABLE public.workspace_invites ENABLE ROW LEVEL SECURITY;

-- Drop any old conflicting policies to be safe
DROP POLICY IF EXISTS "workspace_invites_insert_policy" ON public.workspace_invites;
DROP POLICY IF EXISTS "workspace_invites_select_policy" ON public.workspace_invites;
DROP POLICY IF EXISTS "workspace_invites_delete_policy" ON public.workspace_invites;

-- Allow workspace members (owner/admin) to INSERT invites for their workspace
CREATE POLICY "workspace_invites_insert_policy"
ON public.workspace_invites
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.workspace_members wm
        WHERE wm.workspace_id = workspace_invites.workspace_id
          AND wm.user_id = auth.uid()
          AND wm.role IN ('owner', 'admin')
    )
    OR
    -- The workspace owner (from workspaces table) can also invite
    EXISTS (
        SELECT 1 FROM public.workspaces w
        WHERE w.id = workspace_invites.workspace_id
          AND w.owner_id = auth.uid()
    )
);

-- Allow authenticated users to SELECT invites for workspaces they belong to
CREATE POLICY "workspace_invites_select_policy"
ON public.workspace_invites
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.workspaces w
        WHERE w.id = workspace_invites.workspace_id
          AND w.owner_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM public.workspace_members wm
        WHERE wm.workspace_id = workspace_invites.workspace_id
          AND wm.user_id = auth.uid()
          AND wm.role IN ('owner', 'admin')
    )
    OR
    -- Allow anyone to read an invite by its token (for accepting invites)
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Allow workspace owners/admins to DELETE invites
CREATE POLICY "workspace_invites_delete_policy"
ON public.workspace_invites
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.workspaces w
        WHERE w.id = workspace_invites.workspace_id
          AND w.owner_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM public.workspace_members wm
        WHERE wm.workspace_id = workspace_invites.workspace_id
          AND wm.user_id = auth.uid()
          AND wm.role IN ('owner', 'admin')
    )
);
