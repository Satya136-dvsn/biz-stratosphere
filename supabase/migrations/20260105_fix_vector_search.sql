-- Fix match_embeddings to use the correct 'embeddings' table (768 dim) instead of legacy 'data_embeddings'

-- First, drop the valid legacy function if it exists to avoid ambiguity
DROP FUNCTION IF EXISTS match_embeddings(vector(1536), float, int, uuid);

-- Create the correct function for Gemini (768 dimensions)
CREATE OR REPLACE FUNCTION match_embeddings(
  query_embedding vector(768),
  match_threshold FLOAT DEFAULT 0.5,
  match_count INT DEFAULT 5,
  filter_dataset_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  similarity FLOAT,
  metadata JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    embeddings.id,
    embeddings.content,
    1 - (embeddings.embedding <=> query_embedding) AS similarity,
    embeddings.metadata
  FROM embeddings
  WHERE 
    1 - (embeddings.embedding <=> query_embedding) > match_threshold
    AND (
      filter_dataset_id IS NULL 
      OR 
      -- Check both the column (if populated) and metadata (fallback)
      embeddings.dataset_id = filter_dataset_id 
      OR 
      (embeddings.metadata->>'dataset_id')::uuid = filter_dataset_id
    )
  ORDER BY embeddings.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
