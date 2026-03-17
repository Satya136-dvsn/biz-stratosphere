-- Fix: Admin stats should not depend on user_api_usage table
-- Some deployments track API usage in public.api_usage, while others use public.user_api_usage.
-- This migration makes get_admin_stats() resilient by querying whichever table exists.

CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    total_users INT;
    total_workspaces INT;
    active_now INT;
    api_requests_24h INT;
    predictions_24h INT;
    recent_errors INT;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    SELECT COUNT(*) INTO total_users FROM public.profiles;
    SELECT COUNT(*) INTO total_workspaces FROM public.workspaces;

    SELECT COUNT(*) INTO active_now
    FROM public.user_sessions
    WHERE last_activity > NOW() - INTERVAL '1 hour';

    -- API Requests (24h): support both schemas
    IF to_regclass('public.user_api_usage') IS NOT NULL THEN
        SELECT COALESCE(SUM(request_count), 0)::INT INTO api_requests_24h
        FROM public.user_api_usage
        WHERE updated_at > NOW() - INTERVAL '24 hours';
    ELSIF to_regclass('public.api_usage') IS NOT NULL THEN
        SELECT COUNT(*)::INT INTO api_requests_24h
        FROM public.api_usage
        WHERE created_at > NOW() - INTERVAL '24 hours';
    ELSE
        api_requests_24h := 0;
    END IF;

    SELECT COUNT(*) INTO predictions_24h
    FROM public.ml_predictions
    WHERE created_at > NOW() - INTERVAL '24 hours';

    SELECT COUNT(*) INTO recent_errors
    FROM public.audit_logs
    WHERE created_at > NOW() - INTERVAL '24 hours'
      AND (action ILIKE '%error%' OR action ILIKE '%fail%');

    RETURN jsonb_build_object(
        'total_users', total_users,
        'total_workspaces', total_workspaces,
        'active_users_1h', active_now,
        'api_requests_24h', api_requests_24h,
        'predictions_24h', predictions_24h,
        'recent_errors_24h', recent_errors
    );
END;
$$;

