-- Chart configurations table for saving chart setups
CREATE TABLE IF NOT EXISTS chart_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    chart_type TEXT NOT NULL,
    dataset_id UUID REFERENCES datasets(id) ON DELETE SET NULL,
    x_column TEXT,
    y_column TEXT,
    filters JSONB DEFAULT '{}'::jsonb,
    customization JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS policies for chart_configurations
ALTER TABLE chart_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own chart configurations"
    ON chart_configurations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own chart configurations"
    ON chart_configurations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chart configurations"
    ON chart_configurations FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chart configurations"
    ON chart_configurations FOR DELETE
    USING (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX idx_chart_configs_user_id ON chart_configurations(user_id);
CREATE INDEX idx_chart_configs_created_at ON chart_configurations(created_at DESC);
