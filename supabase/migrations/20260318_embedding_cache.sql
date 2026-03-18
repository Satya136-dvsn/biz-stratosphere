-- Phase 12+: Semantic Embedding Cache
-- Created: 2026-03-18

CREATE TABLE IF NOT EXISTS public.embedding_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query_text TEXT NOT NULL,
    embedding_vector vector(768),
    retrieved_context JSONB NOT NULL,
    usage_count INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for similarity search
CREATE INDEX IF NOT EXISTS idx_embedding_cache_vector ON public.embedding_cache USING ivfflat (embedding_vector vector_cosine_ops) WITH (lists = 100);

-- TTL cleanup function
CREATE OR REPLACE FUNCTION cleanup_expired_embedding_cache() RETURNS void AS $$
BEGIN
    DELETE FROM public.embedding_cache WHERE last_used_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;
