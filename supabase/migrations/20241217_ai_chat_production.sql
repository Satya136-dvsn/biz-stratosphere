-- AI Chat Production Enhancement: Context Management & Caching
-- Phase 1A: Context window, embedding cache, and rate limiting
-- This migration is self-contained and creates base tables if needed

-- PART 1: Create base tables (if they don't exist)

-- Chat conversations table
CREATE TABLE IF NOT EXISTS chat_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    sources JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for base tables
CREATE INDEX IF NOT EXISTS chat_conversations_user_id_idx ON chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS chat_conversations_updated_at_idx ON chat_conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS chat_messages_conversation_id_idx ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS chat_messages_created_at_idx ON chat_messages(created_at);

-- RLS policies for base tables
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own conversations" ON chat_conversations;
CREATE POLICY "Users can view their own conversations"
    ON chat_conversations FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own conversations" ON chat_conversations;
CREATE POLICY "Users can create their own conversations"
    ON chat_conversations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own conversations" ON chat_conversations;
CREATE POLICY "Users can update their own conversations"
    ON chat_conversations FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own conversations" ON chat_conversations;
CREATE POLICY "Users can delete their own conversations"
    ON chat_conversations FOR DELETE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view messages in their conversations" ON chat_messages;
CREATE POLICY "Users can view messages in their conversations"
    ON chat_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM chat_conversations 
            WHERE id = chat_messages.conversation_id 
            AND user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can create messages in their conversations" ON chat_messages;
CREATE POLICY "Users can create messages in their conversations"
    ON chat_messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM chat_conversations 
            WHERE id = chat_messages.conversation_id 
            AND user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete messages in their conversations" ON chat_messages;
CREATE POLICY "Users can delete messages in their conversations"
    ON chat_messages FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM chat_conversations 
            WHERE id = chat_messages.conversation_id 
            AND user_id = auth.uid()
        )
    );

-- Function to update conversation timestamp
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chat_conversations 
    SET updated_at = NOW() 
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS chat_messages_update_conversation ON chat_messages;
CREATE TRIGGER chat_messages_update_conversation
    AFTER INSERT ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_timestamp();

-- PART 2: Add production enhancements to chat_conversations
ALTER TABLE chat_conversations 
ADD COLUMN IF NOT EXISTS context_window INT DEFAULT 10,
ADD COLUMN IF NOT EXISTS temperature DECIMAL DEFAULT 0.7,
ADD COLUMN IF NOT EXISTS max_tokens INT DEFAULT 2000,
ADD COLUMN IF NOT EXISTS model_name TEXT DEFAULT 'gemini-pro';

-- Add comments
COMMENT ON COLUMN chat_conversations.context_window IS 'Number of recent messages to include in context (sliding window)';
COMMENT ON COLUMN chat_conversations.temperature IS 'AI response randomness (0.0 = deterministic, 1.0 = creative)';
COMMENT ON COLUMN chat_conversations.max_tokens IS 'Maximum tokens in AI response';

-- 2. Create embedding cache table for performance optimization
CREATE TABLE IF NOT EXISTS embedding_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_hash TEXT UNIQUE NOT NULL,
  content_text TEXT NOT NULL,
  embedding vector(1536),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed TIMESTAMPTZ DEFAULT NOW(),
  access_count INT DEFAULT 1
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_embedding_cache_hash ON embedding_cache(content_hash);
CREATE INDEX IF NOT EXISTS idx_embedding_cache_workspace ON embedding_cache(workspace_id);
CREATE INDEX IF NOT EXISTS idx_embedding_cache_last_accessed ON embedding_cache(last_accessed);

-- Enable RLS
ALTER TABLE embedding_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can access their workspace embeddings"
ON embedding_cache FOR SELECT
USING (workspace_id IN (
  SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
));

CREATE POLICY "Users can insert embeddings for their workspace"
ON embedding_cache FOR INSERT
WITH CHECK (workspace_id IN (
  SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
));

CREATE POLICY "Users can update embeddings for their workspace"
ON embedding_cache FOR UPDATE
USING (workspace_id IN (
  SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
));

-- 3. Create AI usage limits table for rate limiting
CREATE TABLE IF NOT EXISTS ai_usage_limits (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_messages INT DEFAULT 0,
  daily_limit INT DEFAULT 50,
  monthly_messages INT DEFAULT 0,
  monthly_limit INT DEFAULT 1000,
  last_reset_daily DATE DEFAULT CURRENT_DATE,
  last_reset_monthly DATE DEFAULT CURRENT_DATE,
  tier TEXT DEFAULT 'free', -- free, pro, enterprise
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_ai_usage_limits_user ON ai_usage_limits(user_id);

-- Enable RLS
ALTER TABLE ai_usage_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own usage limits"
ON ai_usage_limits FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own usage limits"
ON ai_usage_limits FOR UPDATE
USING (user_id = auth.uid());

-- 4. Function to auto-reset daily limits
CREATE OR REPLACE FUNCTION reset_daily_ai_limits()
RETURNS void AS $$
BEGIN
  UPDATE ai_usage_limits
  SET daily_messages = 0, last_reset_daily = CURRENT_DATE
  WHERE last_reset_daily < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Function to auto-reset monthly limits
CREATE OR REPLACE FUNCTION reset_monthly_ai_limits()
RETURNS void AS $$
BEGIN
  UPDATE ai_usage_limits
  SET monthly_messages = 0, last_reset_monthly = CURRENT_DATE
  WHERE last_reset_monthly < CURRENT_DATE - INTERVAL '1 month';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Function to clean old embedding cache entries (optional maintenance)
CREATE OR REPLACE FUNCTION clean_old_embedding_cache()
RETURNS void AS $$
BEGIN
  -- Delete entries not accessed in 30 days with low access count
  DELETE FROM embedding_cache
  WHERE last_accessed < NOW() - INTERVAL '30 days'
  AND access_count < 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Add indexes to chat_messages for better performance with context window queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_created 
ON chat_messages(conversation_id, created_at DESC);

-- Comments
COMMENT ON TABLE embedding_cache IS 'Cache for embeddings to reduce API calls and improve performance';
COMMENT ON TABLE ai_usage_limits IS 'Rate limiting and usage quotas for AI chat feature';
COMMENT ON FUNCTION reset_daily_ai_limits IS 'Auto-reset daily message limits (run daily via cron or edge function)';
COMMENT ON FUNCTION reset_monthly_ai_limits IS 'Auto-reset monthly message limits (run monthly via cron or edge function)';
COMMENT ON FUNCTION clean_old_embedding_cache IS 'Cleanup old unused embedding cache entries to save space';
