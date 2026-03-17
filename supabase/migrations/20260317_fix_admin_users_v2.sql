-- Fix: get_admin_users_v2 should work across schema variants and be admin-only
-- - Some installs join profiles via profiles.user_id; older ones used profiles.id.
-- - Some installs store roles in public.user_roles instead of profiles.role.
-- This version:
-- - gates behind public.is_admin()
-- - uses profiles join on (user_id OR id)
-- - computes role from user_roles when available, else profiles.role, else 'user'

CREATE OR REPLACE FUNCTION public.get_admin_users_v2(page int, page_size int, search_query text DEFAULT '')
RETURNS TABLE (
    id uuid,
    email text,
    full_name text,
    role text,
    suspended boolean,
    created_at timestamptz,
    last_sign_in timestamptz,
    dataset_count bigint
) AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    RETURN QUERY
    WITH roles AS (
        SELECT
            ur.user_id,
            MAX(ur.role::text) FILTER (WHERE ur.role::text IN ('super_admin', 'company_admin', 'admin')) AS elevated_role
        FROM public.user_roles ur
        GROUP BY ur.user_id
    )
    SELECT
        au.id,
        au.email::text,
        COALESCE(p.display_name, au.raw_user_meta_data->>'display_name', au.email)::text as full_name,
        COALESCE(
            CASE
                WHEN r.elevated_role = 'super_admin' THEN 'super_admin'
                WHEN r.elevated_role IN ('company_admin', 'admin') THEN 'admin'
                ELSE NULL
            END,
            COALESCE(p.role::text, NULL),
            'user'
        )::text as role,
        COALESCE(p.suspended, false) as suspended,
        au.created_at,
        au.last_sign_in_at as last_sign_in,
        COUNT(d.id)::bigint as dataset_count
    FROM auth.users au
    LEFT JOIN public.profiles p
        ON (p.user_id = au.id OR p.id = au.id)
    LEFT JOIN roles r
        ON r.user_id = au.id
    LEFT JOIN public.datasets d
        ON au.id = d.user_id
    WHERE
        (
            COALESCE(search_query, '') = ''
            OR au.email ILIKE '%' || search_query || '%'
            OR COALESCE(p.display_name, '') ILIKE '%' || search_query || '%'
        )
    GROUP BY
        au.id, au.email, p.display_name, p.role, p.suspended, au.created_at, au.last_sign_in_at, r.elevated_role, au.raw_user_meta_data
    ORDER BY au.created_at DESC
    LIMIT page_size
    OFFSET (page - 1) * page_size;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

