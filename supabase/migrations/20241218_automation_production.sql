-- Automation Rules: Production Upgrade
-- Week 1, Day 1-2: Scheduled Execution Schema

-- =====================================================
-- 1. Add scheduling columns to automation_rules
-- =====================================================

ALTER TABLE automation_rules 
ADD COLUMN IF NOT EXISTS schedule_type TEXT DEFAULT 'manual' 
  CHECK (schedule_type IN ('manual', 'cron', 'interval')),
ADD COLUMN IF NOT EXISTS schedule_config JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS last_run_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS next_run_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS retry_config JSONB DEFAULT '{"max_retries": 3, "retry_delay_seconds": 60}',
ADD COLUMN IF NOT EXISTS notification_channels JSONB DEFAULT '[]';

-- Add comment for documentation
COMMENT ON COLUMN automation_rules.schedule_type IS 'Type of scheduling: manual (default), cron (cron expression), interval (fixed interval)';
COMMENT ON COLUMN automation_rules.schedule_config IS 'Schedule configuration: {cron: "0 9 * * *"} or {interval_minutes: 60}';
COMMENT ON COLUMN automation_rules.retry_config IS 'Retry configuration: {max_retries: 3, retry_delay_seconds: 60}';
COMMENT ON COLUMN automation_rules.notification_channels IS 'Array of notification configs: [{type: "email", recipient: "user@example.com"}]';

-- =====================================================
-- 2. Create automation_notifications table
-- =====================================================

CREATE TABLE IF NOT EXISTS automation_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_id UUID NOT NULL REFERENCES automation_rules(id) ON DELETE CASCADE,
  log_id UUID REFERENCES automation_logs(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'webhook', 'slack', 'in_app')),
  recipient TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed', 'retrying')) DEFAULT 'pending',
  payload JSONB,
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comments
COMMENT ON TABLE automation_notifications IS 'Tracks all notifications sent by automation rules';
COMMENT ON COLUMN automation_notifications.channel IS 'Notification channel: email, webhook, slack, or in_app';
COMMENT ON COLUMN automation_notifications.status IS 'Delivery status: pending, sent, failed, retrying';
COMMENT ON COLUMN automation_notifications.retry_count IS 'Number of retry attempts for failed notifications';

-- =====================================================
-- 3. Create indexes for performance
-- =====================================================

-- Index for finding rules that need to run
CREATE INDEX IF NOT EXISTS idx_automation_next_run 
  ON automation_rules(next_run_at) 
  WHERE enabled = true AND schedule_type != 'manual' AND next_run_at IS NOT NULL;

-- Index for schedule type queries
CREATE INDEX IF NOT EXISTS idx_automation_schedule_type 
  ON automation_rules(schedule_type) 
  WHERE enabled = true;

-- Indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_rule 
  ON automation_notifications(rule_id);

CREATE INDEX IF NOT EXISTS idx_notifications_status 
  ON automation_notifications(status) 
  WHERE status IN ('pending', 'retrying');

CREATE INDEX IF NOT EXISTS idx_notifications_created 
  ON automation_notifications(created_at DESC);

-- Composite index for efficient notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_rule_status 
  ON automation_notifications(rule_id, status, created_at DESC);

-- =====================================================
-- 4. Row Level Security for notifications
-- =====================================================

ALTER TABLE automation_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their notifications"
  ON automation_notifications FOR SELECT
  USING (rule_id IN (
    SELECT id FROM automation_rules WHERE user_id = auth.uid()
  ));

CREATE POLICY "System can insert notifications"
  ON automation_notifications FOR INSERT
  WITH CHECK (true); -- Allow system to insert, will use service role

CREATE POLICY "System can update notifications"
  ON automation_notifications FOR UPDATE
  USING (true); -- Allow system to update, will use service role

-- =====================================================
-- 5. Helper function to update timestamps
-- =====================================================

CREATE OR REPLACE FUNCTION update_automation_notifications_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER automation_notifications_updated_at
  BEFORE UPDATE ON automation_notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_automation_notifications_timestamp();

-- =====================================================
-- 6. Function to calculate next run time
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_next_run(
  p_schedule_type TEXT,
  p_schedule_config JSONB,
  p_last_run TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TIMESTAMPTZ AS $$
DECLARE
  v_next_run TIMESTAMPTZ;
  v_interval_minutes INT;
BEGIN
  CASE p_schedule_type
    WHEN 'interval' THEN
      -- Get interval from config
      v_interval_minutes := COALESCE((p_schedule_config->>'interval_minutes')::INT, 60);
      v_next_run := p_last_run + (v_interval_minutes || ' minutes')::INTERVAL;
      
    WHEN 'cron' THEN
      -- For cron, we'll need to parse the expression
      -- For now, default to 24 hours (will be enhanced in scheduler)
      v_next_run := p_last_run + INTERVAL '24 hours';
      
    ELSE
      -- Manual scheduling, no next run
      v_next_run := NULL;
  END CASE;
  
  RETURN v_next_run;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_next_run IS 'Calculate next run time based on schedule type and config';

-- =====================================================
-- 7. Function to get pending scheduled rules
-- =====================================================

CREATE OR REPLACE FUNCTION get_pending_automation_rules()
RETURNS TABLE (
  id UUID,
  name TEXT,
  user_id UUID,
  schedule_type TEXT,
  schedule_config JSONB,
  condition JSONB,
  action_type TEXT,
  action_config JSONB,
  retry_config JSONB,
  notification_channels JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ar.id,
    ar.name,
    ar.user_id,
    ar.schedule_type,
    ar.schedule_config,
    ar.condition,
    ar.action_type,
    ar.action_config,
    ar.retry_config,
    ar.notification_channels
  FROM automation_rules ar
  WHERE ar.enabled = true
    AND ar.schedule_type != 'manual'
    AND ar.next_run_at IS NOT NULL
    AND ar.next_run_at <= NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_pending_automation_rules IS 'Get all rules that are due to run';

-- =====================================================
-- 8. Function to update rule execution times
-- =====================================================

CREATE OR REPLACE FUNCTION update_rule_execution(
  p_rule_id UUID,
  p_success BOOLEAN
)
RETURNS VOID AS $$
DECLARE
  v_rule RECORD;
  v_next_run TIMESTAMPTZ;
BEGIN
  -- Get rule details
  SELECT * INTO v_rule
  FROM automation_rules
  WHERE id = p_rule_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Rule not found: %', p_rule_id;
  END IF;
  
  -- Calculate next run
  v_next_run := calculate_next_run(
    v_rule.schedule_type,
    v_rule.schedule_config,
    NOW()
  );
  
  -- Update rule
  UPDATE automation_rules
  SET 
    last_run_at = NOW(),
    next_run_at = v_next_run,
    last_triggered = CASE WHEN p_success THEN NOW() ELSE last_triggered END
  WHERE id = p_rule_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_rule_execution IS 'Update rule timestamps after execution';

-- =====================================================
-- 9. View for rule execution history
-- =====================================================

CREATE OR REPLACE VIEW automation_rule_stats AS
SELECT 
  ar.id AS rule_id,
  ar.name AS rule_name,
  ar.schedule_type,
  ar.enabled,
  ar.last_run_at,
  ar.next_run_at,
  COUNT(al.id) AS total_executions,
  COUNT(al.id) FILTER (WHERE al.status = 'success') AS successful_executions,
  COUNT(al.id) FILTER (WHERE al.status = 'failure') AS failed_executions,
  COUNT(al.id) FILTER (WHERE al.status = 'skipped') AS skipped_executions,
  MAX(al.executed_at) AS last_execution_time,
  COUNT(an.id) AS total_notifications,
  COUNT(an.id) FILTER (WHERE an.status = 'sent') AS sent_notifications,
  COUNT(an.id) FILTER (WHERE an.status = 'failed') AS failed_notifications
FROM automation_rules ar
LEFT JOIN automation_logs al ON ar.id = al.rule_id
LEFT JOIN automation_notifications an ON ar.id = an.rule_id
GROUP BY ar.id, ar.name, ar.schedule_type, ar.enabled, ar.last_run_at, ar.next_run_at;

COMMENT ON VIEW automation_rule_stats IS 'Statistics and metrics for automation rules';

-- =====================================================
-- 10. Grant permissions
-- =====================================================

-- Grant access to authenticated users
GRANT SELECT ON automation_rule_stats TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION calculate_next_run TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_automation_rules TO service_role;
GRANT EXECUTE ON FUNCTION update_rule_execution TO service_role;

-- =====================================================
-- Migration complete
-- =====================================================
