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
    const { predictionId, features } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user
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

    // Get prediction details
    const { data: prediction, error: predError } = await supabase
      .from('predictions_log')
      .select('*')
      .eq('id', predictionId)
      .eq('user_id', user.id)
      .single();

    if (predError || !prediction) {
      throw new Error('Prediction not found');
    }

    // Calculate SHAP-like feature importance
    // In production, this would call a Python service with actual SHAP
    const inputFeatures = prediction.input_features as Record<string, number>;
    const featureNames = Object.keys(inputFeatures);
    
    // Simple mock importance calculation
    const importance = featureNames.map(name => {
      const value = inputFeatures[name];
      // Mock calculation: higher values = higher importance
      const impact = Math.abs(value) * Math.random() * 0.3;
      return {
        feature: name,
        value: value,
        importance: impact,
        impact: value > 0.5 ? 'positive' : 'negative'
      };
    }).sort((a, b) => b.importance - a.importance);

    const explanation = {
      prediction_id: predictionId,
      predicted_value: prediction.predicted_probability,
      predicted_label: prediction.predicted_label,
      model_version: prediction.model_version || 'v1.0',
      feature_importance: importance,
      confidence: prediction.confidence_score || 0.85,
      interpretation: importance[0].importance > 0.2 
        ? `${importance[0].feature} is the strongest predictor with ${(importance[0].importance * 100).toFixed(1)}% impact`
        : 'Multiple factors contribute equally to this prediction',
      top_factors: importance.slice(0, 3).map(f => ({
        name: f.feature,
        value: f.value,
        contribution: `${(f.importance * 100).toFixed(1)}%`
      }))
    };

    console.log('Explainability generated for prediction:', predictionId);

    return new Response(
      JSON.stringify(explanation),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in model-explainability:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});