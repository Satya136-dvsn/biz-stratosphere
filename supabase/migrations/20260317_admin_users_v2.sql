-- Migration: get_admin_users_v2
-- Description: Aggregates user profile data, auth details, and dataset counts for admin management.

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
    RETURN QUERY
    SELECT 
        au.id,
        au.email::text,
        COALESCE(p.display_name, au.raw_user_meta_data->>'display_name')::text as full_name,
        COALESCE(p.role, 'user')::text as role,
        COALESCE(p.suspended, false) as suspended,
        au.created_at,
        au.last_sign_in_at as last_sign_in,
        COUNT(d.id)::bigint as dataset_count
    FROM 
        auth.users au
    LEFT JOIN 
        public.profiles p ON au.id = p.user_id
    LEFT JOIN 
        public.datasets d ON au.id = d.user_id
    WHERE 
        (au.email ILIKE '%' || search_query || '%' OR p.display_name ILIKE '%' || search_query || '%')
    GROUP BY 
        au.id, p.display_name, p.role, p.suspended
    ORDER BY 
        au.created_at DESC
    LIMIT 
        page_size
    OFFSET 
        (page - 1) * page_size;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
