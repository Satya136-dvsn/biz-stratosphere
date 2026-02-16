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

interface TrendAnalysis {
  metric: string;
  trend: 'increasing' | 'decreasing' | 'stable';
  change_percentage: number;
  confidence: number;
  insights: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { metric_name, time_period = 30 } = await req.json();

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

    // Fetch data points for trend analysis
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - time_period);

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

    if (!dataPoints || dataPoints.length < 2) {
      return new Response(
        JSON.stringify({ 
          error: 'Insufficient data for trend analysis',
          required_points: 2,
          available_points: dataPoints?.length || 0
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Perform trend analysis
    const values = dataPoints.map(point => parseFloat(point.metric_value.toString()));
    const dates = dataPoints.map(point => new Date(point.date_recorded));
    
    // Linear regression for trend detection
    const n = values.length;
    const sumX = dates.reduce((sum, date, index) => sum + index, 0);
    const sumY = values.reduce((sum, value) => sum + value, 0);
    const sumXY = values.reduce((sum, value, index) => sum + (index * value), 0);
    const sumX2 = dates.reduce((sum, _, index) => sum + (index * index), 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calculate R-squared for confidence
    const yMean = sumY / n;
    const totalSumSquares = values.reduce((sum, value) => sum + Math.pow(value - yMean, 2), 0);
    const residualSumSquares = values.reduce((sum, value, index) => {
      const predicted = slope * index + intercept;
      return sum + Math.pow(value - predicted, 2);
    }, 0);
    
    const rSquared = 1 - (residualSumSquares / totalSumSquares);
    const confidence = Math.max(0, Math.min(1, rSquared)) * 100;
    
    // Determine trend direction
    const firstValue = values[0];
    const lastValue = values[values.length - 1];
    const changePercentage = ((lastValue - firstValue) / firstValue) * 100;
    
    let trend: 'increasing' | 'decreasing' | 'stable';
    if (Math.abs(changePercentage) < 5) {
      trend = 'stable';
    } else if (changePercentage > 0) {
      trend = 'increasing';
    } else {
      trend = 'decreasing';
    }

    // Generate insights
    const insights: string[] = [];
    
    if (trend === 'increasing') {
      insights.push(`${metric_name} has increased by ${changePercentage.toFixed(1)}% over ${time_period} days`);
      if (changePercentage > 20) {
        insights.push('Strong growth trend detected - consider scaling strategies');
      }
    } else if (trend === 'decreasing') {
      insights.push(`${metric_name} has decreased by ${Math.abs(changePercentage).toFixed(1)}% over ${time_period} days`);
      if (Math.abs(changePercentage) > 15) {
        insights.push('Concerning downward trend - investigate root causes');
      }
    } else {
      insights.push(`${metric_name} has remained stable with minimal fluctuation`);
    }

    if (confidence > 80) {
      insights.push('High confidence in trend analysis based on data consistency');
    } else if (confidence < 50) {
      insights.push('Low confidence - data shows high variability');
    }

    const analysis: TrendAnalysis = {
      metric: metric_name,
      trend,
      change_percentage: parseFloat(changePercentage.toFixed(2)),
      confidence: parseFloat(confidence.toFixed(1)),
      insights
    };

    // Store analysis in ai_insights table
    const { error: insertError } = await supabase
      .from('ai_insights')
      .insert({
        user_id: user.id,
        insight_type: 'trend_analysis',
        title: `Trend Analysis: ${metric_name}`,
        description: `${trend} trend with ${changePercentage.toFixed(1)}% change`,
        data: analysis,
        confidence_score: confidence / 100,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      });

    if (insertError) {
      console.error('Error storing insight:', insertError);
    }

    console.log('Trend analysis completed for:', metric_name);

    return new Response(
      JSON.stringify(analysis),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in trend-analysis function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});