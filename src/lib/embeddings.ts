import { supabase } from '@/integrations/supabase/client';
import { aiOrchestrator } from '@/lib/ai/orchestrator';

const AI_PROVIDER = import.meta.env.VITE_AI_PROVIDER || 'local';
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export interface EmbeddingResult {
    id: string;
    content: string;
    content_type: string;
    similarity: number;
    metadata: any;
}

/**
 * Generate embeddings using local Ollama or OpenAI's ada-002 model.
 * When VITE_AI_PROVIDER=local, uses Ollama (free, no API key needed).
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    // Use local Ollama embeddings when provider is 'local'
    if (AI_PROVIDER === 'local') {
        return aiOrchestrator.generateLocalEmbedding(text);
    }

    // Fallback: OpenAI embedding API
    const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
            model: 'text-embedding-ada-002',
            input: text,
        }),
    });

    if (!response.ok) {
        throw new Error(`OpenAI embedding error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
}

/**
 * Store embedding in database
 */
export async function storeEmbedding({
    userId,
    datasetId,
    content,
    contentType,
    embedding,
    metadata = {},
}: {
    userId: string;
    datasetId?: string;
    content: string;
    contentType: string;
    embedding: number[];
    metadata?: any;
}) {
    const { data, error } = await supabase
        .from('data_embeddings')
        .insert({
            user_id: userId,
            dataset_id: datasetId,
            content,
            content_type: contentType,
            embedding: `[${embedding.join(',')}]`,
            metadata,
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Search for similar content using vector similarity
 */
export async function searchSimilarContent(
    query: string,
    userId: string,
    options: {
        threshold?: number;
        limit?: number;
    } = {}
): Promise<EmbeddingResult[]> {
    const { threshold = 0.7, limit = 5 } = options;

    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);

    // Search using the RPC function
    const { data, error } = await supabase.rpc('match_embeddings', {
        query_embedding: `[${queryEmbedding.join(',')}]`,
        match_threshold: threshold,
        match_count: limit,
        filter_user_id: userId,
    });

    if (error) throw error;
    return data || [];
}

/**
 * Generate and store embeddings for a dataset
 */
export async function embedDataset(
    userId: string,
    datasetId: string,
    datasetContent: any
): Promise<void> {
    const tasks: Promise<any>[] = [];

    // 1. Dataset summary
    if (datasetContent.summary) {
        const summaryText = JSON.stringify(datasetContent.summary);
        tasks.push(
            generateEmbedding(summaryText).then((embedding) =>
                storeEmbedding({
                    userId,
                    datasetId,
                    content: summaryText,
                    contentType: 'dataset_summary',
                    embedding,
                    metadata: { dataset_name: datasetContent.name },
                })
            )
        );
    }

    // 2. Column information
    if (datasetContent.columns) {
        Object.entries(datasetContent.columns).forEach(([colName, colInfo]: [string, any]) => {
            const colText = `Column ${colName}: ${JSON.stringify(colInfo)}`;
            tasks.push(
                generateEmbedding(colText).then((embedding) =>
                    storeEmbedding({
                        userId,
                        datasetId,
                        content: colText,
                        contentType: 'column_info',
                        embedding,
                        metadata: { column_name: colName },
                    })
                )
            );
        });
    }

    // 3. Sample rows (limit to avoid too many embeddings)
    if (datasetContent.sampleRows && datasetContent.sampleRows.length > 0) {
        const sampleText = datasetContent.sampleRows
            .slice(0, 10)
            .map((row: any) => JSON.stringify(row))
            .join('\n');

        tasks.push(
            generateEmbedding(sampleText).then((embedding) =>
                storeEmbedding({
                    userId,
                    datasetId,
                    content: sampleText,
                    contentType: 'row_data',
                    embedding,
                    metadata: { rows: datasetContent.sampleRows.length },
                })
            )
        );
    }

    // Execute all embedding tasks
    await Promise.all(tasks);
}

/**
 * Delete embeddings for a dataset
 */
export async function deleteDatasetEmbeddings(datasetId: string): Promise<void> {
    const { error } = await supabase
        .from('data_embeddings')
        .delete()
        .eq('dataset_id', datasetId);

    if (error) throw error;
}
