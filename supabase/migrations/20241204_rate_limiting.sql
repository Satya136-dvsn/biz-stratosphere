-- Drop existing table and policies if they exist
DROP POLICY IF EXISTS "Users can view own rate limits" ON rate_limits;
DROP POLICY IF EXISTS "System can insert rate limits" ON rate_limits;
DROP POLICY IF EXISTS "System can update rate limits" ON rate_limits;
DROP TABLE IF EXISTS rate_limits CASCADE;

-- Create rate_limits table fresh
CREATE TABLE rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  limit_type TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  window_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create index for fast lookups
CREATE INDEX idx_rate_limits_user_type_window 
ON rate_limits(user_id, limit_type, window_end);

-- Enable RLS
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own rate limits
CREATE POLICY "Users can view own rate limits"
ON rate_limits FOR SELECT
USING (user_id = auth.uid());

-- RLS Policy: Users can insert their own rate  limits
CREATE POLICY "Users can insert own rate limits"
ON rate_limits FOR INSERT
WITH CHECK (user_id = auth.uid());

-- RLS Policy: Users can update their own rate limits  
CREATE POLICY "Users can update own rate limits"
ON rate_limits FOR UPDATE
USING (user_id = auth.uid());

-- Function to clean up expired rate limits
CREATE OR REPLACE FUNCTION cleanup_expired_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM rate_limits
  WHERE window_end < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments
COMMENT ON TABLE rate_limits IS 'Tracks API rate limit usage per user';
COMMENT ON COLUMN rate_limits.limit_type IS 'Type of operation: upload or ai_query';
COMMENT ON COLUMN rate_limits.count IS 'Number of operations in current window';
COMMENT ON COLUMN rate_limits.window_start IS 'Start of 24-hour window';
COMMENT ON COLUMN rate_limits.window_end IS 'End of 24-hour window (window_start + 24 hours)';
