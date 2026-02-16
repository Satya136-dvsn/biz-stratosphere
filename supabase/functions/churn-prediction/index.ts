// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { user_id } = await req.json();

    console.log('Starting churn prediction for user:', user_id);

    // Fetch customer data for analysis
    const { data: dataPoints, error } = await supabase
      .from('data_points')
      .select('*')
      .eq('user_id', user_id)
      .order('date_recorded', { ascending: false })
      .limit(1000);

    if (error) {
      console.error('Error fetching data:', error);
      throw error;
    }

    if (!dataPoints || dataPoints.length === 0) {
      return new Response(JSON.stringify({
        error: 'No data available for churn prediction'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Calculate churn indicators
    const churnFeatures = calculateChurnFeatures(dataPoints);
    
    // Use OpenAI for intelligent churn prediction
    const aiPrediction = await getAIChurnPrediction(churnFeatures);
    
    // Apply rule-based scoring
    const ruleBasedScore = calculateRuleBasedChurn(churnFeatures);
    
    // Combine AI and rule-based predictions
    const finalPrediction = {
      churnProbability: Math.round((aiPrediction.probability + ruleBasedScore.probability) / 2),
      riskLevel: getRiskLevel((aiPrediction.probability + ruleBasedScore.probability) / 2),
      keyFactors: [...aiPrediction.factors, ...ruleBasedScore.factors],
      recommendations: aiPrediction.recommendations,
      confidence: Math.min(aiPrediction.confidence, ruleBasedScore.confidence),
      lastAnalysisDate: new Date().toISOString()
    };

    // Store prediction in database
    await supabase.from('ai_insights').insert({
      user_id,
      insight_type: 'churn_prediction',
      title: 'Customer Churn Risk Analysis',
      description: `Churn probability: ${finalPrediction.churnProbability}% (${finalPrediction.riskLevel} risk)`,
      data: finalPrediction,
      confidence_score: finalPrediction.confidence,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
    });

    console.log('Churn prediction completed successfully');

    return new Response(JSON.stringify(finalPrediction), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in churn prediction:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to generate churn prediction',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function calculateChurnFeatures(dataPoints: any[]) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  const recentData = dataPoints.filter(dp => new Date(dp.date_recorded) >= thirtyDaysAgo);
  const historicalData = dataPoints.filter(dp => new Date(dp.date_recorded) >= ninetyDaysAgo);

  // Calculate engagement metrics
  const recentRevenue = recentData
    .filter(dp => dp.metric_name.toLowerCase().includes('revenue'))
    .reduce((sum, dp) => sum + dp.metric_value, 0);

  const historicalRevenue = historicalData
    .filter(dp => dp.metric_name.toLowerCase().includes('revenue'))
    .reduce((sum, dp) => sum + dp.metric_value, 0);

  const recentActivity = recentData.length;
  const historicalActivity = historicalData.length;

  // Calculate trends
  const revenueDecline = historicalRevenue > 0 ? 
    ((historicalRevenue - recentRevenue) / historicalRevenue) * 100 : 0;
  
  const activityDecline = historicalActivity > 0 ?
    ((historicalActivity - recentActivity) / historicalActivity) * 100 : 0;

  // Calculate customer health score
  const avgTransactionValue = recentRevenue / Math.max(recentActivity, 1);
  const lastActivityDays = dataPoints.length > 0 ? 
    Math.floor((now.getTime() - new Date(dataPoints[0].date_recorded).getTime()) / (24 * 60 * 60 * 1000)) : 999;

  return {
    recentRevenue,
    historicalRevenue,
    recentActivity,
    historicalActivity,
    revenueDecline,
    activityDecline,
    avgTransactionValue,
    lastActivityDays,
    dataPointsCount: dataPoints.length
  };
}

async function getAIChurnPrediction(features: any) {
  const prompt = `
As an expert data scientist, analyze this customer data for churn prediction:

Customer Metrics:
- Recent revenue (30 days): $${features.recentRevenue}
- Historical revenue (90 days): $${features.historicalRevenue}
- Recent activity count: ${features.recentActivity}
- Historical activity count: ${features.historicalActivity}
- Revenue decline: ${features.revenueDecline.toFixed(2)}%
- Activity decline: ${features.activityDecline.toFixed(2)}%
- Average transaction value: $${features.avgTransactionValue.toFixed(2)}
- Days since last activity: ${features.lastActivityDays}
- Total data points: ${features.dataPointsCount}

Please provide:
1. Churn probability (0-100%)
2. Top 3 risk factors
3. 3 specific retention recommendations
4. Confidence level (0-100%)

Format as JSON: {
  "probability": number,
  "factors": ["factor1", "factor2", "factor3"],
  "recommendations": ["rec1", "rec2", "rec3"],
  "confidence": number
}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: 'You are an expert ML engineer specializing in customer churn prediction. Always respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 500,
        temperature: 0.3
      }),
    });

    const data = await response.json();
    if (data.error) {
      console.error('OpenAI API error:', data.error);
      throw new Error(data.error.message);
    }

    return JSON.parse(data.choices[0].message.content);
  } catch (error) {
    console.error('Error getting AI prediction:', error);
    return {
      probability: 50,
      factors: ['Limited data available', 'Unable to assess AI factors', 'Default analysis applied'],
      recommendations: ['Collect more customer data', 'Implement engagement tracking', 'Set up regular health checks'],
      confidence: 60
    };
  }
}

function calculateRuleBasedChurn(features: any) {
  let churnScore = 0;
  const factors = [];

  // Revenue decline factor (0-40 points)
  if (features.revenueDecline > 50) {
    churnScore += 40;
    factors.push('Significant revenue decline detected');
  } else if (features.revenueDecline > 25) {
    churnScore += 25;
    factors.push('Moderate revenue decline');
  } else if (features.revenueDecline > 10) {
    churnScore += 15;
    factors.push('Minor revenue decline');
  }

  // Activity decline factor (0-30 points)
  if (features.activityDecline > 60) {
    churnScore += 30;
    factors.push('Major decrease in activity');
  } else if (features.activityDecline > 30) {
    churnScore += 20;
    factors.push('Noticeable activity drop');
  }

  // Last activity factor (0-20 points)
  if (features.lastActivityDays > 30) {
    churnScore += 20;
    factors.push('Long period of inactivity');
  } else if (features.lastActivityDays > 14) {
    churnScore += 10;
    factors.push('Recent inactivity period');
  }

  // Low transaction value (0-10 points)
  if (features.avgTransactionValue < 100 && features.recentActivity > 0) {
    churnScore += 10;
    factors.push('Below average transaction value');
  }

  return {
    probability: Math.min(churnScore, 100),
    factors: factors.slice(0, 3),
    confidence: 85
  };
}

function getRiskLevel(probability: number): string {
  if (probability >= 70) return 'High';
  if (probability >= 40) return 'Medium';
  if (probability >= 20) return 'Low';
  return 'Very Low';
}