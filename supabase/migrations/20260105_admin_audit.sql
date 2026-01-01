-- Phase 5: Security & Audit Logs

-- 1. RPC to Get Audit Logs (Paginated & Filterable)
CREATE OR REPLACE FUNCTION public.get_admin_audit_logs(
    page INT DEFAULT 1,
    page_size INT DEFAULT 50,
    action_filter TEXT DEFAULT NULL,
    user_filter TEXT DEFAULT NULL -- email or user_id
)
RETURNS TABLE (
    id UUID,
    created_at TIMESTAMPTZ,
    action TEXT,
    resource_type TEXT,
    resource_id TEXT,
    ip_address TEXT,
    metadata JSONB,
    actor_email TEXT,
    actor_id UUID
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
        l.id,
        l.created_at,
        l.action,
        l.resource_type,
        l.resource_id,
        l.ip_address,
        l.metadata,
        u.email as actor_email,
        l.user_id as actor_id
    FROM public.audit_logs l
    LEFT JOIN auth.users u ON u.id = l.user_id
    WHERE 
        (action_filter IS NULL OR l.action ILIKE '%' || action_filter || '%')
        AND
        (user_filter IS NULL OR u.email ILIKE '%' || user_filter || '%' OR l.user_id::TEXT = user_filter)
    ORDER BY l.created_at DESC
    LIMIT page_size
    OFFSET (page - 1) * page_size;
END;
$$;
