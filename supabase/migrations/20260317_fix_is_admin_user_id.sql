-- Fix: Align admin checks with profiles.user_id schema
-- Some parts of the codebase use public.profiles.user_id (auth.users.id),
-- while older migrations referenced public.profiles.id. This breaks admin RPCs
-- (e.g. get_admin_stats) and can cause "Access denied" for real admins.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    -- Prefer the newer role system when present (user_roles).
    EXISTS (
      SELECT 1
      FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role::text IN ('admin', 'super_admin', 'company_admin')
    )
    OR
    -- Back-compat for older installs where role is stored on profiles.
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND COALESCE(p.role::text, '') IN ('admin', 'super_admin', 'company_admin')
    );
$$;

