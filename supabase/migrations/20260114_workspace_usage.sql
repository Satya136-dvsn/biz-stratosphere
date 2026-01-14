-- =====================================================
-- Workspace Usage Metrics Table
-- P8: Platform Polish
-- =====================================================

-- Create table for tracking workspace usage
CREATE TABLE IF NOT EXISTS workspace_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Usage metrics
    metric_type TEXT NOT NULL CHECK (metric_type IN ('upload', 'ai_query', 'automation_trigger')),
    metric_count INTEGER DEFAULT 1,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    date_bucket DATE DEFAULT CURRENT_DATE,
    
    -- Indexes
    CONSTRAINT unique_daily_metric UNIQUE (workspace_id, user_id, metric_type, date_bucket)
);

-- Enable RLS
ALTER TABLE workspace_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view usage for workspaces they belong to
CREATE POLICY "Users can view workspace usage"
    ON workspace_usage
    FOR SELECT
    USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members 
            WHERE user_id = auth.uid()
        )
    );

-- Users can insert their own usage
CREATE POLICY "Users can insert own usage"
    ON workspace_usage
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own usage
CREATE POLICY "Users can update own usage"
    ON workspace_usage
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_workspace_usage_workspace ON workspace_usage(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_usage_date ON workspace_usage(date_bucket);
CREATE INDEX IF NOT EXISTS idx_workspace_usage_type ON workspace_usage(metric_type);

-- Create aggregated view for dashboard
CREATE OR REPLACE VIEW workspace_usage_summary AS
SELECT 
    workspace_id,
    metric_type,
    DATE_TRUNC('day', date_bucket) AS date,
    SUM(metric_count) AS total_count,
    COUNT(DISTINCT user_id) AS unique_users
FROM workspace_usage
GROUP BY workspace_id, metric_type, DATE_TRUNC('day', date_bucket);

-- Function to increment usage metrics (upsert)
CREATE OR REPLACE FUNCTION increment_workspace_usage(
    p_workspace_id UUID,
    p_user_id UUID,
    p_metric_type TEXT,
    p_increment INTEGER DEFAULT 1,
    p_metadata JSONB DEFAULT '{}'
) RETURNS VOID AS $$
BEGIN
    INSERT INTO workspace_usage (workspace_id, user_id, metric_type, metric_count, metadata, date_bucket)
    VALUES (p_workspace_id, p_user_id, p_metric_type, p_increment, p_metadata, CURRENT_DATE)
    ON CONFLICT (workspace_id, user_id, metric_type, date_bucket)
    DO UPDATE SET 
        metric_count = workspace_usage.metric_count + p_increment,
        metadata = workspace_usage.metadata || p_metadata;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION increment_workspace_usage TO authenticated;

-- Grant select on views
GRANT SELECT ON workspace_usage_summary TO authenticated;

-- Comment for documentation
COMMENT ON TABLE workspace_usage IS 'Tracks usage metrics per workspace: uploads, AI queries, automation triggers';
