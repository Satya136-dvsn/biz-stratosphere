-- Phase 3: Admin User Management

-- 1. Add suspended status to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS suspended BOOLEAN DEFAULT FALSE;

-- 2. RPC to Get Users (Paginated & Searchable)
CREATE OR REPLACE FUNCTION public.get_admin_users(
    page INT DEFAULT 1,
    page_size INT DEFAULT 20,
    search_query TEXT DEFAULT ''
)
RETURNS TABLE (
    id UUID,
    email TEXT,
    full_name TEXT,
    role app_role,
    suspended BOOLEAN,
    created_at TIMESTAMPTZ,
    last_sign_in TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    RETURN QUERY
    SELECT 
        p.id,
        u.email, -- Join with auth.users to get email!
        p.display_name as full_name, -- Assuming display_name exists in profiles
        p.role,
        p.suspended,
        p.created_at,
        u.last_sign_in_at
    FROM public.profiles p
    JOIN auth.users u ON u.id = p.id
    WHERE (
        search_query = '' OR 
        u.email ILIKE '%' || search_query || '%' OR 
        p.display_name ILIKE '%' || search_query || '%'
    )
    ORDER BY p.created_at DESC
    LIMIT page_size
    OFFSET (page - 1) * page_size;
END;
$$;

-- 3. RPC to Update Role
CREATE OR REPLACE FUNCTION public.admin_update_role(target_user_id UUID, new_role app_role)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    -- Prevent self-demotion if you are the last admin? (Optional safety)
    -- Allow for now.

    UPDATE public.profiles
    SET role = new_role, updated_at = NOW()
    WHERE id = target_user_id;

    -- Log Action
    PERFORM public.log_admin_action('update_role', 'user', target_user_id::TEXT, jsonb_build_object('new_role', new_role));
END;
$$;

-- 4. RPC to Key-Switch Suspension
CREATE OR REPLACE FUNCTION public.admin_toggle_suspend(target_user_id UUID, suspend BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    UPDATE public.profiles
    SET suspended = suspend, updated_at = NOW()
    WHERE id = target_user_id;

    -- Log Action
    PERFORM public.log_admin_action(
        CASE WHEN suspend THEN 'suspend_user' ELSE 'unsuspend_user' END, 
        'user', 
        target_user_id::TEXT, 
        jsonb_build_object('suspended', suspend)
    );
END;
$$;
