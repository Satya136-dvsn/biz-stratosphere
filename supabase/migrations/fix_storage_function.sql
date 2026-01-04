-- Fix for get_user_storage_usage 400 Error
-- Run this in Supabase SQL Editor to stop the errors

-- Drop the existing function
DROP FUNCTION IF EXISTS get_user_storage_usage(UUID);

-- Recreate with proper null handling
CREATE OR REPLACE FUNCTION get_user_storage_usage(target_user_id UUID)
RETURNS TABLE (
    total_files BIGINT,
    total_size_bytes BIGINT,
    by_source JSONB
) AS $$
BEGIN
    -- Check if user has any uploads
    IF NOT EXISTS (
        SELECT 1 FROM user_uploads 
        WHERE user_id = target_user_id 
        AND deleted_at IS NULL 
        AND status = 'active'
    ) THEN
        -- Return zeros if no uploads
        RETURN QUERY SELECT 0::BIGINT, 0::BIGINT, '{}'::JSONB;
        RETURN;
    END IF;

    -- Return actual stats if uploads exist
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_files,
        COALESCE(SUM(file_size_bytes), 0)::BIGINT as total_size_bytes,
        jsonb_object_agg(
            upload_source,
            jsonb_build_object(
                'files', source_count,
                'size', source_size
            )
        ) as by_source
    FROM (
        SELECT 
            upload_source,
            COUNT(*) as source_count,
            SUM(file_size_bytes) as source_size
        FROM user_uploads
        WHERE user_id = target_user_id 
            AND deleted_at IS NULL
            AND status = 'active'
        GROUP BY upload_source
    ) source_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_storage_usage TO authenticated;

-- Test the function
SELECT * FROM get_user_storage_usage(auth.uid());
