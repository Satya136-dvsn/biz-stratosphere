-- Upload History Feature
-- Tracks all user file uploads across the application with categorization and context

-- Create user_uploads table
CREATE TABLE IF NOT EXISTS user_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- File information
    filename TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    file_type TEXT NOT NULL, -- 'csv', 'pdf', 'image', 'json', etc.
    mime_type TEXT,
    storage_path TEXT NOT NULL,
    
    -- Context - where was this uploaded?
    upload_source TEXT NOT NULL, -- 'ai_chat', 'ml_predictions', 'dashboard', 'advanced_charts', 'profile'
    upload_context JSONB DEFAULT '{}'::jsonb, -- Additional metadata
    
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
    
    -- Relationships to other entities
    dataset_id UUID REFERENCES datasets(id) ON DELETE CASCADE,
    
    -- Access tracking
    last_accessed_at TIMESTAMPTZ,
    access_count INTEGER DEFAULT 0,
    
    -- Soft delete
    deleted_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_uploads_user_id ON user_uploads(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_user_uploads_source ON user_uploads(upload_source) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_user_uploads_status ON user_uploads(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_user_uploads_created ON user_uploads(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_user_uploads_dataset ON user_uploads(dataset_id) WHERE dataset_id IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE user_uploads ENABLE ROW LEVEL SECURITY;

-- RLS Policies
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

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_uploads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER user_uploads_updated_at
    BEFORE UPDATE ON user_uploads
    FOR EACH ROW
    EXECUTE FUNCTION update_user_uploads_updated_at();

-- View for upload statistics by source
CREATE OR REPLACE VIEW user_upload_stats AS
SELECT 
    user_id,
    upload_source,
    COUNT(*) as total_files,
    SUM(file_size_bytes) as total_size_bytes,
    MAX(created_at) as most_recent_upload,
    COUNT(DISTINCT DATE(created_at)) as days_with_uploads
FROM user_uploads
WHERE deleted_at IS NULL AND status = 'active'
GROUP BY user_id, upload_source;

-- Grant access to the view
GRANT SELECT ON user_upload_stats TO authenticated;

-- Function to get storage usage for a user
CREATE OR REPLACE FUNCTION get_user_storage_usage(target_user_id UUID)
RETURNS TABLE (
    total_files BIGINT,
    total_size_bytes BIGINT,
    by_source JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_files,
        COALESCE(SUM(file_size_bytes), 0)::BIGINT as total_size_bytes,
        COALESCE(
            jsonb_object_agg(
                upload_source,
                jsonb_build_object(
                    'files', source_count,
                    'size', source_size
                )
            ),
            '{}'::jsonb
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

-- Add comment for documentation
COMMENT ON TABLE user_uploads IS 'Tracks all user file uploads across the application with context and metadata';
COMMENT ON COLUMN user_uploads.upload_source IS 'Source feature: ai_chat, ml_predictions, dashboard, advanced_charts, profile';
COMMENT ON COLUMN user_uploads.upload_context IS 'Additional context like feature name, dataset type, etc.';
COMMENT ON COLUMN user_uploads.status IS 'Status of the upload: active, processing, archived, failed';
COMMENT ON COLUMN user_uploads.processing_status IS 'Processing status of the upload: active, processing, archived, failed';