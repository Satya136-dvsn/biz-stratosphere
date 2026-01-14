-- P1 FIX: Complete User Uploads & Storage Usage Setup
-- Run this in Supabase Dashboard > SQL Editor
-- This fixes the "file_size_bytes column does not exist" error

-- ============================================
-- STEP 1: Create user_uploads table if not exists
-- ============================================
CREATE TABLE IF NOT EXISTS user_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- File information
    filename TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    file_type TEXT NOT NULL,
    mime_type TEXT,
    storage_path TEXT NOT NULL,
    
    -- Context
    upload_source TEXT NOT NULL,
    upload_context JSONB DEFAULT '{}'::jsonb,
    
    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'processing', 'archived', 'failed')),
    processing_status JSONB DEFAULT '{}'::jsonb,
    
    -- CSV-specific metadata
    row_count INTEGER,
    column_count INTEGER,
    column_names TEXT[],
    preview_data JSONB,
    
    -- Tags and organization
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    description TEXT,
    
    -- Relationships
    dataset_id UUID,
    
    -- Access tracking
    last_accessed_at TIMESTAMPTZ,
    access_count INTEGER DEFAULT 0,
    
    -- Soft delete
    deleted_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 2: Create indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_user_uploads_user_id ON user_uploads(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_user_uploads_source ON user_uploads(upload_source) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_user_uploads_status ON user_uploads(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_user_uploads_created ON user_uploads(created_at DESC) WHERE deleted_at IS NULL;

-- ============================================
-- STEP 3: Enable Row Level Security
-- ============================================
ALTER TABLE user_uploads ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 4: Create RLS Policies (drop first if exist)
-- ============================================
DROP POLICY IF EXISTS "Users can view their own uploads" ON user_uploads;
DROP POLICY IF EXISTS "Users can insert their own uploads" ON user_uploads;
DROP POLICY IF EXISTS "Users can update their own uploads" ON user_uploads;
DROP POLICY IF EXISTS "Users can delete their own uploads" ON user_uploads;

CREATE POLICY "Users can view their own uploads"
    ON user_uploads FOR SELECT
    USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Users can insert their own uploads"
    ON user_uploads FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own uploads"
    ON user_uploads FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own uploads"
    ON user_uploads FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- STEP 5: Create/Replace the RPC function with null handling
-- ============================================
DROP FUNCTION IF EXISTS get_user_storage_usage(UUID);

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

-- ============================================
-- STEP 6: Grant permissions
-- ============================================
GRANT EXECUTE ON FUNCTION get_user_storage_usage TO authenticated;

-- ============================================
-- STEP 7: Verify the fix (this should return without error)
-- ============================================
-- SELECT * FROM get_user_storage_usage(auth.uid());

-- Success message
SELECT 'P1 Fix Applied Successfully! The user_uploads table and get_user_storage_usage function are now ready.' as result;
