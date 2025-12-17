import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { hashContent } from '@/lib/conversationUtils';

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

        // Generate new embedding
        const response = await fetch(`${GEMINI_EMBEDDING_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'models/text-embedding-004',
                content: { parts: [{ text }] }
            })
        });

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.statusText}`);
        }

        const data = await response.json();
        const embeddingVector = data.embedding.values;

        // Cache the embedding if workspace provided
        if (workspaceId) {
            const contentHash = await hashContent(text);

            supabase.from('embedding_cache').insert({
                content_hash: contentHash,
                content_text: text.substring(0, 1000), // Store truncated text
                embedding: embeddingVector,
                workspace_id: workspaceId
            }).then(() => {
                // Cache inserted successfully
            }).catch((err) => {
                // Ignore cache insert errors (might be duplicate)
                console.warn('Cache insert failed:', err);
            });
        }

        return embeddingVector;
    };

    // Generate embeddings for dataset
    const generateDatasetEmbeddings = useMutation({
        mutationFn: async ({ datasetId }: { datasetId: string }) => {
            if (!user) throw new Error('Not authenticated');

            // Fetch data points
            const { data: dataPoints, error: fetchError } = await supabase
                .from('data_points')
                .select('*')
                .eq('dataset_id', datasetId)
                .limit(100); // Limit for now

            if (fetchError) throw fetchError;
            if (!dataPoints || dataPoints.length === 0) {
                throw new Error('No data found in dataset');
            }

            // Delete existing embeddings for this dataset
            await supabase
                .from('embeddings')
                .delete()
                .eq('dataset_id', datasetId);

            // Process in batches
            const batchSize = 10;
            const embeddings = [];

            for (let i = 0; i < dataPoints.length; i += batchSize) {
                const batch = dataPoints.slice(i, i + batchSize);

                for (const point of batch) {
                    // Create content from data point
                    const content = `${point.metric_name}: ${point.metric_value} (recorded on ${point.date_recorded})`;

                    // Generate embedding
                    const embeddingVector = await generateEmbedding(content);

                    embeddings.push({
                        user_id: user.id,
                        dataset_id: datasetId,
                        content,
                        metadata: {
                            metric_name: point.metric_name,
                            metric_value: point.metric_value,
                            date_recorded: point.date_recorded,
                        },
                        embedding: embeddingVector,
                    });
                }

                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            // Insert embeddings
            const { error: insertError } = await supabase
                .from('embeddings')
                .insert(embeddings);

            if (insertError) throw insertError;

            return { count: embeddings.length };
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['embeddings'] });
            toast({
                title: 'Success',
                description: `Generated ${data.count} embeddings`,
            });
        },
        onError: (error) => {
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
        datasetId?: string
    ): Promise<SearchResult[]> => {
        if (!user) throw new Error('Not authenticated');

        // Generate query embedding
        const queryEmbedding = await generateEmbedding(query);

        // Use RPC function for vector similarity search
        const { data, error } = await supabase.rpc('search_embeddings', {
            query_embedding: queryEmbedding,
            match_threshold: 0.5,
            match_count: limit,
            filter_dataset_id: datasetId || null,
        });

        if (error) {
            // If RPC doesn't exist, fall back to manual search
            console.warn('RPC search failed, using fallback:', error);

            let query = supabase
                .from('embeddings')
                .select('*')
                .eq('user_id', user.id);

            if (datasetId) {
                query = query.eq('dataset_id', datasetId);
            }

            const { data: embeddings, error: fetchError } = await query.limit(100);

            if (fetchError) throw fetchError;

            // Calculate cosine similarity manually
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

    // Get embeddings count
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

// Cosine similarity helper
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
