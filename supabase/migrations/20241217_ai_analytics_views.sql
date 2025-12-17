-- AI Chat Analytics - Production Ops Monitoring
-- Lightweight analytics using materialized views (no new tables needed)

-- 1. Cache Performance Analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS ai_cache_analytics AS
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_embeddings,
  SUM(access_count) as total_accesses,
  AVG(access_count)::numeric(10,2) as avg_access_count,
  COUNT(CASE WHEN access_count > 1 THEN 1 END) as cache_hits,
  COUNT(*) as cache_entries,
  (COUNT(CASE WHEN access_count > 1 THEN 1 END)::float / NULLIF(COUNT(*), 0)::float * 100)::numeric(10,2) as cache_hit_rate_percent,
  workspace_id
FROM embedding_cache
GROUP BY DATE(created_at), workspace_id
ORDER BY date DESC;

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_ai_cache_analytics_date ON ai_cache_analytics(date);
CREATE INDEX IF NOT EXISTS idx_ai_cache_analytics_workspace ON ai_cache_analytics(workspace_id);

-- 2. Usage Analytics (Rate Limiting)
CREATE MATERIALIZED VIEW IF NOT EXISTS ai_usage_analytics AS
SELECT
  tier,
  COUNT(*) as user_count,
  AVG(daily_messages)::numeric(10,2) as avg_daily_messages,
  AVG(monthly_messages)::numeric(10,2) as avg_monthly_messages,
  MAX(daily_messages) as max_daily_usage,
  MAX(monthly_messages) as max_monthly_usage,
  SUM(daily_messages) as total_daily_messages,
  SUM(monthly_messages) as total_monthly_messages,
  COUNT(CASE WHEN daily_messages >= daily_limit THEN 1 END) as users_at_daily_limit,
  COUNT(CASE WHEN monthly_messages >= monthly_limit THEN 1 END) as users_at_monthly_limit
FROM ai_usage_limits
GROUP BY tier;

-- 3. Conversation Analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS conversation_analytics AS
SELECT
  DATE(c.created_at) as date,
  COUNT(DISTINCT c.id) as total_conversations,
  COUNT(m.id) as total_messages,
  AVG(c.context_window)::numeric(10,2) as avg_context_window,
  AVG(c.temperature)::numeric(10,2) as avg_temperature,
  AVG(c.max_tokens)::numeric(10,2) as avg_max_tokens,
  COUNT(DISTINCT c.user_id) as unique_users
FROM chat_conversations c
LEFT JOIN chat_messages m ON m.conversation_id = c.id
GROUP BY DATE(c.created_at)
ORDER BY date DESC;

CREATE INDEX IF NOT EXISTS idx_conversation_analytics_date ON conversation_analytics(date);

-- 4. Message Analytics (by type)
CREATE MATERIALIZED VIEW IF NOT EXISTS message_analytics AS
SELECT
  DATE(created_at) as date,
  role,
  COUNT(*) as message_count,
  AVG(LENGTH(content))::numeric(10,2) as avg_message_length,
  MAX(LENGTH(content)) as max_message_length
FROM chat_messages
GROUP BY DATE(created_at), role
ORDER BY date DESC, role;

CREATE INDEX IF NOT EXISTS idx_message_analytics_date ON message_analytics(date);

-- 5. Refresh Function (call periodically or on-demand)
CREATE OR REPLACE FUNCTION refresh_ai_analytics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW ai_cache_analytics;
  REFRESH MATERIALIZED VIEW ai_usage_analytics;
  REFRESH MATERIALIZED VIEW conversation_analytics;
  REFRESH MATERIALIZED VIEW message_analytics;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Function to get latest analytics summary
CREATE OR REPLACE FUNCTION get_ai_analytics_summary()
RETURNS TABLE (
  metric_name TEXT,
  metric_value NUMERIC,
  metric_unit TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'total_conversations'::TEXT,
    SUM(total_conversations)::NUMERIC,
    'conversations'::TEXT
  FROM conversation_analytics
  WHERE date >= CURRENT_DATE - INTERVAL '30 days'
  
  UNION ALL
  
  SELECT 
    'total_messages'::TEXT,
    SUM(total_messages)::NUMERIC,
    'messages'::TEXT
  FROM conversation_analytics
  WHERE date >= CURRENT_DATE - INTERVAL '30 days'
  
  UNION ALL
  
  SELECT
    'avg_cache_hit_rate'::TEXT,
    AVG(cache_hit_rate_percent)::NUMERIC,
    'percent'::TEXT
  FROM ai_cache_analytics
  WHERE date >= CURRENT_DATE - INTERVAL '30 days'
  
  UNION ALL
  
  SELECT
    'active_users'::TEXT,
    COUNT(DISTINCT user_id)::NUMERIC,
    'users'::TEXT
  FROM ai_usage_limits
  WHERE daily_messages > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON MATERIALIZED VIEW ai_cache_analytics IS 'Cache performance metrics by date and workspace';
COMMENT ON MATERIALIZED VIEW ai_usage_analytics IS 'Rate limit usage statistics by tier';
COMMENT ON MATERIALIZED VIEW conversation_analytics IS 'Conversation and message statistics by date';
COMMENT ON MATERIALIZED VIEW message_analytics IS 'Message statistics by date and role';
COMMENT ON FUNCTION refresh_ai_analytics IS 'Refresh all AI analytics materialized views';
COMMENT ON FUNCTION get_ai_analytics_summary IS 'Get summary of key AI metrics for last 30 days';
