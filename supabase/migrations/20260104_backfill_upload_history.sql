-- Backfill Upload History with Existing Datasets
-- This migration adds existing datasets to the user_uploads table

-- Insert existing datasets into user_uploads
INSERT INTO user_uploads (
    user_id,
    filename,
    original_filename,
    file_size_bytes,
    file_type,
    mime_type,
    storage_path,
    upload_source,
    upload_context,
    status,
    row_count,
    dataset_id,
    created_at,
    updated_at
)
SELECT 
    d.user_id,
    d.id as filename,
    d.file_name as original_filename,
    COALESCE(
        (SELECT COUNT(*) * 1024 FROM embeddings WHERE metadata->>'dataset_id' = d.id::text),
        5000
    ) as file_size_bytes,
    'csv' as file_type,
    'text/csv' as mime_type,
    'datasets/' || d.id as storage_path,
    'ai_chat' as upload_source,
    jsonb_build_object(
        'feature', 'rag_knowledge_base',
        'dataset_name', d.file_name,
        'backfilled', true,
        'embeddings_generated', (SELECT COUNT(*) FROM embeddings WHERE metadata->>'dataset_id' = d.id::text)
    ) as upload_context,
    'active' as status,
    (SELECT COUNT(*) FROM embeddings WHERE metadata->>'dataset_id' = d.id::text) as row_count,
    d.id as dataset_id,
    d.created_at,
    d.created_at as updated_at
FROM datasets d
WHERE NOT EXISTS (
    -- Don't insert if already exists
    SELECT 1 FROM user_uploads u WHERE u.dataset_id = d.id
);

-- Log the backfill
DO $$
DECLARE
    backfilled_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO backfilled_count 
    FROM user_uploads 
    WHERE upload_context->>'backfilled' = 'true';
    
    RAISE NOTICE 'Backfilled % existing datasets into upload history', backfilled_count;
END $$;
