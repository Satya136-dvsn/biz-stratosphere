// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

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

        // For now, we'll use Gemini without embeddings (simpler, still free)
        // Fetch recent data for context
        const { data: recentData } = await supabaseClient
            .from('datasets')
            .select('name, metadata, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(5)

        // Build context from recent datasets
        const context = recentData && recentData.length > 0
            ? recentData
                .map((dataset: any, i: number) =>
                    `[Source ${i + 1}] Dataset: ${dataset.name}\nUploaded: ${new Date(dataset.created_at).toLocaleDateString()}\nInfo: ${JSON.stringify(dataset.metadata || {})}`
                )
                .join('\n\n')
            : 'No datasets found. User should upload business data first.'

        // Call Gemini API (FREE!)
        const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${Deno.env.get('GEMINI_API_KEY')}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        role: 'user',
                        parts: [{ text: query }]
                    }],
                    systemInstruction: {
                        parts: [{
                            text: `You are an AI business analyst. Use the following context from the user's data to answer their question accurately. Always cite your sources using [Source N] notation.

Context from user's data:
${context}

If the context doesn't contain relevant information, say so and provide general guidance.`
                        }]
                    },
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 1000,
                    }
                }),
            }
        )

        if (!geminiResponse.ok) {
            const errorData = await geminiResponse.json()
            throw new Error(`Gemini API error: ${errorData.error?.message || geminiResponse.statusText}`)
        }

        const geminiData = await geminiResponse.json()
        const answer = geminiData.candidates[0].content.parts[0].text

        // Return response with sources
        return new Response(
            JSON.stringify({
                answer,
                sources: recentData || [],
                usage: {
                    model: 'gemini-1.5-flash',
                    cost: 0, // FREE!
                },
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
