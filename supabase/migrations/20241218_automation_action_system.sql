-- Action System Enhancement
-- Week 2, Day 8-9: Action chaining, webhooks, success/failure handlers

-- =====================================================
-- 1. Create action chains table
-- =====================================================

CREATE TABLE IF NOT EXISTS automation_action_chains (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_id UUID NOT NULL REFERENCES automation_rules(id) ON DELETE CASCADE,
  sequence_order INT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('email', 'webhook', 'notification', 'slack', 'data_update')),
  action_config JSONB NOT NULL,
  condition_type TEXT CHECK (condition_type IN ('always', 'on_success', 'on_failure')), -- When to execute
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(rule_id, sequence_order)
);

-- Index for action chains
CREATE INDEX IF NOT EXISTS idx_action_chains_rule 
  ON automation_action_chains(rule_id, sequence_order);

-- RLS for action chains
ALTER TABLE automation_action_chains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their action chains"
  ON automation_action_chains FOR ALL
  USING (rule_id IN (
    SELECT id FROM automation_rules WHERE user_id = auth.uid()
  ));

-- =====================================================
-- 2. Create webhook execution log
-- =====================================================

CREATE TABLE IF NOT EXISTS automation_webhook_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  log_id UUID REFERENCES automation_logs(id) ON DELETE CASCADE,
  rule_id UUID NOT NULL REFERENCES automation_rules(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  method TEXT NOT NULL DEFAULT 'POST',
  headers JSONB,
  payload JSONB,
  response_status INT,
  response_body TEXT,
  error_message TEXT,
  duration_ms INT,
  executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for webhook logs
CREATE INDEX IF NOT EXISTS idx_webhook_logs_rule 
  ON automation_webhook_logs(rule_id, executed_at DESC);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_log 
  ON automation_webhook_logs(log_id);

-- RLS for webhook logs
ALTER TABLE automation_webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their webhook logs"
  ON automation_webhook_logs FOR SELECT
  USING (rule_id IN (
    SELECT id FROM automation_rules WHERE user_id = auth.uid()
  ));

-- =====================================================
-- 3. Enhanced action execution function
-- =====================================================

CREATE OR REPLACE FUNCTION execute_action_chain(
  p_rule_id UUID,
  p_log_id UUID,
  p_context JSONB
)
RETURNS TABLE (
  success BOOLEAN,
  executed_count INT,
  results JSONB
) AS $$
DECLARE
  v_action RECORD;
  v_result JSONB;
  v_results JSONB := '[]'::JSONB;
  v_count INT := 0;
  v_overall_success BOOLEAN := TRUE;
  v_previous_success BOOLEAN := TRUE;
BEGIN
  -- Get all enabled actions in sequence
  FOR v_action IN 
    SELECT * FROM automation_action_chains
    WHERE rule_id = p_rule_id 
      AND enabled = true
    ORDER BY sequence_order ASC
  LOOP
    -- Check if action should execute based on condition
    IF v_action.condition_type = 'always' OR
       (v_action.condition_type = 'on_success' AND v_previous_success) OR
       (v_action.condition_type = 'on_failure' AND NOT v_previous_success)
    THEN
      -- Execute action (actual execution happens in Edge Function)
      v_result := jsonb_build_object(
        'action_type', v_action.action_type,
        'sequence', v_action.sequence_order,
        'status', 'pending'
      );
      
      v_results := v_results || jsonb_build_array(v_result);
      v_count := v_count + 1;
    END IF;
  END LOOP;

  success := v_overall_success;
  executed_count := v_count;
  results := v_results;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. Webhook validation function
-- =====================================================

CREATE OR REPLACE FUNCTION validate_webhook_config(
  p_config JSONB
)
RETURNS TABLE (
  is_valid BOOLEAN,
  error_message TEXT
) AS $$
DECLARE
  v_url TEXT;
  v_method TEXT;
BEGIN
  -- Extract URL
  v_url := p_config->>'url';
  
  IF v_url IS NULL OR v_url = '' THEN
    is_valid := FALSE;
    error_message := 'Webhook URL is required';
    RETURN NEXT;
    RETURN;
  END IF;

  -- Validate URL format
  IF NOT (v_url ~ '^https?://') THEN
    is_valid := FALSE;
    error_message := 'Webhook URL must start with http:// or https://';
    RETURN NEXT;
    RETURN;
  END IF;

  -- Validate method
  v_method := COALESCE(p_config->>'method', 'POST');
  IF v_method NOT IN ('GET', 'POST', 'PUT', 'PATCH', 'DELETE') THEN
    is_valid := FALSE;
    error_message := 'Invalid HTTP method';
    RETURN NEXT;
    RETURN;
  END IF;

  is_valid := TRUE;
  error_message := NULL;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- 5. Action templates
-- =====================================================

CREATE TABLE IF NOT EXISTS automation_action_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  action_type TEXT NOT NULL,
  template_config JSONB NOT NULL,
  is_public BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Common action templates
INSERT INTO automation_action_templates (name, description, action_type, template_config, is_public) VALUES
  ('Slack Alert', 'Send message to Slack channel', 'webhook', 
   '{"url": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL", "method": "POST", "headers": {"Content-Type": "application/json"}, "body_template": {"text": "Alert: {{rule_name}} triggered"}}'::JSONB, 
   true),
  ('Email Notification', 'Send email alert', 'email',
   '{"subject": "Automation Alert: {{rule_name}}", "body": "The rule {{rule_name}} has been triggered.\n\nMetric: {{metric}}\nValue: {{current_value}}\nThreshold: {{threshold}}"}'::JSONB,
   true),
  ('In-App Notification', 'Create in-app notification', 'notification',
   '{"title": "{{rule_name}}", "message": "{{metric}} is {{current_value}}", "type": "info"}'::JSONB,
   true)
ON CONFLICT DO NOTHING;

-- RLS for templates
ALTER TABLE automation_action_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public templates visible to all"
  ON automation_action_templates FOR SELECT
  USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Users can create templates"
  ON automation_action_templates FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own templates"
  ON automation_action_templates FOR UPDATE
  USING (created_by = auth.uid());

-- =====================================================
-- 6. Action statistics view
-- =====================================================

CREATE OR REPLACE VIEW automation_action_stats AS
SELECT 
  r.id as rule_id,
  r.user_id,
  r.name as rule_name,
  COUNT(DISTINCT l.id) as total_executions,
  COUNT(DISTINCT CASE WHEN l.status = 'success' THEN l.id END) as successful_executions,
  COUNT(DISTINCT wl.id) as webhook_calls,
  COUNT(DISTINCT CASE WHEN wl.response_status BETWEEN 200 AND 299 THEN wl.id END) as successful_webhooks,
  AVG(wl.duration_ms) as avg_webhook_duration_ms,
  MAX(l.executed_at) as last_execution,
  jsonb_build_object(
    'success_rate', 
    CASE WHEN COUNT(l.id) > 0 
      THEN ROUND((COUNT(CASE WHEN l.status = 'success' THEN 1 END)::NUMERIC / COUNT(l.id)::NUMERIC) * 100, 2)
      ELSE 0 
    END,
    'webhook_success_rate',
    CASE WHEN COUNT(wl.id) > 0
      THEN ROUND((COUNT(CASE WHEN wl.response_status BETWEEN 200 AND 299 THEN 1 END)::NUMERIC / COUNT(wl.id)::NUMERIC) * 100, 2)
      ELSE 0
    END
  ) as performance_metrics
FROM automation_rules r
LEFT JOIN automation_logs l ON l.rule_id = r.id
LEFT JOIN automation_webhook_logs wl ON wl.rule_id = r.id
GROUP BY r.id, r.user_id, r.name;

-- Grant permissions
GRANT SELECT ON automation_action_stats TO authenticated;
GRANT EXECUTE ON FUNCTION execute_action_chain TO service_role;
GRANT EXECUTE ON FUNCTION validate_webhook_config TO authenticated;
