// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { hashContent } from '@/lib/conversationUtils';
import { useUserUploads } from './useUserUploads';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const GEMINI_EMBEDDING_URL = 'https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent';

export interface Embedding {
    id: string;
    user_id: string;
    dataset_id?: string;
    content: string;
    metadata: Record<string, any>;
    embedding: number[];
    created_at: string;
}

export interface SearchResult {
    id: string;
    content: string;
    metadata: Record<string, any>;
    similarity: number;
}

export function useEmbeddings() {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { logUpload } = useUserUploads();

    // Generate embedding for text using Gemini with caching
    const generateEmbedding = async (text: string, workspaceId?: string): Promise<number[]> => {
        // Check cache first if workspace provided
        if (workspaceId) {
            const contentHash = await hashContent(text);

            const { data: cached } = await supabase
                .from('embedding_cache')
                .select('embedding')
                .eq('content_hash', contentHash)
                .eq('workspace_id', workspaceId)
                .single();

            if (cached && cached.embedding) {
                // Update access stats
                await supabase
                    .from('embedding_cache')
                    .update({
                        last_accessed: new Date().toISOString(),
                        access_count: supabase.rpc('increment', { row_id: contentHash })
                    })
                    .eq('content_hash', contentHash);

                return cached.embedding as number[];
            }
        }

        console.log(`[Embeddings] Generating embedding for text length: ${text.length}`);

        const response = await fetch(`${GEMINI_EMBEDDING_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'models/text-embedding-004',
                content: { parts: [{ text }] }
            })
        });

        if (!response.ok) {
            const errBody = await response.text();
            console.error(`[Embeddings] API Error: ${response.status} - ${errBody}`);
            throw new Error(`Gemini API error: ${response.statusText} ${errBody}`);
        }

        const data = await response.json();
        const embeddingVector = data.embedding.values;

        if (workspaceId) {
            const contentHash = await hashContent(text);

            // Execute in background
            (async () => {
                try {
                    await supabase.from('embedding_cache').insert({
                        content_hash: contentHash,
                        content_text: text.substring(0, 1000), // Store truncated text
                        embedding: embeddingVector,
                        workspace_id: workspaceId
                    });
                } catch (err) {
                    console.warn('Cache insert failed:', err);
                }
            })();
        }

        return embeddingVector;
    };

    // Generate embeddings for dataset
    const generateDatasetEmbeddings = useMutation({
        mutationFn: async ({ datasetId, chunkSize = 1, chunkOverlap = 0 }: { datasetId: string, chunkSize?: number, chunkOverlap?: number }) => {
            if (!user) throw new Error('Not authenticated');

            console.log(`[Embeddings] Starting generation for dataset ${datasetId}`);

            // Fetch data points
            const { data: dataPoints, error: fetchError } = await supabase
                .from('data_points')
                .select('*')
                .eq('dataset_id', datasetId)
                .order('date_recorded', { ascending: true })
                .limit(1000);

            if (fetchError) throw fetchError;
            if (!dataPoints || dataPoints.length === 0) {
                throw new Error('No data found in dataset');
            }

            console.log(`[Embeddings] Found ${dataPoints.length} data points.`);

            // Delete existing embeddings for this dataset
            // Use filter on metadata since dataset_id column is missing
            await supabase
                .from('embeddings')
                .delete()
                .filter('metadata->>dataset_id', 'eq', datasetId);

            // Create chunks
            const chunks: { content: string, metadata: any }[] = [];
            const step = Math.max(1, chunkSize - chunkOverlap);

            for (let i = 0; i < dataPoints.length; i += step) {
                const chunkEnd = Math.min(i + chunkSize, dataPoints.length);
                const chunkPoints = dataPoints.slice(i, chunkEnd);

                if (chunkPoints.length === 0) break;

                const content = chunkPoints.map(point =>
                    `${point.metric_name}: ${point.metric_value} (recorded on ${point.date_recorded})`
                ).join('\n');

                chunks.push({
                    content,
                    metadata: {
                        dataset_id: datasetId,
                        chunk_index: chunks.length,
                        start_record_idx: i,
                        end_record_idx: chunkEnd - 1,
                        record_count: chunkPoints.length,
                        start_date: chunkPoints[0].date_recorded,
                        end_date: chunkPoints[chunkPoints.length - 1].date_recorded
                    }
                });
            }

            console.log(`[Embeddings] Created ${chunks.length} chunks to embed.`);

            const batchSize = 5;
            let successCount = 0;
            let failedCount = 0;

            for (let i = 0; i < chunks.length; i += batchSize) {
                const batch = chunks.slice(i, i + batchSize);

                // Process batch in parallel
                const promises = batch.map(async (chunk) => {
                    try {
                        const embeddingVector = await generateEmbedding(chunk.content);
                        return {
                            user_id: user.id,
                            // dataset_id: datasetId, // Removed to avoid schema error
                            content: chunk.content,
                            metadata: chunk.metadata,
                            embedding: embeddingVector,
                        };
                    } catch (err) {
                        console.error(`[Embeddings] Chunk failed:`, err);
                        return null;
                    }
                });

                const results = await Promise.all(promises);
                const successfulEmbeddings = results.filter(r => r !== null);

                if (successfulEmbeddings.length > 0) {
                    // Incremental Insert to avoid payload size limits (400 Bad Request)
                    const { error: insertError } = await supabase
                        .from('embeddings')
                        .insert(successfulEmbeddings);

                    if (insertError) {
                        console.error('[Embeddings] Batch insert failed:', insertError);
                        failedCount += successfulEmbeddings.length;
                    } else {
                        successCount += successfulEmbeddings.length;
                    }
                }

                failedCount += (results.length - successfulEmbeddings.length);

                console.log(`[Embeddings] Batch ${i / batchSize + 1} complete. Saved: ${successfulEmbeddings.length}`);

                await new Promise(resolve => setTimeout(resolve, 200));
            }

            if (successCount === 0 && failedCount > 0) {
                throw new Error('All embedding generation attempts failed.');
            }

            console.log(`[Embeddings] Finished. Success: ${successCount}, Failed: ${failedCount}`);

            return { count: successCount, failed: failedCount };
        },
        onSuccess: async (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['embeddings'] });
            toast({
                title: 'Success',
                description: `Generated ${data.count} embeddings.${data.failed > 0 ? ` (${data.failed} failed)` : ''}`,
            });

            // Log the upload to Upload History
            try {
                const { data: dataset } = await supabase
                    .from('datasets')
                    .select('file_name, created_at')
                    .eq('id', variables.datasetId)
                    .single();

                if (dataset) {
                    logUpload({
                        filename: variables.datasetId,
                        original_filename: dataset.file_name || 'dataset.csv',
                        file_size_bytes: data.count * 1024, // Approximate size
                        file_type: 'csv',
                        mime_type: 'text/csv',
                        storage_path: `datasets/${variables.datasetId}`,
                        upload_source: 'ai_chat',
                        upload_context: {
                            feature: 'rag_knowledge_base',
                            dataset_name: dataset.file_name,
                            embeddings_generated: data.count,
                            chunk_size: variables.chunkSize,
                            chunk_overlap: variables.chunkOverlap,
                        },
                        row_count: data.count,
                        dataset_id: variables.datasetId,
                        status: 'active',
                    });
                }
            } catch (error) {
                console.warn('Failed to log upload:', error);
            }
        },
        onError: (error) => {
            console.error('[Embeddings] Fatal Error:', error);
            toast({
                title: 'Error',
                description: `Failed to generate embeddings: ${error.message}`,
                variant: 'destructive',
            });
        },
    });

    // Search similar embeddings
    const searchSimilar = async (
        query: string,
        limit: number = 5,
        datasetId?: string,
        threshold: number = 0.5
    ): Promise<SearchResult[]> => {
        if (!user) throw new Error('Not authenticated');

        console.log(`[RAG Debug] Searching similar for: "${query}"`, { limit, datasetId, threshold });

        const queryEmbedding = await generateEmbedding(query);

        const rpcParams = {
            query_embedding: queryEmbedding,
            match_threshold: threshold,
            match_count: limit,
            filter_dataset_id: datasetId || null,
        };
        console.log('[RAG Debug] Invoking RPC match_embeddings with:', rpcParams);

        const { data, error } = await supabase.rpc('match_embeddings', rpcParams);

        if (data) {
            console.log(`[RAG Debug] RPC returned ${data.length} matches.`);
            if (data.length > 0) {
                console.log('[RAG Debug] First match score:', data[0].similarity);
            }
        }

        if (error || !data) {
            if (error) {
                console.error('[RAG Debug] RPC Error Details:', {
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    code: error.code,
                    fullError: error
                });
                console.warn('RPC search failed, using fallback:', error);
            }

            let queryBuilder = supabase
                .from('embeddings')
                .select('*')
                .eq('user_id', user.id);

            if (datasetId) {
                queryBuilder = queryBuilder.filter('metadata->>dataset_id', 'eq', datasetId);
            }

            const { data: embeddings, error: fetchError } = await queryBuilder.limit(100);

            if (fetchError) throw fetchError;

            const results = embeddings?.map(emb => {
                const similarity = cosineSimilarity(queryEmbedding, emb.embedding);
                return {
                    id: emb.id,
                    content: emb.content,
                    metadata: emb.metadata,
                    similarity,
                };
            }) || [];

            return results
                .filter(r => r.similarity > 0.5)
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, limit);
        }

        return data || [];
    };

    const { data: embeddingsCount = 0 } = useQuery({
        queryKey: ['embeddings-count', user?.id],
        queryFn: async () => {
            if (!user) return 0;
            const { count, error } = await supabase
                .from('embeddings')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id);
            if (error) throw error;
            return count || 0;
        },
        enabled: !!user,
    });

    return {
        generateDatasetEmbeddings: generateDatasetEmbeddings.mutate,
        isGenerating: generateDatasetEmbeddings.isPending,
        searchSimilar,
        embeddingsCount,
    };
}

function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
