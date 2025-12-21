-- Advanced ML Features: Accuracy Tracking, Versioning, and RAG Tuning

-- 1. Model metrics table for accuracy tracking over time
CREATE TABLE IF NOT EXISTS ml_model_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    model_name TEXT NOT NULL,
    version TEXT NOT NULL,
    accuracy DECIMAL,
    loss DECIMAL,
    mae DECIMAL,
    r2 DECIMAL,
    training_time_ms INT,
    dataset_size INT,
    hyperparameters JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for history lookups
CREATE INDEX IF NOT EXISTS idx_ml_model_metrics_lookup ON ml_model_metrics(model_name, version);
CREATE INDEX IF NOT EXISTS idx_ml_model_metrics_user ON ml_model_metrics(user_id, created_at DESC);

-- 2. Enhanced embedding search function with score visualization support
-- (The existing search functions already return 1 - distance as similarity)

-- 3. Update embedding_cache vector dimension if it was incorrect (e.g. 1536 -> 768 for Gemini)
-- Note: Changing dimension requires dropping and recreating the column or table
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'embedding_cache' AND column_name = 'embedding'
  ) THEN
    -- Check dimension
    IF (SELECT atttypmod FROM pg_attribute 
        WHERE attrelid = 'embedding_cache'::regclass AND attname = 'embedding') != 768 THEN
      ALTER TABLE embedding_cache ALTER COLUMN embedding TYPE vector(768);
    END IF;
  END IF;
END $$;

-- 4. Enable RLS for the new table
ALTER TABLE ml_model_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own model metrics"
  ON ml_model_metrics FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. Grant permissions
GRANT ALL ON ml_model_metrics TO authenticated;
