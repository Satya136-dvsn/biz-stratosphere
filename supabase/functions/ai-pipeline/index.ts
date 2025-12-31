import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Types corresponding to our Client Types
interface RequestBody {
    messages: Array<{ role: string; content: string }>;
    provider: 'openai' | 'gemini';
    context?: string; // 'auto' | string | undefined
    config?: {
        temperature?: number;
        maxTokens?: number;
        jsonMode?: boolean;
    };
}

serve(async (req) => {
    // 1. Handle CORS Preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // 2. Auth Check
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            throw new Error('Missing Authorization header');
        }

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        );

        const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
        if (authError || !user) {
            throw new Error('Unauthorized');
        }

        // 3. Parse Body
        const body: RequestBody = await req.json();
        const { messages, provider, context, config } = body;
        const lastUserMessage = messages[messages.length - 1];

        if (!lastUserMessage || lastUserMessage.role !== 'user') {
            throw new Error('Invalid message history: Last message must be from user');
        }

        // 4. RAG Logic (if context is 'auto' or undefined, we try to find context)
        let ragContext = "";
        let dataSources: any[] = [];

        // Only perform RAG if context isn't explicitly provided as a string already
        // and if we have a query to search for.
        if ((!context || context === 'auto') && lastUserMessage.content.length > 5) {
            try {
                console.log(`[AI-Pipeline] Generating embedding for: "${lastUserMessage.content.substring(0, 50)}..."`);

                // Generate Embedding (using OpenAI for quality/compatibility with existing 1536 dim vectors)
                const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
                if (!openAIApiKey) throw new Error('OPENAI_API_KEY not set');

                const embedRes = await fetch('https://api.openai.com/v1/embeddings', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${openAIApiKey}`
                    },
                    body: JSON.stringify({
                        model: 'text-embedding-ada-002',
                        input: lastUserMessage.content.trim()
                    })
                });

                if (!embedRes.ok) throw new Error(`Embedding Failed: ${embedRes.statusText}`);
                const embedData = await embedRes.json();
                const embedding = embedData.data[0].embedding;

                // Perform Vector Search via RPC
                // Note: RPC name matches 'match_embeddings' from migrations
                const { data: similarChunks, error: ragError } = await supabaseClient.rpc('match_embeddings', {
                    query_embedding: embedding,
                    match_threshold: 0.7, // Strict threshold
                    match_count: 5,
                    filter_user_id: user.id
                });

                if (ragError) {
                    console.error('[AI-Pipeline] RAG Search Error:', ragError);
                } else if (similarChunks && similarChunks.length > 0) {
                    console.log(`[AI-Pipeline] Found ${similarChunks.length} context chunks`);

                    ragContext = similarChunks.map((chunk: any, i: number) =>
                        `[Source ${i + 1}] (${chunk.content_type}): ${chunk.content}`
                    ).join('\n\n');

                    dataSources = similarChunks; // Return these as metadata
                } else {
                    console.log('[AI-Pipeline] No relevant context found above threshold.');
                }

            } catch (err) {
                console.warn('[AI-Pipeline] RAG Process Failed (continuing without context):', err);
            }
        } else if (context && context !== 'auto') {
            ragContext = context; // User/Client provided explicit context
        }

        // 5. Construct System Message with Context
        const systemPromptSuffix = ragContext
            ? `\n\nRefer to the following Context in your answer:\n${ragContext}\n\nCitation Rule: If you use the Context, cite it as [Source X].`
            : "";

        // Insert or Append to System Prompt
        const finalMessages = [...messages];
        const sysIndex = finalMessages.findIndex(m => m.role === 'system');
        if (sysIndex >= 0) {
            finalMessages[sysIndex].content += systemPromptSuffix;
        } else if (ragContext) {
            finalMessages.unshift({ role: 'system', content: `You are a helpful assistant.${systemPromptSuffix}` });
        }

        // 6. Call Provider
        let responseContent = "";
        let usage = { total_tokens: 0 };
        let metadata: any = { sources: dataSources };

        if (provider === 'openai') {
            const openRes = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini', // Defaulting to 4o-mini for speed/cost balance
                    messages: finalMessages,
                    temperature: config?.temperature ?? 0.7,
                    max_tokens: config?.maxTokens ?? 1000,
                    response_format: config?.jsonMode ? { type: "json_object" } : undefined
                })
            });

            if (!openRes.ok) {
                const errText = await openRes.text();
                throw new Error(`OpenAI Error: ${errText}`);
            }
            const openData = await openRes.json();
            responseContent = openData.choices[0].message.content;
            usage = openData.usage;
            metadata.model = openData.model;

        } else {
            // Gemini Provider
            const geminiKey = Deno.env.get('GEMINI_API_KEY');
            if (!geminiKey) throw new Error('GEMINI_API_KEY not set');

            // Map messages to Gemini Format
            const geminiContents = finalMessages.map(m => ({
                role: m.role === 'assistant' ? 'model' : 'user', // Gemini uses 'model' not 'assistant'. 'system' is separate usually but 'user' works for simple cases or systemInstruction
                parts: [{ text: m.content }]
            }));

            // Extract system prompt if possible for better Gemini performance
            let systemInstruction = undefined;
            if (geminiContents.length > 0 && finalMessages[0].role === 'system') {
                systemInstruction = { parts: [{ text: finalMessages[0].content }] };
                geminiContents.shift(); // Remove strict system message from history
            }

            const geminiRes = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: geminiContents,
                        systemInstruction: systemInstruction,
                        generationConfig: {
                            temperature: config?.temperature ?? 0.7,
                            maxOutputTokens: config?.maxTokens ?? 1000,
                            responseMimeType: config?.jsonMode ? "application/json" : "text/plain"
                        }
                    })
                }
            );

            if (!geminiRes.ok) {
                const errText = await geminiRes.text();
                throw new Error(`Gemini Error: ${errText}`);
            }

            const geminiData = await geminiRes.json();
            // Safety check
            if (!geminiData.candidates || geminiData.candidates.length === 0) {
                throw new Error('Gemini returned no candidates (Safety block?)');
            }

            responseContent = geminiData.candidates[0].content.parts[0].text;
            usage = { total_tokens: geminiData.usageMetadata?.totalTokenCount || 0 };
            metadata.model = 'gemini-1.5-flash';
        }

        return new Response(JSON.stringify({
            content: responseContent,
            usage: usage,
            metadata: metadata
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('[AI-Pipeline] Fatal Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
