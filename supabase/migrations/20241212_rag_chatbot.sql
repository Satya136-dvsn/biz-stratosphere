-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Embeddings table for storing document vectors
CREATE TABLE IF NOT EXISTS embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    dataset_id UUID REFERENCES datasets(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    embedding vector(768),  -- Gemini text-embedding-004 dimension
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vector similarity index (ivfflat for fast approximate search)
CREATE INDEX embeddings_embedding_idx ON embeddings 
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- Regular indexes
CREATE INDEX embeddings_user_id_idx ON embeddings(user_id);
CREATE INDEX embeddings_dataset_id_idx ON embeddings(dataset_id);
CREATE INDEX embeddings_created_at_idx ON embeddings(created_at DESC);

-- RLS policies
ALTER TABLE embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own embeddings"
    ON embeddings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own embeddings"
    ON embeddings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own embeddings"
    ON embeddings FOR DELETE
    USING (auth.uid() = user_id);

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

-- Indexes for chat
CREATE INDEX chat_conversations_user_id_idx ON chat_conversations(user_id);
CREATE INDEX chat_conversations_updated_at_idx ON chat_conversations(updated_at DESC);
CREATE INDEX chat_messages_conversation_id_idx ON chat_messages(conversation_id);
CREATE INDEX chat_messages_created_at_idx ON chat_messages(created_at);

-- RLS policies for chat
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own conversations"
    ON chat_conversations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations"
    ON chat_conversations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
    ON chat_conversations FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations"
    ON chat_conversations FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view messages in their conversations"
    ON chat_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM chat_conversations 
            WHERE id = chat_messages.conversation_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create messages in their conversations"
    ON chat_messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM chat_conversations 
            WHERE id = chat_messages.conversation_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete messages in their conversations"
    ON chat_messages FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM chat_conversations 
            WHERE id = chat_messages.conversation_id 
            AND user_id = auth.uid()
        )
    );

-- Function to update conversation updated_at timestamp
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chat_conversations 
    SET updated_at = NOW() 
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER chat_messages_update_conversation
    AFTER INSERT ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_timestamp();
