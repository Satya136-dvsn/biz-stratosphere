-- Phase 4: AI & ML Admin Control

-- 1. RPC to Get Models with Stats
CREATE OR REPLACE FUNCTION public.get_admin_models()
RETURNS TABLE (
    id UUID,
    name TEXT,
    version TEXT,
    type TEXT,
    is_active BOOLEAN,
    accuracy DECIMAL,
    total_predictions BIGINT,
    avg_confidence DECIMAL,
    last_used_at TIMESTAMPTZ
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
        m.id,
        m.name,
        m.version,
        m.type,
        m.is_active,
        m.accuracy,
        COALESCE(s.total_predictions, 0) as total_predictions,
        COALESCE(s.avg_confidence, 0) as avg_confidence,
        s.last_used_at
    FROM public.ml_models m
    LEFT JOIN public.ml_model_stats s ON s.model_id = m.id
    ORDER BY m.name ASC;
END;
$$;

-- 2. RPC to Toggle Model Status
CREATE OR REPLACE FUNCTION public.admin_toggle_model(target_model_id UUID, active BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    UPDATE public.ml_models
    SET is_active = active, updated_at = NOW()
    WHERE id = target_model_id;

    -- Log Action
    PERFORM public.log_admin_action(
        CASE WHEN active THEN 'activate_model' ELSE 'deactivate_model' END, 
        'ml_model', 
        target_model_id::TEXT, 
        jsonb_build_object('active', active)
    );
END;
$$;
