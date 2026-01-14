-- =====================================================
-- AI Response Audit Logging Table
-- P5: Hallucination Prevention
-- =====================================================

-- Create table for auditing AI responses
CREATE TABLE IF NOT EXISTS ai_response_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
    conversation_id UUID REFERENCES chat_conversations(id) ON DELETE SET NULL,
    
    -- Query and response info
    query TEXT NOT NULL,
    response_preview TEXT,  -- First 500 chars of response
    
    -- Confidence metrics
    confidence_score NUMERIC(4,3) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
    confidence_level TEXT NOT NULL CHECK (confidence_level IN ('high', 'medium', 'low')),
    confidence_reasons TEXT[],
    
    -- Grounding metrics
    grounding_score NUMERIC(4,3) CHECK (grounding_score >= 0 AND grounding_score <= 1),
    is_grounded BOOLEAN DEFAULT true,
    
    -- Source info
    source_count INTEGER DEFAULT 0,
    dataset_id UUID REFERENCES datasets(id) ON DELETE SET NULL,
    dataset_name TEXT,
    average_similarity NUMERIC(4,3),
    
    -- Metadata
    model_name TEXT,
    response_time_ms INTEGER,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Indexes for querying
    CONSTRAINT valid_confidence_level CHECK (confidence_level IN ('high', 'medium', 'low'))
);

-- Enable RLS
ALTER TABLE ai_response_audits ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own audits
CREATE POLICY "Users can view own audits"
    ON ai_response_audits
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own audits
CREATE POLICY "Users can insert own audits"
    ON ai_response_audits
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Admins can view all audits (for admin dashboard)
CREATE POLICY "Admins can view all audits"
    ON ai_response_audits
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_ai_audits_user_id ON ai_response_audits(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_audits_created_at ON ai_response_audits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_audits_confidence_level ON ai_response_audits(confidence_level);
CREATE INDEX IF NOT EXISTS idx_ai_audits_workspace ON ai_response_audits(workspace_id);

-- Create view for admin dashboard
CREATE OR REPLACE VIEW ai_response_audit_summary AS
SELECT 
    DATE_TRUNC('day', created_at) AS date,
    confidence_level,
    COUNT(*) AS count,
    AVG(confidence_score) AS avg_confidence,
    AVG(source_count) AS avg_sources,
    COUNT(*) FILTER (WHERE is_grounded = false) AS ungrounded_count
FROM ai_response_audits
GROUP BY DATE_TRUNC('day', created_at), confidence_level
ORDER BY date DESC;

-- Grant access to authenticated users
GRANT SELECT, INSERT ON ai_response_audits TO authenticated;
GRANT SELECT ON ai_response_audit_summary TO authenticated;

-- Comment for documentation
COMMENT ON TABLE ai_response_audits IS 'Audit log for AI responses with confidence and grounding metrics for hallucination prevention';
