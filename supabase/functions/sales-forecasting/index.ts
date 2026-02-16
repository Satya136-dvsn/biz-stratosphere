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
    const { user_id, forecast_periods = 6 } = await req.json();

    console.log('Starting sales forecasting for user:', user_id);

    // Fetch historical sales data
    const { data: dataPoints, error } = await supabase
      .from('data_points')
      .select('*')
      .eq('user_id', user_id)
      .order('date_recorded', { ascending: true });

    if (error) {
      console.error('Error fetching data:', error);
      throw error;
    }

    if (!dataPoints || dataPoints.length < 3) {
      return new Response(JSON.stringify({
        error: 'Insufficient data for sales forecasting. Need at least 3 data points.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Prepare sales data for analysis
    const salesData = prepareSalesData(dataPoints);
    
    // Calculate statistical forecasts
    const trendForecast = calculateTrendForecast(salesData, forecast_periods);
    const seasonalForecast = calculateSeasonalForecast(salesData, forecast_periods);
    
    // Get AI-enhanced forecast
    const aiForecast = await getAIForecast(salesData, forecast_periods);
    
    // Combine forecasting methods
    const combinedForecast = combineForecasts(trendForecast, seasonalForecast, aiForecast);
    
    // Calculate forecast accuracy metrics
    const accuracy = calculateAccuracyMetrics(salesData);
    
    const forecastResult = {
      forecast: combinedForecast,
      accuracy,
      methodology: {
        trend_analysis: true,
        seasonal_adjustment: seasonalForecast.seasonal_detected,
        ai_enhancement: aiForecast.success,
        confidence_level: combinedForecast.confidence
      },
      historical_performance: {
        total_periods: salesData.length,
        growth_trend: calculateGrowthTrend(salesData),
        seasonality_strength: calculateSeasonalityStrength(salesData)
      },
      generated_at: new Date().toISOString()
    };

    // Store forecast in database
    await supabase.from('ai_insights').insert({
      user_id,
      insight_type: 'sales_forecast',
      title: `${forecast_periods}-Period Sales Forecast`,
      description: `Forecasted sales with ${combinedForecast.confidence}% confidence`,
      data: forecastResult,
      confidence_score: combinedForecast.confidence,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
    });

    console.log('Sales forecasting completed successfully');

    return new Response(JSON.stringify(forecastResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in sales forecasting:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to generate sales forecast',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function prepareSalesData(dataPoints: any[]) {
  // Group by month and sum revenue
  const monthlyData = new Map();
  
  dataPoints
    .filter(dp => dp.metric_name.toLowerCase().includes('revenue') || 
                  dp.metric_name.toLowerCase().includes('sales'))
    .forEach(dp => {
      const date = new Date(dp.date_recorded);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { date: monthKey, value: 0, count: 0 });
      }
      
      const existing = monthlyData.get(monthKey);
      existing.value += dp.metric_value;
      existing.count += 1;
    });

  return Array.from(monthlyData.values()).sort((a, b) => a.date.localeCompare(b.date));
}

function calculateTrendForecast(salesData: any[], periods: number) {
  if (salesData.length < 2) {
    return { values: [], confidence: 50, method: 'insufficient_data' };
  }

  // Linear regression for trend
  const n = salesData.length;
  const x = salesData.map((_, i) => i);
  const y = salesData.map(d => d.value);
  
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
  const sumX2 = x.reduce((acc, xi) => acc + xi * xi, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  // Generate forecasts
  const forecasts = [];
  for (let i = 1; i <= periods; i++) {
    const value = Math.max(0, intercept + slope * (n + i - 1));
    forecasts.push({
      period: i,
      value: Math.round(value),
      method: 'linear_trend'
    });
  }
  
  // Calculate R-squared for confidence
  const yMean = sumY / n;
  const ssRes = y.reduce((acc, yi, i) => acc + Math.pow(yi - (intercept + slope * i), 2), 0);
  const ssTot = y.reduce((acc, yi) => acc + Math.pow(yi - yMean, 2), 0);
  const rSquared = 1 - (ssRes / ssTot);
  
  return {
    values: forecasts,
    confidence: Math.max(30, Math.min(95, Math.round(rSquared * 100))),
    method: 'linear_regression',
    slope,
    r_squared: rSquared
  };
}

function calculateSeasonalForecast(salesData: any[], periods: number) {
  if (salesData.length < 12) {
    return { values: [], seasonal_detected: false, confidence: 50 };
  }

  // Simple seasonal decomposition
  const seasonalPattern = new Array(12).fill(0);
  const seasonalCounts = new Array(12).fill(0);
  
  salesData.forEach((data, i) => {
    const month = i % 12;
    seasonalPattern[month] += data.value;
    seasonalCounts[month] += 1;
  });
  
  // Calculate average seasonal factors
  for (let i = 0; i < 12; i++) {
    if (seasonalCounts[i] > 0) {
      seasonalPattern[i] /= seasonalCounts[i];
    }
  }
  
  const overallMean = seasonalPattern.reduce((a, b) => a + b, 0) / 12;
  const seasonalFactors = seasonalPattern.map(p => p / overallMean);
  
  // Check if seasonal pattern exists
  const seasonalVariance = seasonalFactors.reduce((acc, f) => acc + Math.pow(f - 1, 2), 0) / 12;
  const seasonalDetected = seasonalVariance > 0.1;
  
  if (!seasonalDetected) {
    return { values: [], seasonal_detected: false, confidence: 50 };
  }
  
  // Apply seasonal adjustment to trend
  const baseValue = salesData[salesData.length - 1].value;
  const forecasts = [];
  
  for (let i = 1; i <= periods; i++) {
    const monthIndex = (salesData.length + i - 1) % 12;
    const seasonalFactor = seasonalFactors[monthIndex];
    const value = Math.max(0, Math.round(baseValue * seasonalFactor));
    
    forecasts.push({
      period: i,
      value,
      seasonal_factor: seasonalFactor,
      method: 'seasonal_adjustment'
    });
  }
  
  return {
    values: forecasts,
    seasonal_detected: true,
    confidence: Math.round(70 + (seasonalVariance * 100)),
    seasonal_variance: seasonalVariance
  };
}

async function getAIForecast(salesData: any[], periods: number) {
  const recentData = salesData.slice(-12); // Last 12 periods
  
  const prompt = `
Analyze this sales data and provide forecasts for the next ${periods} periods:

Historical Sales Data (most recent 12 periods):
${recentData.map((d, i) => `Period ${i + 1}: $${d.value}`).join('\n')}

Consider:
1. Growth trends and momentum
2. Seasonal patterns
3. Market conditions
4. Business cycles

Provide forecasts as JSON:
{
  "forecasts": [
    {"period": 1, "value": number, "confidence": number},
    ...
  ],
  "insights": ["insight1", "insight2", "insight3"],
  "overall_confidence": number
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
          { role: 'system', content: 'You are an expert financial analyst and forecasting specialist. Always respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 800,
        temperature: 0.3
      }),
    });

    const data = await response.json();
    if (data.error) {
      console.error('OpenAI API error:', data.error);
      throw new Error(data.error.message);
    }

    const result = JSON.parse(data.choices[0].message.content);
    return { ...result, success: true };
    
  } catch (error) {
    console.error('Error getting AI forecast:', error);
    return {
      forecasts: [],
      insights: ['AI forecasting unavailable', 'Using statistical methods only'],
      overall_confidence: 60,
      success: false
    };
  }
}

function combineForecasts(trendForecast: any, seasonalForecast: any, aiForecast: any) {
  const periods = Math.max(
    trendForecast.values?.length || 0,
    seasonalForecast.values?.length || 0,
    aiForecast.forecasts?.length || 0
  );

  if (periods === 0) {
    return { forecasts: [], confidence: 40, method: 'insufficient_data' };
  }

  const combinedForecasts = [];
  let totalConfidence = 0;
  let methodCount = 0;

  for (let i = 0; i < periods; i++) {
    const trendValue = trendForecast.values?.[i]?.value || 0;
    const seasonalValue = seasonalForecast.values?.[i]?.value || 0;
    const aiValue = aiForecast.forecasts?.[i]?.value || 0;

    // Weighted average based on method reliability
    let weightedSum = 0;
    let totalWeight = 0;

    if (trendValue > 0) {
      const weight = (trendForecast.confidence || 50) / 100;
      weightedSum += trendValue * weight;
      totalWeight += weight;
    }

    if (seasonalValue > 0 && seasonalForecast.seasonal_detected) {
      const weight = (seasonalForecast.confidence || 50) / 100;
      weightedSum += seasonalValue * weight;
      totalWeight += weight;
    }

    if (aiValue > 0 && aiForecast.success) {
      const weight = (aiForecast.overall_confidence || 60) / 100;
      weightedSum += aiValue * weight;
      totalWeight += weight;
    }

    const finalValue = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
    
    combinedForecasts.push({
      period: i + 1,
      value: finalValue,
      trend_component: trendValue,
      seasonal_component: seasonalValue,
      ai_component: aiValue
    });
  }

  // Calculate combined confidence
  if (trendForecast.confidence) {
    totalConfidence += trendForecast.confidence;
    methodCount++;
  }
  if (seasonalForecast.confidence && seasonalForecast.seasonal_detected) {
    totalConfidence += seasonalForecast.confidence;
    methodCount++;
  }
  if (aiForecast.overall_confidence && aiForecast.success) {
    totalConfidence += aiForecast.overall_confidence;
    methodCount++;
  }

  const averageConfidence = methodCount > 0 ? Math.round(totalConfidence / methodCount) : 50;

  return {
    forecasts: combinedForecasts,
    confidence: averageConfidence,
    methods_used: methodCount,
    ai_insights: aiForecast.insights || []
  };
}

function calculateAccuracyMetrics(salesData: any[]) {
  if (salesData.length < 4) {
    return { mae: 0, mape: 0, accuracy_note: 'Insufficient data for accuracy calculation' };
  }

  // Calculate simple accuracy using last 3 periods
  const testPeriods = Math.min(3, Math.floor(salesData.length / 3));
  const trainData = salesData.slice(0, -testPeriods);
  const testData = salesData.slice(-testPeriods);

  // Simple trend-based prediction for accuracy test
  const trend = calculateSimpleTrend(trainData);
  let totalError = 0;
  let totalPercentError = 0;

  testData.forEach((actual, i) => {
    const predicted = Math.max(0, trend.intercept + trend.slope * (trainData.length + i));
    const error = Math.abs(actual.value - predicted);
    const percentError = actual.value > 0 ? (error / actual.value) * 100 : 0;
    
    totalError += error;
    totalPercentError += percentError;
  });

  return {
    mae: Math.round(totalError / testPeriods), // Mean Absolute Error
    mape: Math.round(totalPercentError / testPeriods), // Mean Absolute Percentage Error
    test_periods: testPeriods,
    accuracy_note: 'Based on backtesting with trend analysis'
  };
}

function calculateSimpleTrend(data: any[]) {
  const n = data.length;
  const x = data.map((_, i) => i);
  const y = data.map(d => d.value);
  
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
  const sumX2 = x.reduce((acc, xi) => acc + xi * xi, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  return { slope, intercept };
}

function calculateGrowthTrend(salesData: any[]) {
  if (salesData.length < 2) return 0;
  
  const firstValue = salesData[0].value;
  const lastValue = salesData[salesData.length - 1].value;
  
  if (firstValue === 0) return 0;
  
  const periods = salesData.length - 1;
  const growthRate = Math.pow(lastValue / firstValue, 1 / periods) - 1;
  
  return Math.round(growthRate * 100 * 100) / 100; // Percentage with 2 decimals
}

function calculateSeasonalityStrength(salesData: any[]) {
  if (salesData.length < 12) return 0;
  
  const values = salesData.map(d => d.value);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / values.length;
  
  // Simple coefficient of variation as seasonality measure
  const cv = mean > 0 ? Math.sqrt(variance) / mean : 0;
  
  return Math.min(100, Math.round(cv * 100));
}