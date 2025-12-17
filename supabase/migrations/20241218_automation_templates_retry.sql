-- Rule Templates & Retry Logic
-- Week 3: Production-ready finishing touches

-- =====================================================
-- 1. Rule templates categorization
-- =====================================================

CREATE TABLE IF NOT EXISTS automation_rule_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL, -- 'revenue', 'customer', 'performance', 'growth'
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT, -- Icon name for UI
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  trigger_type TEXT NOT NULL,
  condition JSONB NOT NULL,
  action_type TEXT NOT NULL,
  action_config JSONB NOT NULL,
  schedule_type TEXT DEFAULT 'manual',
  schedule_config JSONB DEFAULT '{}',
  advanced_config JSONB DEFAULT '{}',
  tags TEXT[],
  is_featured BOOLEAN DEFAULT false,
  usage_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for templates
CREATE INDEX IF NOT EXISTS idx_templates_category ON automation_rule_templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_featured ON automation_rule_templates(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_templates_tags ON automation_rule_templates USING GIN(tags);

-- =====================================================
-- 2. Insert pre-configured templates
-- =====================================================

INSERT INTO automation_rule_templates (category, name, description, icon, difficulty, trigger_type, condition, action_type, action_config, schedule_type, schedule_config, tags, is_featured) VALUES

-- Revenue Templates
('revenue', 'High Revenue Alert', 'Get notified when daily revenue exceeds a threshold', 'DollarSign', 'beginner', 'threshold', 
 '{"metric": "revenue", "operator": ">", "threshold": 10000}', 'notification', 
 '{"title": "High Revenue Day!", "message": "Revenue exceeded $10,000 today", "type": "success"}',
 'interval', '{"interval_minutes": 1440}', ARRAY['revenue', 'alerts', 'daily'], true),

('revenue', 'Revenue Decline Warning', 'Alert when revenue drops below target', 'TrendingDown', 'beginner', 'threshold',
 '{"metric": "revenue", "operator": "<", "threshold": 5000}', 'email',
 '{"subject": "Revenue Alert", "body": "Revenue has dropped below target threshold"}',
 'interval', '{"interval_minutes": 1440}', ARRAY['revenue', 'warning', 'daily'], true),

('revenue', 'Revenue Trend Monitor', 'Track increasing or decreasing revenue trends', 'TrendingUp', 'advanced', 'threshold',
 '{"metric": "revenue", "operator": ">", "threshold": 0}', 'notification',
 '{"title": "Revenue Trend Alert", "message": "Revenue trend detected", "type": "info"}',
 'interval', '{"interval_minutes": 1440}', ARRAY['revenue', 'trends', 'analytics'], false),

-- Customer Templates
('customer', 'High Customer Growth', 'Celebrate when customer count hits a milestone', 'Users', 'beginner', 'threshold',
 '{"metric": "customers", "operator": ">=", "threshold": 1000}', 'notification',
 '{"title": "Milestone Reached!", "message": "Customer count reached 1,000!", "type": "success"}',
 'interval', '{"interval_minutes": 60}', ARRAY['customers', 'growth', 'milestones'], true),

('customer', 'Churn Rate Alert', 'Monitor and alert on high churn rates', 'AlertTriangle', 'intermediate', 'threshold',
 '{"metric": "churn_rate", "operator": ">", "threshold": 5}', 'email',
 '{"subject": "High Churn Alert", "body": "Churn rate has exceeded 5%"}',
 'interval', '{"interval_minutes": 1440}', ARRAY['churn', 'retention', 'warning'], true),

('customer', 'Customer Acquisition Monitor', 'Track daily new customer sign-ups', 'UserPlus', 'beginner', 'threshold',
 '{"metric": "customers", "operator": ">", "threshold": 0}', 'notification',
 '{"title": "New Customers", "message": "New customers acquired today", "type": "info"}',
 'interval', '{"interval_minutes": 1440}', ARRAY['customers', 'acquisition', 'daily'], false),

-- Performance Templates
('performance', 'Conversion Rate Drop', 'Alert when conversion rate falls below target', 'Percent', 'intermediate', 'threshold',
 '{"metric": "conversion_rate", "operator": "<", "threshold": 2}', 'webhook',
 '{"url": "https://hooks.slack.com/YOUR_WEBHOOK", "method": "POST"}',
 'interval', '{"interval_minutes": 360}', ARRAY['conversion', 'performance', 'alerts'], false),

('performance', 'Weekly Performance Summary', 'Weekly digest of key metrics', 'Calendar', 'beginner', 'schedule',
 '{"metric": "revenue", "operator": ">", "threshold": 0}', 'email',
 '{"subject": "Weekly Performance Summary", "body": "Your weekly business metrics summary"}',
 'cron', '{"cron": "0 9 * * 1"}', ARRAY['weekly', 'summary', 'reports'], true),

-- Growth Templates  
('growth', 'Rapid Growth Alert', 'Detect rapid growth patterns', 'Rocket', 'advanced', 'threshold',
 '{"metric": "revenue", "operator": ">", "threshold": 0}', 'notification',
 '{"title": "Rapid Growth Detected", "message": "Your business is growing fast!", "type": "success"}',
 'interval', '{"interval_minutes": 1440}', ARRAY['growth', 'trends', 'analytics'], true),

('growth', 'Anomaly Detection', 'Detect unusual metric patterns', 'Activity', 'advanced', 'threshold',
 '{"metric": "revenue", "operator": ">", "threshold": 0}', 'email',
 '{"subject": "Anomaly Detected", "body": "Unusual activity detected in your metrics"}',
 'interval', '{"interval_minutes": 60}', ARRAY['anomaly', 'monitoring', 'advanced'], false);

-- =====================================================
-- 3. Retry configuration for failed rules
-- =====================================================

ALTER TABLE automation_logs
ADD COLUMN IF NOT EXISTS retry_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS max_retries INT DEFAULT 3;

-- Index for retry tracking
CREATE INDEX IF NOT EXISTS idx_logs_retry 
  ON automation_logs(next_retry_at) 
  WHERE status = 'failure' AND retry_count < max_retries;

-- =====================================================
-- 4. Function to get rules needing retry
-- =====================================================

CREATE OR REPLACE FUNCTION get_rules_for_retry()
RETURNS TABLE (
  log_id UUID,
  rule_id UUID,
  retry_count INT,
  error_message TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id as log_id,
    l.rule_id,
    l.retry_count,
    l.error_message
  FROM automation_logs l
  JOIN automation_rules r ON r.id = l.rule_id
  WHERE l.status = 'failure'
    AND l.retry_count < l.max_retries
    AND l.next_retry_at <= NOW()
    AND r.enabled = true
  ORDER BY l.next_retry_at ASC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. Function to create rule from template
-- =====================================================

CREATE OR REPLACE FUNCTION create_rule_from_template(
  p_user_id UUID,
  p_template_id UUID,
  p_rule_name TEXT,
  p_customizations JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_template RECORD;
  v_rule_id UUID;
BEGIN
  -- Get template
  SELECT * INTO v_template
  FROM automation_rule_templates
  WHERE id = p_template_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Template not found';
  END IF;

  -- Create rule from template
  INSERT INTO automation_rules (
    user_id,
    name,
    description,
    enabled,
    trigger_type,
    condition,
    action_type,
    action_config,
    schedule_type,
    schedule_config,
    advanced_config
  ) VALUES (
    p_user_id,
    p_rule_name,
    v_template.description,
    true,
    v_template.trigger_type,
    COALESCE(p_customizations->'condition', v_template.condition),
    v_template.action_type,
    COALESCE(p_customizations->'action_config', v_template.action_config),
    v_template.schedule_type,
    v_template.schedule_config,
    v_template.advanced_config
  ) RETURNING id INTO v_rule_id;

  -- Update template usage count
  UPDATE automation_rule_templates
  SET usage_count = usage_count + 1
  WHERE id = p_template_id;

  RETURN v_rule_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. RLS Policies
-- =====================================================

ALTER TABLE automation_rule_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Templates visible to all authenticated users"
  ON automation_rule_templates FOR SELECT
  TO authenticated
  USING (true);

-- Grant permissions
GRANT SELECT ON automation_rule_templates TO authenticated;
GRANT EXECUTE ON FUNCTION create_rule_from_template TO authenticated;
GRANT EXECUTE ON FUNCTION get_rules_for_retry TO service_role;
