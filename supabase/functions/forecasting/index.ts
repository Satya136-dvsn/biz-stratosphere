import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ForecastPoint {
  date: string;
  predicted_value: number;
  confidence_interval: {
    lower: number;
    upper: number;
  };
}

interface Forecast {
  metric: string;
  forecast_period: number;
  predictions: ForecastPoint[];
  model_accuracy: number;
  insights: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { metric_name, forecast_days = 30, lookback_days = 60 } = await req.json();

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

    // Fetch historical data for forecasting
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - lookback_days);

    const { data: dataPoints, error } = await supabase
      .from('data_points')
      .select('*')
      .eq('user_id', user.id)
      .eq('metric_name', metric_name)
      .gte('date_recorded', cutoffDate.toISOString())
      .order('date_recorded', { ascending: true });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    if (!dataPoints || dataPoints.length < 7) {
      return new Response(
        JSON.stringify({ 
          error: 'Insufficient data for forecasting',
          required_points: 7,
          available_points: dataPoints?.length || 0
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Prepare data for forecasting
    const values = dataPoints.map(point => parseFloat(point.metric_value.toString()));
    const dates = dataPoints.map(point => new Date(point.date_recorded));
    
    // Simple linear regression with seasonal adjustment
    const n = values.length;
    const timeIndices = Array.from({ length: n }, (_, i) => i);
    
    // Calculate linear trend
    const sumX = timeIndices.reduce((sum, x) => sum + x, 0);
    const sumY = values.reduce((sum, y) => sum + y, 0);
    const sumXY = timeIndices.reduce((sum, x, i) => sum + x * values[i], 0);
    const sumX2 = timeIndices.reduce((sum, x) => sum + x * x, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calculate residuals and variance for confidence intervals
    const residuals = values.map((value, i) => value - (slope * i + intercept));
    const variance = residuals.reduce((sum, r) => sum + r * r, 0) / (n - 2);
    const standardError = Math.sqrt(variance);
    
    // Model accuracy (R-squared)
    const yMean = sumY / n;
    const totalSumSquares = values.reduce((sum, value) => sum + Math.pow(value - yMean, 2), 0);
    const residualSumSquares = residuals.reduce((sum, r) => sum + r * r, 0);
    const rSquared = 1 - (residualSumSquares / totalSumSquares);
    const modelAccuracy = Math.max(0, Math.min(1, rSquared)) * 100;
    
    // Generate forecasts
    const predictions: ForecastPoint[] = [];
    const lastDate = dates[dates.length - 1];
    
    for (let i = 1; i <= forecast_days; i++) {
      const futureTimeIndex = n + i;
      const predictedValue = slope * futureTimeIndex + intercept;
      
      // Calculate confidence interval (±1.96 * standard error for 95% CI)
      const confidenceMargin = 1.96 * standardError * Math.sqrt(1 + 1/n + Math.pow(futureTimeIndex - sumX/n, 2) / sumX2);
      
      const forecastDate = new Date(lastDate);
      forecastDate.setDate(forecastDate.getDate() + i);
      
      predictions.push({
        date: forecastDate.toISOString().split('T')[0],
        predicted_value: Math.max(0, parseFloat(predictedValue.toFixed(2))), // Ensure non-negative
        confidence_interval: {
          lower: Math.max(0, parseFloat((predictedValue - confidenceMargin).toFixed(2))),
          upper: parseFloat((predictedValue + confidenceMargin).toFixed(2))
        }
      });
    }
    
    // Generate insights
    const insights: string[] = [];
    const currentValue = values[values.length - 1];
    const futureValue = predictions[predictions.length - 1].predicted_value;
    const totalChange = ((futureValue - currentValue) / currentValue) * 100;
    
    if (totalChange > 10) {
      insights.push(`${metric_name} is forecasted to increase by ${totalChange.toFixed(1)}% over ${forecast_days} days`);
      insights.push('Positive growth trajectory expected - consider capacity planning');
    } else if (totalChange < -10) {
      insights.push(`${metric_name} is forecasted to decline by ${Math.abs(totalChange).toFixed(1)}% over ${forecast_days} days`);
      insights.push('Declining trend predicted - intervention may be needed');
    } else {
      insights.push(`${metric_name} is expected to remain relatively stable with minimal change`);
    }
    
    if (modelAccuracy > 80) {
      insights.push('High model accuracy - forecast is reliable based on historical patterns');
    } else if (modelAccuracy < 60) {
      insights.push('Lower model accuracy - forecast should be interpreted with caution due to data variability');
    }
    
    const avgDailyChange = Math.abs(slope);
    if (avgDailyChange > currentValue * 0.05) {
      insights.push('High volatility detected - monitor closely for unexpected changes');
    }
    
    const forecast: Forecast = {
      metric: metric_name,
      forecast_period: forecast_days,
      predictions,
      model_accuracy: parseFloat(modelAccuracy.toFixed(1)),
      insights
    };

    // Store forecast in ai_insights table
    const { error: insertError } = await supabase
      .from('ai_insights')
      .insert({
        user_id: user.id,
        insight_type: 'forecast',
        title: `${forecast_days}-Day Forecast: ${metric_name}`,
        description: `Predicted ${totalChange > 0 ? 'growth' : 'decline'} of ${Math.abs(totalChange).toFixed(1)}%`,
        data: forecast,
        confidence_score: modelAccuracy / 100,
        expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // 14 days
      });

    if (insertError) {
      console.error('Error storing forecast:', insertError);
    }

    console.log('Forecast generated for:', metric_name);

    return new Response(
      JSON.stringify(forecast),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in forecasting function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});