-- Report configurations table for saving report settings
CREATE TABLE IF NOT EXISTS report_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    report_type TEXT NOT NULL,  -- 'kpi_summary', 'sales_report', 'custom'
    date_range_start DATE,
    date_range_end DATE,
    selected_metrics JSONB DEFAULT '[]'::jsonb,
    selected_dimensions JSONB DEFAULT '[]'::jsonb,
    filters JSONB DEFAULT '{}'::jsonb,
    dataset_id UUID REFERENCES datasets(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_generated_at TIMESTAMP WITH TIME ZONE
);

-- RLS policies
ALTER TABLE report_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own report configs"
    ON report_configurations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own report configs"
    ON report_configurations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own report configs"
    ON report_configurations FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own report configs"
    ON report_configurations FOR DELETE
    USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_report_configs_user_id ON report_configurations(user_id);
CREATE INDEX idx_report_configs_type ON report_configurations(report_type);
CREATE INDEX idx_report_configs_created_at ON report_configurations(created_at DESC);
