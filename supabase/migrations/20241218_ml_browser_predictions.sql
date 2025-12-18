-- ML Models: FREE Browser-Based Implementation
-- Metadata storage only (models in Supabase Storage)

-- =====================================================
-- 1. Model registry (metadata only, models stored separately)
-- =====================================================

CREATE TABLE IF NOT EXISTS ml_models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  version TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('classification', 'regression', 'clustering')),
  storage_path TEXT NOT NULL, --Path in Supabase Storage
  size_kb INT NOT NULL,
  input_features TEXT[] NOT NULL,
  output_labels TEXT[],
  description TEXT NOT NULL,
  accuracy DECIMAL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for active models
CREATE INDEX IF NOT EXISTS idx_ml_models_active ON ml_models(is_active) WHERE is_active = true;

-- =====================================================
-- 2. Prediction cache (save results to reduce re-computation)
-- =====================================================

CREATE TABLE IF NOT EXISTS ml_prediction_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  model_id UUID NOT NULL REFERENCES ml_models(id) ON DELETE CASCADE,
  input_hash TEXT NOT NULL, -- Hash of input features
  inputs JSONB NOT NULL,
  prediction DECIMAL NOT NULL,
  confidence DECIMAL,
  feature_importance JSONB,
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
  UNIQUE(model_id, input_hash)
);

-- Index for cache lookups (removed NOW() predicate - not IMMUTABLE)
CREATE INDEX IF NOT EXISTS idx_prediction_cache_lookup 
  ON ml_prediction_cache(model_id, input_hash, expires_at);

-- Index for cleanup
CREATE INDEX IF NOT EXISTS idx_prediction_cache_expiry 
  ON ml_prediction_cache(expires_at);

-- =====================================================
-- 3. Prediction history (track all predictions)
-- =====================================================

CREATE TABLE IF NOT EXISTS ml_predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  model_id UUID NOT NULL REFERENCES ml_models(id) ON DELETE CASCADE,
  inputs JSONB NOT NULL,
  prediction DECIMAL NOT NULL,
  confidence DECIMAL,
  feature_importance JSONB,
  cache_hit BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for queries
CREATE INDEX IF NOT EXISTS idx_predictions_user 
  ON ml_predictions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_predictions_model 
  ON ml_predictions(model_id, created_at DESC);

-- =====================================================
-- 4. Model usage statistics
-- =====================================================

CREATE OR REPLACE VIEW ml_model_stats AS
SELECT 
  m.id as model_id,
  m.name as model_name,
  m.version,
  COUNT(DISTINCT p.user_id) as unique_users,
  COUNT(p.id) as total_predictions,
  COUNT(CASE WHEN p.cache_hit THEN 1 END) as cache_hits,
  ROUND(
    COUNT(CASE WHEN p.cache_hit THEN 1 END)::NUMERIC / 
    NULLIF(COUNT(p.id), 0) * 100, 2
  ) as cache_hit_rate_pct,
  AVG(p.confidence) as avg_confidence,
  MAX(p.created_at) as last_used_at
FROM ml_models m
LEFT JOIN ml_predictions p ON p.model_id = m.id
WHERE m.is_active = true
GROUP BY m.id, m.name, m.version;

-- =====================================================
-- 5. Function to clean up expired cache
-- =====================================================

CREATE OR REPLACE FUNCTION cleanup_expired_predictions()
RETURNS void AS $$
BEGIN
  -- Delete expired cache entries
  DELETE FROM ml_prediction_cache
  WHERE expires_at < NOW();
  
  -- Delete old predictions (keep last 30 days only to save space)
  DELETE FROM ml_predictions
  WHERE created_at < (NOW() - INTERVAL '30 days');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
--6. Insert demo models metadata
-- =====================================================

INSERT INTO ml_models (name, version, type, storage_path, size_kb, input_features, output_labels, description, accuracy) VALUES
  ('churn_model', 'v1.0', 'classification', 'models/churn_model/model.json', 250, 
   ARRAY['usage_frequency', 'support_tickets', 'tenure_months', 'monthly_spend', 'feature_usage_pct'],
   ARRAY['No Churn', 'Churn'],
   'Predicts customer churn probability based on usage patterns and engagement metrics',
   0.85),
  
  ('revenue_model', 'v1.0', 'regression', 'models/revenue_model/model.json', 180,
   ARRAY['num_customers', 'avg_deal_size', 'marketing_spend', 'sales_team_size', 'market_growth_pct'],
   NULL,
   'Forecasts monthly revenue based on business metrics and market conditions',
   0.78)
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 7. RLS Policies
-- =====================================================

ALTER TABLE ml_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_prediction_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_predictions ENABLE ROW LEVEL SECURITY;

-- Anyone can view active models
CREATE POLICY "Active models visible to all"
  ON ml_models FOR SELECT
  USING (is_active = true);

-- Users can manage their own cache
CREATE POLICY "Users can manage own prediction cache"
  ON ml_prediction_cache FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can manage their own predictions
CREATE POLICY "Users can manage own predictions"
  ON ml_predictions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT ON ml_models TO authenticated;
GRANT SELECT ON ml_model_stats TO authenticated;
GRANT ALL ON ml_prediction_cache TO authenticated;
GRANT ALL ON ml_predictions TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_predictions TO service_role;
