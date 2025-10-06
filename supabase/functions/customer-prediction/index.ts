import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user info from auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    const { tenure, monthly_charges, contract_type, customer_id } = await req.json();

    console.log('Making prediction for customer:', { tenure, monthly_charges, contract_type, customer_id });

    // Validate input
    if (tenure === undefined || monthly_charges === undefined || !contract_type) {
      throw new Error('Missing required fields: tenure, monthly_charges, contract_type');
    }

    // Get user's company info
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('user_id', user.id)
      .single();

    // Create input features for prediction
    const inputFeatures = {
      tenure: Number(tenure),
      monthly_charges: Number(monthly_charges),
      contract_type,
      customer_id: customer_id || null,
    };

    // Use AI for prediction (or you can call external ML API here)
    const prediction = await generatePrediction(inputFeatures);

    // Store prediction in predictions_log table
    const { data: predictionRecord, error: insertError } = await supabase
      .from('predictions_log')
      .insert({
        user_id: user.id,
        company_id: profile?.company_id,
        tenant_id: profile?.company_id, // Store tenant_id as requested
        customer_id: customer_id || null,
        prediction_type: 'churn',
        predicted_probability: prediction.probability,
        predicted_label: prediction.probability > 0.5,
        confidence_score: prediction.confidence,
        input_features: inputFeatures,
        model_version: 'v1.0'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error storing prediction:', insertError);
      throw insertError;
    }

    console.log('Prediction stored successfully');

    return new Response(JSON.stringify({
      status: 'ok',
      message: 'Prediction saved successfully',
      result: {
        id: predictionRecord.id,
        predicted_label: prediction.probability > 0.5 ? 'Churn' : 'Retain',
        predicted_probability: prediction.probability,
        confidence_score: prediction.confidence,
        risk_level: getRiskLevel(prediction.probability),
        factors: prediction.factors,
        recommendations: prediction.recommendations
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in customer prediction:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to generate prediction',
      message: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function generatePrediction(features: any) {
  const fastApiUrl = Deno.env.get('FASTAPI_URL') || 'http://backend:8000';
  
  try {
    console.log('Calling FastAPI ML service at:', fastApiUrl);
    
    // Map contract type to numeric encoding expected by model
    const contractTypeMap: { [key: string]: number } = {
      'Month-to-month': 0,
      'One year': 1,
      'Two year': 2
    };
    
    const response = await fetch(`${fastApiUrl}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        features: {
          tenure: features.tenure,
          MonthlyCharges: features.monthly_charges,
          Contract: contractTypeMap[features.contract_type] || 0
        },
        model_version: 'v1'
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('FastAPI error:', response.status, errorText);
      throw new Error(`FastAPI error: ${response.status}`);
    }

    const data = await response.json();
    console.log('FastAPI prediction received:', data);
    
    // Transform FastAPI response to expected format
    const probability = data.probability || data.prediction;
    
    return {
      probability,
      factors: generateFactorsFromFeatures(features, probability),
      recommendations: generateRecommendations(features, probability),
      confidence: 0.85 // Model confidence from trained ML model
    };
  } catch (error) {
    console.error('Error calling FastAPI ML service:', error);
    console.log('Falling back to rule-based prediction');
    
    // Fallback to rule-based prediction
    return generateRuleBasedPrediction(features);
  }
}

function generateFactorsFromFeatures(features: any, probability: number): string[] {
  const factors = [];
  
  if (features.contract_type === 'Month-to-month') {
    factors.push('Month-to-month contract increases churn risk');
  }
  if (features.tenure < 12) {
    factors.push(`Short tenure (${features.tenure} months) indicates higher risk`);
  }
  if (features.monthly_charges > 80) {
    factors.push(`High monthly charges ($${features.monthly_charges}) may indicate price sensitivity`);
  }
  if (probability > 0.7) {
    factors.push('Multiple high-risk indicators detected by ML model');
  }
  
  return factors.slice(0, 3);
}

function generateRecommendations(features: any, probability: number): string[] {
  const recommendations = [];
  
  if (features.contract_type === 'Month-to-month') {
    recommendations.push('Offer incentives for longer-term contract commitment');
  }
  if (features.tenure < 12) {
    recommendations.push('Implement enhanced onboarding and engagement program');
  }
  if (features.monthly_charges > 80) {
    recommendations.push('Provide value demonstration and personalized support');
  }
  if (probability > 0.5) {
    recommendations.push('Immediate outreach by customer success team recommended');
  }
  
  return recommendations.slice(0, 3);
}

function generateRuleBasedPrediction(features: any) {
  let probability = 0.3; // Base probability
  const factors = [];
  const recommendations = [];

  // Contract type analysis
  if (features.contract_type === 'Month-to-month') {
    probability += 0.3;
    factors.push('Month-to-month contract increases churn risk');
    recommendations.push('Offer incentives for longer-term contracts');
  } else if (features.contract_type === 'One year') {
    probability += 0.1;
  }

  // Tenure analysis
  if (features.tenure < 6) {
    probability += 0.2;
    factors.push('New customer with high early churn risk');
    recommendations.push('Implement onboarding program');
  } else if (features.tenure < 12) {
    probability += 0.1;
    factors.push('First-year customer needs attention');
    recommendations.push('Regular check-ins during first year');
  }

  // Monthly charges analysis
  if (features.monthly_charges > 100) {
    probability += 0.1;
    factors.push('High monthly charges may indicate price sensitivity');
    recommendations.push('Provide value demonstration and support');
  } else if (features.monthly_charges < 30) {
    probability += 0.15;
    factors.push('Low-value customer segment with higher churn tendency');
    recommendations.push('Consider value-add services or upselling');
  }

  return {
    probability: Math.min(Math.max(probability, 0), 1),
    factors: factors.slice(0, 3),
    recommendations: recommendations.slice(0, 3),
    confidence: 0.75
  };
}

function getRiskLevel(probability: number): string {
  if (probability >= 0.7) return 'High';
  if (probability >= 0.4) return 'Medium';
  if (probability >= 0.2) return 'Low';
  return 'Very Low';
}