-- Advanced Trigger System Enhancement
-- Week 2, Day 6-7: Advanced condition types

-- =====================================================
-- 1. Add advanced trigger configurations
-- =====================================================

-- Add composite and advanced trigger support
ALTER TABLE automation_rules
ADD COLUMN IF NOT EXISTS advanced_config JSONB DEFAULT '{}';

COMMENT ON COLUMN automation_rules.advanced_config IS 'Advanced trigger configuration for composite, trend, and anomaly detection';

-- =====================================================
-- 2. Create trend analysis table
-- =====================================================

CREATE TABLE IF NOT EXISTS automation_trend_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_id UUID NOT NULL REFERENCES automation_rules(id) ON DELETE CASCADE,
  metric TEXT NOT NULL,
  period_days INT NOT NULL,
  analysis_date DATE NOT NULL,
  avg_value DECIMAL,
  min_value DECIMAL,
  max_value DECIMAL,
  std_dev DECIMAL,
  trend_direction TEXT, -- 'increasing', 'decreasing', 'stable'
  trend_percentage DECIMAL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(rule_id, metric, period_days, analysis_date)
);

-- Indexes for trend analysis
CREATE INDEX IF NOT EXISTS idx_trend_rule_metric 
  ON automation_trend_analysis(rule_id, metric, analysis_date DESC);

CREATE INDEX IF NOT EXISTS idx_trend_analysis_date 
  ON automation_trend_analysis(analysis_date DESC);

-- RLS for trend analysis
ALTER TABLE automation_trend_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their trend analysis"
  ON automation_trend_analysis FOR SELECT
  USING (rule_id IN (
    SELECT id FROM automation_rules WHERE user_id = auth.uid()
  ));

-- =====================================================
-- 3. Function to calculate trend
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_metric_trend(
  p_user_id UUID,
  p_metric TEXT,
  p_period_days INT
)
RETURNS TABLE (
  avg_value DECIMAL,
  min_value DECIMAL,
  max_value DECIMAL,
  std_dev DECIMAL,
  trend_direction TEXT,
  trend_percentage DECIMAL
) AS $$
DECLARE
  v_recent_avg DECIMAL;
  v_older_avg DECIMAL;
  v_trend_pct DECIMAL;
  v_trend_dir TEXT;
BEGIN
  -- Get statistics for the period
  SELECT 
    AVG(CASE 
      WHEN p_metric = 'revenue' THEN (data->>'revenue')::DECIMAL
      WHEN p_metric = 'customers' THEN (data->>'customers')::DECIMAL
      WHEN p_metric = 'churn_rate' THEN (data->>'churn_rate')::DECIMAL
      ELSE 0
    END),
    MIN(CASE 
      WHEN p_metric = 'revenue' THEN (data->>'revenue')::DECIMAL
      WHEN p_metric = 'customers' THEN (data->>'customers')::DECIMAL
      WHEN p_metric = 'churn_rate' THEN (data->>'churn_rate')::DECIMAL
      ELSE 0
    END),
    MAX(CASE 
      WHEN p_metric = 'revenue' THEN (data->>'revenue')::DECIMAL
      WHEN p_metric = 'customers' THEN (data->>'customers')::DECIMAL
      WHEN p_metric = 'churn_rate' THEN (data->>'churn_rate')::DECIMAL
      ELSE 0
    END),
    STDDEV(CASE 
      WHEN p_metric = 'revenue' THEN (data->>'revenue')::DECIMAL
      WHEN p_metric = 'customers' THEN (data->>'customers')::DECIMAL
      WHEN p_metric = 'churn_rate' THEN (data->>'churn_rate')::DECIMAL
      ELSE 0
    END)
  INTO avg_value, min_value, max_value, std_dev
  FROM data_points
  WHERE user_id = p_user_id
    AND date_recorded >= CURRENT_DATE - p_period_days;

  -- Calculate trend (compare recent half vs older half)
  SELECT AVG(CASE 
    WHEN p_metric = 'revenue' THEN (data->>'revenue')::DECIMAL
    ELSE 0
  END)
  INTO v_recent_avg
  FROM data_points
  WHERE user_id = p_user_id
    AND date_recorded >= CURRENT_DATE - (p_period_days / 2);

  SELECT AVG(CASE 
    WHEN p_metric = 'revenue' THEN (data->>'revenue')::DECIMAL
    ELSE 0
  END)
  INTO v_older_avg
  FROM data_points
  WHERE user_id = p_user_id
    AND date_recorded >= CURRENT_DATE - p_period_days
    AND date_recorded < CURRENT_DATE - (p_period_days / 2);

  -- Calculate percentage change
  IF v_older_avg > 0 THEN
    v_trend_pct := ((v_recent_avg - v_older_avg) / v_older_avg) * 100;
  ELSE
    v_trend_pct := 0;
  END IF;

  -- Determine direction
  IF v_trend_pct > 5 THEN
    v_trend_dir := 'increasing';
  ELSIF v_trend_pct < -5 THEN
    v_trend_dir := 'decreasing';
  ELSE
    v_trend_dir := 'stable';
  END IF;

  trend_percentage := v_trend_pct;
  trend_direction := v_trend_dir;

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. Function to detect anomalies
-- =====================================================

CREATE OR REPLACE FUNCTION detect_metric_anomaly(
  p_user_id UUID,
  p_metric TEXT,
  p_current_value DECIMAL,
  p_std_dev_multiplier DECIMAL DEFAULT 2.0
)
RETURNS TABLE (
  is_anomaly BOOLEAN,
  avg_value DECIMAL,
  std_dev DECIMAL,
  deviation_score DECIMAL
) AS $$
DECLARE
  v_avg DECIMAL;
  v_std_dev DECIMAL;
  v_deviation DECIMAL;
BEGIN
  -- Calculate average and std dev for last 30 days
  SELECT 
    AVG(CASE 
      WHEN p_metric = 'revenue' THEN (data->>'revenue')::DECIMAL
      WHEN p_metric = 'customers' THEN (data->>'customers')::DECIMAL
      WHEN p_metric = 'churn_rate' THEN (data->>'churn_rate')::DECIMAL
      ELSE 0
    END),
    STDDEV(CASE 
      WHEN p_metric = 'revenue' THEN (data->>'revenue')::DECIMAL
      WHEN p_metric = 'customers' THEN (data->>'customers')::DECIMAL
      WHEN p_metric = 'churn_rate' THEN (data->>'churn_rate')::DECIMAL
      ELSE 0
    END)
  INTO v_avg, v_std_dev
  FROM data_points
  WHERE user_id = p_user_id
    AND date_recorded >= CURRENT_DATE - 30;

  -- Calculate deviation
  IF v_std_dev > 0 THEN
    v_deviation := ABS(p_current_value - v_avg) / v_std_dev;
  ELSE
    v_deviation := 0;
  END IF;

  avg_value := v_avg;
  std_dev := v_std_dev;
  deviation_score := v_deviation;
  is_anomaly := v_deviation > p_std_dev_multiplier;

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. Enhanced rule evaluation function
-- =====================================================

CREATE OR REPLACE FUNCTION evaluate_advanced_rule(
  p_rule_id UUID
)
RETURNS TABLE (
  matched BOOLEAN,
  evaluation_result JSONB
) AS $$
DECLARE
  v_rule RECORD;
  v_condition_type TEXT;
  v_result BOOLEAN := FALSE;
  v_details JSONB := '{}';
BEGIN
  -- Get rule
  SELECT * INTO v_rule
  FROM automation_rules
  WHERE id = p_rule_id AND enabled = true;

  IF NOT FOUND THEN
    matched := FALSE;
    evaluation_result := '{"error": "Rule not found or disabled"}';
    RETURN NEXT;
    RETURN;
  END IF;

  -- Determine condition type
  v_condition_type := COALESCE(v_rule.advanced_config->>'type', 'simple');

  CASE v_condition_type
    WHEN 'composite' THEN
      -- Handle composite conditions (AND/OR logic)
      -- Implementation in application layer
      v_result := TRUE;
      v_details := jsonb_build_object('type', 'composite', 'note', 'Evaluated by application');

    WHEN 'trend' THEN
      -- Handle trend detection
      DECLARE
        v_trend RECORD;
        v_direction TEXT;
        v_threshold_pct DECIMAL;
      BEGIN
        v_direction := v_rule.advanced_config->>'trend_direction';
        v_threshold_pct := (v_rule.advanced_config->>'threshold_pct')::DECIMAL;

        SELECT * INTO v_trend
        FROM calculate_metric_trend(
          v_rule.user_id,
          v_rule.condition->>'metric',
          COALESCE((v_rule.advanced_config->>'period_days')::INT, 7)
        );

        v_result := (v_trend.trend_direction = v_direction) AND 
                    (ABS(v_trend.trend_percentage) >= v_threshold_pct);
        
        v_details := jsonb_build_object(
          'type', 'trend',
          'trend_direction', v_trend.trend_direction,
          'trend_percentage', v_trend.trend_percentage,
          'threshold', v_threshold_pct
        );
      END;

    WHEN 'anomaly' THEN
      -- Handle anomaly detection
      DECLARE
        v_anomaly RECORD;
        v_current_val DECIMAL;
      BEGIN
        -- Get current value from latest data
        SELECT (data->>(v_rule.condition->>'metric'))::DECIMAL INTO v_current_val
        FROM data_points
        WHERE user_id = v_rule.user_id
        ORDER BY date_recorded DESC
        LIMIT 1;

        SELECT * INTO v_anomaly
        FROM detect_metric_anomaly(
          v_rule.user_id,
          v_rule.condition->>'metric',
          v_current_val,
          COALESCE((v_rule.advanced_config->>'std_dev_multiplier')::DECIMAL, 2.0)
        );

        v_result := v_anomaly.is_anomaly;
        v_details := jsonb_build_object(
          'type', 'anomaly',
          'current_value', v_current_val,
          'avg_value', v_anomaly.avg_value,
          'deviation_score', v_anomaly.deviation_score,
          'is_anomaly', v_anomaly.is_anomaly
        );
      END;

    ELSE
      -- Simple threshold condition (existing logic)
      v_result := TRUE;
      v_details := jsonb_build_object('type', 'simple', 'note', 'Standard evaluation');
  END CASE;

  matched := v_result;
  evaluation_result := v_details;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Grant permissions
-- =====================================================

GRANT SELECT ON automation_trend_analysis TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_metric_trend TO authenticated;
GRANT EXECUTE ON FUNCTION detect_metric_anomaly TO authenticated;
GRANT EXECUTE ON FUNCTION evaluate_advanced_rule TO service_role;
