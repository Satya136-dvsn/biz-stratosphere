-- Create automation rules table
CREATE TABLE IF NOT EXISTS automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT true,
  trigger_type TEXT NOT NULL, -- 'threshold', 'schedule', 'data_change'
  condition JSONB NOT NULL, -- Flexible condition storage
  action_type TEXT NOT NULL, -- 'email', 'webhook', 'notification'
  action_config JSONB NOT NULL, -- Action-specific configuration
  last_triggered TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create automation execution log
CREATE TABLE IF NOT EXISTS automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES automation_rules(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL, -- 'success', 'failure', 'skipped'
  condition_result JSONB,
  action_result JSONB,
  error_message TEXT,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS Policies
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rules"
  ON automation_rules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own rules"
  ON automation_rules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own rules"
  ON automation_rules FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own rules"
  ON automation_rules FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own logs"
  ON automation_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS automation_rules_user_id_idx ON automation_rules(user_id);
CREATE INDEX IF NOT EXISTS automation_rules_enabled_idx ON automation_rules(enabled) WHERE enabled = true;
CREATE INDEX IF NOT EXISTS automation_logs_rule_id_idx ON automation_logs(rule_id);
CREATE INDEX IF NOT EXISTS automation_logs_executed_at_idx ON automation_logs(executed_at DESC);

-- Scheduled reports table
CREATE TABLE IF NOT EXISTS scheduled_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  report_type TEXT NOT NULL, -- 'kpi_summary', 'trend_analysis', 'custom'
  recipients TEXT[] NOT NULL,
  schedule TEXT NOT NULL, -- Cron expression
  config JSONB DEFAULT '{}'::jsonb,
  enabled BOOLEAN DEFAULT true,
  last_sent TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE scheduled_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own reports"
  ON scheduled_reports FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS scheduled_reports_user_id_idx ON scheduled_reports(user_id);
CREATE INDEX IF NOT EXISTS scheduled_reports_enabled_idx ON scheduled_reports(enabled) WHERE enabled = true;
