-- FIXED Migration Instructions for Supabase
-- Apply these in order to avoid errors

-- =====================================================
-- 1. Fix for: 20241212_rag_chatbot.sql
-- =====================================================
-- Error: "relation chat_conversations_user_id_idx already exists"
-- Solution: The embeddings table is what we need. Run this simplified version:

CREATE TABLE IF NOT EXISTS embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding vector(384),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for vector similarity search
CREATE INDEX IF NOT EXISTS idx_embeddings_vector 
  ON embeddings USING ivfflat (embedding vector_cosine_ops);

-- Index for lookups
CREATE INDEX IF NOT EXISTS idx_embeddings_conversation 
  ON embeddings(conversation_id);

-- RLS
ALTER TABLE embeddings ENABLE ROW LEVEL SECURITY;

-- Drop if exists, then create (PostgreSQL doesn't support IF NOT EXISTS for policies)
DROP POLICY IF EXISTS "Users can manage own embeddings" ON embeddings;
CREATE POLICY "Users can manage own embeddings"
  ON embeddings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT ALL ON embeddings TO authenticated;

-- =====================================================
-- 2. Fixed: 20241218_ml_browser_predictions.sql
-- =====================================================
-- Error: Fixed! The IMMUTABLE error is now resolved.
-- Just run the updated file.

-- =====================================================
-- 3. Automation Migrations (Apply in this order)
-- =====================================================

-- File 1: 20241218_automation_production.sql
-- Creates: automation_rules enhancements, scheduling, retry logic

-- File 2: 20241218_automation_advanced_triggers.sql  
-- Creates: automation_trend_analysis, advanced trigger functions

-- File 3: 20241218_automation_action_system.sql
-- Creates: automation_action_chains, automation_webhook_logs, templates

-- File 4: 20241218_automation_templates_retry.sql
-- Creates: automation_rule_templates, pre-configured templates

-- =====================================================
-- Quick Check: Verify Tables Exist
-- =====================================================

-- Run this to see what's already created:
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%automation%' 
  OR table_name LIKE '%ml_%' 
  OR table_name = 'embeddings'
ORDER BY table_name;
