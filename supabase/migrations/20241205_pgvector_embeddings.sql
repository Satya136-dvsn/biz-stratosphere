-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Create embeddings table
CREATE TABLE IF NOT EXISTS data_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dataset_id UUID REFERENCES datasets(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  content_type TEXT NOT NULL, -- 'dataset_summary', 'row_data', 'column_info'
  embedding vector(1536), -- OpenAI ada-002 dimension
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add RLS policies
ALTER TABLE data_embeddings ENABLE ROW LEVEL SECURITY;

-- Users can only see their own embeddings
CREATE POLICY "Users can view own embeddings"
  ON data_embeddings FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own embeddings
CREATE POLICY "Users can insert own embeddings"
  ON data_embeddings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own embeddings
CREATE POLICY "Users can delete own embeddings"
  ON data_embeddings FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS data_embeddings_user_id_idx ON data_embeddings(user_id);
CREATE INDEX IF NOT EXISTS data_embeddings_dataset_id_idx ON data_embeddings(dataset_id);

-- Create vector similarity search index (HNSW algorithm)
CREATE INDEX IF NOT EXISTS data_embeddings_embedding_idx 
  ON data_embeddings 
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Function to search similar embeddings
CREATE OR REPLACE FUNCTION match_embeddings(
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5,
  filter_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  content_type TEXT,
  similarity FLOAT,
  metadata JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    data_embeddings.id,
    data_embeddings.content,
    data_embeddings.content_type,
    1 - (data_embeddings.embedding <=> query_embedding) AS similarity,
    data_embeddings.metadata
  FROM data_embeddings
  WHERE 
    (filter_user_id IS NULL OR data_embeddings.user_id = filter_user_id)
    AND 1 - (data_embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY data_embeddings.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
