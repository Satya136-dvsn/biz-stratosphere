-- Phase 1: Admin Identity & Security

-- 1. Create Role Enum
DO $$ BEGIN
    CREATE TYPE app_role AS ENUM ('user', 'admin', 'super_admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Add Role to Profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role app_role NOT NULL DEFAULT 'user'::app_role;

-- 3. Secure Function to Check Admin Status
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER -- Runs with privileges of creator (postgres/superuser)
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  );
$$;

-- 4. RLS for Profiles (Admins can view/edit all)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
    ON public.profiles FOR SELECT
    USING (is_admin());

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles"
    ON public.profiles FOR UPDATE
    USING (is_admin());

-- 5. RLS for Audit Logs (Admins see all)
DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view all audit logs"
    ON public.audit_logs FOR SELECT
    USING (is_admin());

-- 6. Helper to log Admin Actions
-- Use: SELECT log_admin_action('suspend_user', 'user', user_id, 'policy_violation');
CREATE OR REPLACE FUNCTION public.log_admin_action(
    action_name TEXT,
    res_type TEXT,
    res_id TEXT,
    meta JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO public.audit_logs (
        user_id, workspace_id, action, resource_type, resource_id, metadata
    ) VALUES (
        auth.uid(),
        NULL, -- Admin actions might not be workspace bound
        action_name,
        res_type,
        res_id,
        meta
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$;
