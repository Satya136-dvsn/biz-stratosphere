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
    const { user_id, sensitivity = 'medium' } = await req.json();

    console.log('Starting anomaly detection for user:', user_id);

    // Fetch recent data for analysis
    const { data: dataPoints, error } = await supabase
      .from('data_points')
      .select('*')
      .eq('user_id', user_id)
      .order('date_recorded', { ascending: true });

    if (error) {
      console.error('Error fetching data:', error);
      throw error;
    }

    if (!dataPoints || dataPoints.length < 10) {
      return new Response(JSON.stringify({
        error: 'Insufficient data for anomaly detection. Need at least 10 data points.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Group data by metric type for analysis
    const metricGroups = groupDataByMetric(dataPoints);
    const allAnomalies = [];

    // Detect anomalies in each metric
    for (const [metricName, metricData] of metricGroups) {
      if (metricData.length < 5) continue; // Skip metrics with too little data
      
      const anomalies = detectMetricAnomalies(metricName, metricData, sensitivity);
      allAnomalies.push(...anomalies);
    }

    // Get AI analysis of detected anomalies
    const aiAnalysis = await getAIAnomalyAnalysis(allAnomalies, metricGroups);

    // Calculate business impact scores
    const impactScores = calculateBusinessImpact(allAnomalies, metricGroups);

    const anomalyReport = {
      summary: {
        total_anomalies: allAnomalies.length,
        high_priority: allAnomalies.filter(a => a.severity === 'high').length,
        medium_priority: allAnomalies.filter(a => a.severity === 'medium').length,
        low_priority: allAnomalies.filter(a => a.severity === 'low').length,
        metrics_analyzed: metricGroups.size
      },
      anomalies: allAnomalies.map(anomaly => ({
        ...anomaly,
        business_impact: impactScores.find(s => s.id === anomaly.id)?.impact || 'unknown'
      })),
      ai_insights: aiAnalysis,
      detection_settings: {
        sensitivity,
        methods_used: ['statistical_outliers', 'trend_deviation', 'seasonal_anomalies'],
        confidence_threshold: getSensitivityThreshold(sensitivity)
      },
      recommendations: generateRecommendations(allAnomalies, aiAnalysis),
      generated_at: new Date().toISOString()
    };

    // Store anomaly report in database
    await supabase.from('ai_insights').insert({
      user_id,
      insight_type: 'anomaly_detection',
      title: 'Business Metrics Anomaly Detection',
      description: `Found ${allAnomalies.length} anomalies across ${metricGroups.size} metrics`,
      data: anomalyReport,
      confidence_score: calculateOverallConfidence(allAnomalies),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
    });

    console.log('Anomaly detection completed successfully');

    return new Response(JSON.stringify(anomalyReport), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in anomaly detection:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to perform anomaly detection',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function groupDataByMetric(dataPoints: any[]) {
  const groups = new Map();
  
  dataPoints.forEach(dp => {
    if (!groups.has(dp.metric_name)) {
      groups.set(dp.metric_name, []);
    }
    groups.get(dp.metric_name).push({
      date: new Date(dp.date_recorded),
      value: dp.metric_value,
      metadata: dp.metadata
    });
  });
  
  // Sort each group by date
  for (const [key, data] of groups) {
    data.sort((a, b) => a.date.getTime() - b.date.getTime());
  }
  
  return groups;
}

function detectMetricAnomalies(metricName: string, data: any[], sensitivity: string) {
  const anomalies = [];
  const values = data.map(d => d.value);
  const threshold = getSensitivityThreshold(sensitivity);
  
  // Calculate statistical measures
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  
  // Z-score based detection
  data.forEach((point, index) => {
    const zScore = Math.abs((point.value - mean) / stdDev);
    
    if (zScore > threshold.z_score) {
      anomalies.push({
        id: `${metricName}_${index}_zscore`,
        metric_name: metricName,
        date: point.date.toISOString(),
        value: point.value,
        expected_range: [mean - 2 * stdDev, mean + 2 * stdDev],
        deviation: zScore,
        type: 'statistical_outlier',
        severity: getSeverityFromDeviation(zScore, threshold),
        description: `Value ${point.value} is ${zScore.toFixed(2)} standard deviations from mean (${mean.toFixed(2)})`
      });
    }
  });
  
  // Trend deviation detection
  if (data.length >= 7) {
    const trendAnomalies = detectTrendAnomalies(metricName, data, threshold);
    anomalies.push(...trendAnomalies);
  }
  
  // Seasonal anomalies (if enough data)
  if (data.length >= 30) {
    const seasonalAnomalies = detectSeasonalAnomalies(metricName, data, threshold);
    anomalies.push(...seasonalAnomalies);
  }
  
  return anomalies;
}

function detectTrendAnomalies(metricName: string, data: any[], threshold: any) {
  const anomalies = [];
  const windowSize = 7; // 7-day window
  
  for (let i = windowSize; i < data.length; i++) {
    const currentWindow = data.slice(i - windowSize, i);
    const currentValue = data[i].value;
    
    // Calculate expected value based on trend
    const trend = calculateLinearTrend(currentWindow);
    const expectedValue = trend.intercept + trend.slope * windowSize;
    
    const percentDeviation = expectedValue !== 0 ? 
      Math.abs((currentValue - expectedValue) / expectedValue) * 100 : 0;
    
    if (percentDeviation > threshold.trend_deviation) {
      anomalies.push({
        id: `${metricName}_${i}_trend`,
        metric_name: metricName,
        date: data[i].date.toISOString(),
        value: currentValue,
        expected_value: expectedValue,
        deviation: percentDeviation,
        type: 'trend_deviation',
        severity: percentDeviation > 50 ? 'high' : percentDeviation > 25 ? 'medium' : 'low',
        description: `Value deviates ${percentDeviation.toFixed(1)}% from expected trend`
      });
    }
  }
  
  return anomalies;
}

function detectSeasonalAnomalies(metricName: string, data: any[], threshold: any) {
  const anomalies = [];
  const seasonalPeriod = 7; // Weekly seasonality
  
  // Calculate seasonal baseline
  const seasonalPattern = new Array(seasonalPeriod).fill(0);
  const seasonalCounts = new Array(seasonalPeriod).fill(0);
  
  data.forEach((point, i) => {
    const seasonalIndex = i % seasonalPeriod;
    seasonalPattern[seasonalIndex] += point.value;
    seasonalCounts[seasonalIndex] += 1;
  });
  
  // Average seasonal values
  for (let i = 0; i < seasonalPeriod; i++) {
    if (seasonalCounts[i] > 0) {
      seasonalPattern[i] /= seasonalCounts[i];
    }
  }
  
  // Check for seasonal anomalies
  data.forEach((point, index) => {
    if (index < seasonalPeriod * 2) return; // Need enough data
    
    const seasonalIndex = index % seasonalPeriod;
    const expectedValue = seasonalPattern[seasonalIndex];
    
    const percentDeviation = expectedValue !== 0 ? 
      Math.abs((point.value - expectedValue) / expectedValue) * 100 : 0;
    
    if (percentDeviation > threshold.seasonal_deviation) {
      anomalies.push({
        id: `${metricName}_${index}_seasonal`,
        metric_name: metricName,
        date: point.date.toISOString(),
        value: point.value,
        expected_seasonal_value: expectedValue,
        deviation: percentDeviation,
        type: 'seasonal_anomaly',
        severity: percentDeviation > 60 ? 'high' : percentDeviation > 30 ? 'medium' : 'low',
        description: `Value deviates ${percentDeviation.toFixed(1)}% from seasonal pattern`
      });
    }
  });
  
  return anomalies;
}

function calculateLinearTrend(data: any[]) {
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

async function getAIAnomalyAnalysis(anomalies: any[], metricGroups: Map<string, any[]>) {
  if (anomalies.length === 0) {
    return {
      insights: ['No significant anomalies detected'],
      root_causes: [],
      business_implications: [],
      confidence: 90
    };
  }

  const highPriorityAnomalies = anomalies.filter(a => a.severity === 'high').slice(0, 5);
  const metricsOverview = Array.from(metricGroups.keys()).map(metric => {
    const data = metricGroups.get(metric);
    const recent = data.slice(-7);
    const avg = recent.reduce((sum, d) => sum + d.value, 0) / recent.length;
    return `${metric}: avg=${avg.toFixed(2)}`;
  }).join(', ');

  const prompt = `
Analyze these business metric anomalies:

High Priority Anomalies:
${highPriorityAnomalies.map(a => `- ${a.metric_name}: ${a.description} on ${a.date.split('T')[0]}`).join('\n')}

Recent Metrics Overview:
${metricsOverview}

Total Anomalies: ${anomalies.length} (High: ${anomalies.filter(a => a.severity === 'high').length}, Medium: ${anomalies.filter(a => a.severity === 'medium').length}, Low: ${anomalies.filter(a => a.severity === 'low').length})

Provide analysis as JSON:
{
  "insights": ["insight1", "insight2", "insight3"],
  "root_causes": ["cause1", "cause2"],
  "business_implications": ["implication1", "implication2"],
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
          { role: 'system', content: 'You are an expert business analyst specializing in anomaly detection and root cause analysis. Always respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 600,
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
    console.error('Error getting AI analysis:', error);
    return {
      insights: ['AI analysis unavailable', 'Statistical anomalies detected', 'Manual review recommended'],
      root_causes: ['Unknown - requires investigation'],
      business_implications: ['Monitor metrics closely', 'Potential business disruption'],
      recommendations: ['Review operational processes', 'Investigate data quality'],
      confidence: 60
    };
  }
}

function calculateBusinessImpact(anomalies: any[], metricGroups: Map<string, any[]>) {
  return anomalies.map(anomaly => {
    let impact = 'low';
    
    // Revenue-related metrics have higher impact
    if (anomaly.metric_name.toLowerCase().includes('revenue') || 
        anomaly.metric_name.toLowerCase().includes('sales')) {
      impact = anomaly.severity === 'high' ? 'critical' : 'high';
    }
    
    // Customer metrics have medium-high impact
    else if (anomaly.metric_name.toLowerCase().includes('customer') ||
             anomaly.metric_name.toLowerCase().includes('churn')) {
      impact = anomaly.severity === 'high' ? 'high' : 'medium';
    }
    
    // Operational metrics have variable impact based on deviation
    else if (anomaly.deviation > 100) {
      impact = 'high';
    } else if (anomaly.deviation > 50) {
      impact = 'medium';
    }
    
    return {
      id: anomaly.id,
      impact
    };
  });
}

function generateRecommendations(anomalies: any[], aiAnalysis: any) {
  const recommendations = [...(aiAnalysis.recommendations || [])];
  
  // Add specific recommendations based on anomaly types
  const hasRevenueAnomalies = anomalies.some(a => a.metric_name.toLowerCase().includes('revenue'));
  const hasCustomerAnomalies = anomalies.some(a => a.metric_name.toLowerCase().includes('customer'));
  const hasTrendIssues = anomalies.some(a => a.type === 'trend_deviation');
  
  if (hasRevenueAnomalies) {
    recommendations.push('Review revenue recognition processes and data collection');
  }
  
  if (hasCustomerAnomalies) {
    recommendations.push('Investigate customer behavior changes and retention strategies');
  }
  
  if (hasTrendIssues) {
    recommendations.push('Analyze underlying business drivers affecting trends');
  }
  
  // Add monitoring recommendations
  recommendations.push('Set up automated alerts for future anomalies');
  recommendations.push('Schedule weekly anomaly detection reviews');
  
  return [...new Set(recommendations)]; // Remove duplicates
}

function getSensitivityThreshold(sensitivity: string) {
  switch (sensitivity) {
    case 'high':
      return { z_score: 1.5, trend_deviation: 15, seasonal_deviation: 20 };
    case 'low':
      return { z_score: 3.0, trend_deviation: 40, seasonal_deviation: 50 };
    default: // medium
      return { z_score: 2.0, trend_deviation: 25, seasonal_deviation: 35 };
  }
}

function getSeverityFromDeviation(deviation: number, threshold: any) {
  if (deviation > threshold.z_score * 2) return 'high';
  if (deviation > threshold.z_score * 1.5) return 'medium';
  return 'low';
}

function calculateOverallConfidence(anomalies: any[]) {
  if (anomalies.length === 0) return 95;
  
  const avgDeviation = anomalies.reduce((sum, a) => sum + (a.deviation || 0), 0) / anomalies.length;
  const highSeverityCount = anomalies.filter(a => a.severity === 'high').length;
  
  // Higher confidence for clear, strong anomalies
  let confidence = 70;
  if (avgDeviation > 50) confidence += 15;
  if (highSeverityCount > 0) confidence += 10;
  if (anomalies.length > 5) confidence += 5;
  
  return Math.min(95, confidence);
}