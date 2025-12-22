import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message } = await req.json();
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    // Fetch user's recent data for context
    const { data: dataPoints } = await supabase
      .from('data_points')
      .select('*')
      .eq('user_id', user.id)
      .order('date_recorded', { ascending: false })
      .limit(50);

    // ---------------------------------------------------------
    // Rate Limiting (Phase 2)
    // ---------------------------------------------------------
    // Limit: 20 requests per minute per user
    const LIMIT = 20;
    const WINDOW = 60;

    const { data: isAllowed, error: rateError } = await supabase
      .rpc('check_rate_limit', {
        limit_key: `ai_chat:${user.id}`,
        max_requests: LIMIT,
        window_seconds: WINDOW
      });

    if (rateError) {
      console.error('Rate limit check failed:', rateError);
      // Fail open or closed? Let's fail open for now but log it, or fail closed if safe.
      // Failing closed is safer for abuse.
    }

    if (isAllowed === false) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    // ---------------------------------------------------------

    // Create context from data
    const dataContext = dataPoints ?
      `Recent business metrics: ${JSON.stringify(dataPoints.slice(0, 10))}` :
      'No recent data available';

    console.log('Making OpenAI request for user:', user.id);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an AI Business Intelligence assistant. You help analyze business data and provide insights. 
            Context about the user's data: ${dataContext}
            
            Provide actionable insights, identify trends, and suggest business improvements. Keep responses concise and professional.
            If asked about predictions or forecasts, mention that you can provide trend analysis based on historical data.`
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    console.log('AI response generated successfully');

    return new Response(
      JSON.stringify({ message: aiResponse }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in ai-chat function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});