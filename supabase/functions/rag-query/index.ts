import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { query, userId } = await req.json()

        if (!query || !userId) {
            throw new Error('Missing required parameters: query, userId')
        }

        // Initialize Supabase client
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 1. Generate embedding for the query
        const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'text-embedding-ada-002',
                input: query,
            }),
        })

        const embeddingData = await embeddingResponse.json()
        const queryEmbedding = embeddingData.data[0].embedding

        // 2. Search for similar content using vector search
        const { data: similarDocs, error: searchError } = await supabaseClient.rpc(
            'match_embeddings',
            {
                query_embedding: queryEmbedding,
                match_threshold: 0.7,
                match_count: 5,
                filter_user_id: userId,
            }
        )

        if (searchError) throw searchError

        // 3. Build context from similar documents
        const context = similarDocs && similarDocs.length > 0
            ? similarDocs
                .map((doc: any, i: number) => `[Source ${i + 1}] ${doc.content}`)
                .join('\n\n')
            : 'No relevant data found in your uploads.'

        // 4. Call GPT with context (RAG!)
        const completionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: `You are an AI business analyst. Use the following context from the user's data to answer their question accurately. Always cite your sources using [Source N] notation.

Context from user's data:
${context}

If the context doesn't contain relevant information, say so and provide general guidance.`,
                    },
                    {
                        role: 'user',
                        content: query,
                    },
                ],
                temperature: 0.7,
                max_tokens: 1000,
            }),
        })

        const completionData = await completionResponse.json()
        const answer = completionData.choices[0].message.content
        const usage = completionData.usage

        // 5. Return response with sources
        return new Response(
            JSON.stringify({
                answer,
                sources: similarDocs || [],
                usage,
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            }
        )
    }
})
