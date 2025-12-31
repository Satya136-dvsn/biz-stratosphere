-- Rate Limiting Table
CREATE TABLE IF NOT EXISTS public.user_api_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    endpoint TEXT NOT NULL,
    request_count INT DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, endpoint)
);

-- RLS
ALTER TABLE public.user_api_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage"
    ON public.user_api_usage FOR SELECT
    USING (auth.uid() = user_id);

-- Function to increment usage safely
CREATE OR REPLACE FUNCTION increment_api_usage(p_user_id UUID, p_endpoint TEXT, p_window_seconds INT, p_limit INT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    row_record RECORD;
    is_allowed BOOLEAN;
    new_count INT;
BEGIN
    -- Try to find existing record
    SELECT * INTO row_record FROM public.user_api_usage 
    WHERE user_id = p_user_id AND endpoint = p_endpoint;

    IF row_record IS NULL THEN
        -- Insert new
        INSERT INTO public.user_api_usage (user_id, endpoint, request_count, window_start)
        VALUES (p_user_id, p_endpoint, 1, now())
        RETURNING request_count INTO new_count;
        is_allowed := TRUE;
    ELSE
        -- Check if window expired
        IF row_record.window_start < (now() - (p_window_seconds || ' seconds')::INTERVAL) THEN
            -- Reset
            UPDATE public.user_api_usage 
            SET request_count = 1, window_start = now(), updated_at = now()
            WHERE id = row_record.id
            RETURNING request_count INTO new_count;
            is_allowed := TRUE;
        ELSE
            -- Increment
            IF row_record.request_count >= p_limit THEN
                is_allowed := FALSE;
                new_count := row_record.request_count;
            ELSE
                UPDATE public.user_api_usage 
                SET request_count = request_count + 1, updated_at = now()
                WHERE id = row_record.id
                RETURNING request_count INTO new_count;
                is_allowed := TRUE;
            END IF;
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'allowed', is_allowed,
        'current_count', new_count,
        'remaining', p_limit - new_count
    );
END;
$$;
