-- Phase 2: Admin Stats & Metrics

-- 1. Get High-Level Admin Stats
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    total_users INT;
    total_workspaces INT;
    active_now INT;
    api_requests_24h INT;
    predictions_24h INT;
    recent_errors INT;
BEGIN
    -- Check permissions using our Phase 1 function
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    SELECT COUNT(*) INTO total_users FROM public.profiles;
    SELECT COUNT(*) INTO total_workspaces FROM public.workspaces;
    
    -- Active sessions in last 1 hour (proxy for "Active Now")
    -- Using user_sessions table if available, else updated_at from profiles as approximation?
    -- Actually user_sessions was created in 20241212.
    SELECT COUNT(*) INTO active_now 
    FROM public.user_sessions 
    WHERE last_activity > NOW() - INTERVAL '1 hour';

    -- API Requests 24h (Sum of current counts, imperfect but useful proxy)
    -- Or better, if we had a log. For now, sum user_api_usage counts.
    -- Note: user_api_usage resets periodically, so this is "Active Window Usage".
    SELECT COALESCE(SUM(request_count), 0) INTO api_requests_24h 
    FROM public.user_api_usage 
    WHERE updated_at > NOW() - INTERVAL '24 hours';

    -- ML Predictions 24h
    SELECT COUNT(*) INTO predictions_24h 
    FROM public.ml_predictions 
    WHERE created_at > NOW() - INTERVAL '24 hours';

    -- Recent System Errors (from Audit Logs, looking for 'error' or 'failure')
    -- Assuming we log errors. If not, this flatlines at 0 which is fine start.
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

-- 2. Get Daily Signups (Time Series)
CREATE OR REPLACE FUNCTION public.get_daily_signups(days_lookback INT DEFAULT 30)
RETURNS TABLE (
    day DATE,
    count BIGINT
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
        created_at::DATE as day,
        COUNT(*) as count
    FROM public.profiles
    WHERE created_at > NOW() - (days_lookback || ' days')::INTERVAL
    GROUP BY 1
    ORDER BY 1 ASC;
END;
$$;

-- 3. Get Model Usage Stats (Using existing view)
-- But we might want to wrap it for security if the view permissions were loose
-- The view ml_model_stats is visible to 'authenticated', so we can query it directly in frontend.
