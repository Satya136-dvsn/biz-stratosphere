// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Target,
  Users,
  Activity,
  Brain,
  Zap,
  BarChart3,
  Loader2,
  Lightbulb
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { SHAPWaterfall, FeatureContribution } from '@/components/ml/SHAPWaterfall';

export function MLInsights() {
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState<{
    churn?: any;
    forecast?: any;
    anomalies?: any;
    explainability?: any;
  }>({});
  const [explainLoading, setExplainLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const runChurnPrediction = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('churn-prediction', {
        body: { user_id: user.id }
      });

      if (error) throw error;

      setInsights(prev => ({ ...prev, churn: data }));
      toast({
        title: "Churn Analysis Complete",
        description: `Risk Level: ${data.riskLevel} (${data.churnProbability}% probability)`
      });
    } catch (error) {
      console.error('Churn prediction error:', error);
      toast({
        title: "Analysis Failed",
        description: "Unable to complete churn prediction analysis",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const runSalesForecasting = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('sales-forecasting', {
        body: { user_id: user.id, forecast_periods: 6 }
      });

      if (error) throw error;

      setInsights(prev => ({ ...prev, forecast: data }));
      toast({
        title: "Sales Forecast Generated",
        description: `6-month forecast with ${data.forecast.confidence}% confidence`
      });
    } catch (error) {
      console.error('Sales forecasting error:', error);
      toast({
        title: "Forecast Failed",
        description: "Unable to generate sales forecast",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const runAnomalyDetection = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('anomaly-detection', {
        body: { user_id: user.id, sensitivity: 'medium' }
      });

      if (error) throw error;

      setInsights(prev => ({ ...prev, anomalies: data }));
      toast({
        title: "Anomaly Detection Complete",
        description: `Found ${data.summary.total_anomalies} anomalies across ${data.summary.metrics_analyzed} metrics`
      });
    } catch (error) {
      console.error('Anomaly detection error:', error);
      toast({
        title: "Detection Failed",
        description: "Unable to complete anomaly detection",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const runExplainability = async () => {
    if (!user) return;

    setExplainLoading(true);
    try {
      // Get the most recent prediction to explain
      const { data: prediction, error: predError } = await supabase
        .from('predictions_log')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (predError || !prediction) {
        toast({
          title: 'No Predictions Found',
          description: 'Make a prediction first to see the explanation.',
          variant: 'destructive',
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('model-explainability', {
        body: { predictionId: prediction.id }
      });

      if (error) throw error;

      setInsights(prev => ({ ...prev, explainability: data }));
      toast({
        title: 'Explanation Ready',
        description: `Top factor: ${data.top_factors?.[0]?.name || 'N/A'}`,
      });
    } catch (error) {
      console.error('Explainability error:', error);
      toast({
        title: 'Explanation Failed',
        description: 'Unable to generate model explanation',
        variant: 'destructive',
      });
    } finally {
      setExplainLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'high': return 'bg-destructive text-destructive-foreground';
      case 'medium': return 'bg-warning text-warning-foreground';
      case 'low': return 'bg-accent text-accent-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          Advanced ML Analytics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="churn">Churn</TabsTrigger>
            <TabsTrigger value="forecast">Forecast</TabsTrigger>
            <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
            <TabsTrigger value="explain" className="gap-1">
              <Lightbulb className="h-3 w-3" />
              Explain
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="h-20 flex flex-col gap-2"
                onClick={runChurnPrediction}
                disabled={isLoading}
              >
                <Users className="h-6 w-6 text-warning" />
                <span className="text-sm">Churn Risk</span>
              </Button>

              <Button
                variant="outline"
                className="h-20 flex flex-col gap-2"
                onClick={runSalesForecasting}
                disabled={isLoading}
              >
                <TrendingUp className="h-6 w-6 text-revenue" />
                <span className="text-sm">Sales Forecast</span>
              </Button>

              <Button
                variant="outline"
                className="h-20 flex flex-col gap-2"
                onClick={runAnomalyDetection}
                disabled={isLoading}
              >
                <AlertTriangle className="h-6 w-6 text-info" />
                <span className="text-sm">Anomaly Scan</span>
              </Button>
            </div>

            {Object.keys(insights).length > 0 && (
              <Alert>
                <Zap className="h-4 w-4" />
                <AlertDescription>
                  ML analysis complete. Check individual tabs for detailed results.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="churn" className="space-y-4">
            {insights.churn ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Customer Churn Risk Assessment</h4>
                  <Badge className={getRiskColor(insights.churn.riskLevel)}>
                    {insights.churn.riskLevel} Risk
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Churn Probability</span>
                    <span>{insights.churn.churnProbability}%</span>
                  </div>
                  <Progress value={insights.churn.churnProbability} className="h-3" />
                </div>

                <div className="space-y-2">
                  <h5 className="font-medium text-sm">Key Risk Factors:</h5>
                  <ul className="text-sm space-y-1">
                    {insights.churn.keyFactors?.slice(0, 3).map((factor: string, i: number) => (
                      <li key={i} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-warning" />
                        {factor}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <h5 className="font-medium text-sm">Recommendations:</h5>
                  <ul className="text-sm space-y-1">
                    {insights.churn.recommendations?.slice(0, 2).map((rec: string, i: number) => (
                      <li key={i} className="flex items-center gap-2">
                        <Target className="w-3 h-3 text-accent" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Run churn prediction to see risk assessment</p>
                <Button onClick={runChurnPrediction} disabled={isLoading} className="mt-3">
                  Analyze Churn Risk
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="forecast" className="space-y-4">
            {insights.forecast ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Sales Forecast (6 Months)</h4>
                  <Badge variant="outline">
                    {insights.forecast.forecast.confidence}% Confidence
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Growth Trend:</span>
                    <p className="font-medium">{insights.forecast.historical_performance.growth_trend}%</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Methods Used:</span>
                    <p className="font-medium">{insights.forecast.forecast.methods_used}</p>
                  </div>
                </div>

                {insights.forecast.forecast.forecasts?.slice(0, 3).map((period: any, i: number) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-muted/20 rounded">
                    <span className="text-sm">Period {period.period}</span>
                    <span className="font-medium">${period.value.toLocaleString()}</span>
                  </div>
                ))}

                {insights.forecast.forecast.ai_insights?.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="font-medium text-sm">AI Insights:</h5>
                    <ul className="text-sm space-y-1">
                      {insights.forecast.forecast.ai_insights.slice(0, 2).map((insight: string, i: number) => (
                        <li key={i} className="flex items-center gap-2">
                          <Brain className="w-3 h-3 text-primary" />
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Generate sales forecast to see predictions</p>
                <Button onClick={runSalesForecasting} disabled={isLoading} className="mt-3">
                  Generate Forecast
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="anomalies" className="space-y-4">
            {insights.anomalies ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center p-3 bg-destructive/10 rounded">
                    <div className="text-lg font-bold text-destructive">
                      {insights.anomalies.summary.high_priority}
                    </div>
                    <div className="text-muted-foreground">High Priority</div>
                  </div>
                  <div className="text-center p-3 bg-warning/10 rounded">
                    <div className="text-lg font-bold text-warning">
                      {insights.anomalies.summary.medium_priority}
                    </div>
                    <div className="text-muted-foreground">Medium Priority</div>
                  </div>
                  <div className="text-center p-3 bg-accent/10 rounded">
                    <div className="text-lg font-bold text-accent">
                      {insights.anomalies.summary.low_priority}
                    </div>
                    <div className="text-muted-foreground">Low Priority</div>
                  </div>
                </div>

                {insights.anomalies.anomalies?.slice(0, 3).map((anomaly: any, i: number) => (
                  <div key={i} className="p-3 border rounded-lg space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-sm">{anomaly.metric_name}</span>
                      <Badge className={getRiskColor(anomaly.severity)}>
                        {anomaly.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{anomaly.description}</p>
                    <div className="text-xs text-muted-foreground">
                      {new Date(anomaly.date).toLocaleDateString()}
                    </div>
                  </div>
                ))}

                {insights.anomalies.ai_insights?.recommendations?.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="font-medium text-sm">AI Recommendations:</h5>
                    <ul className="text-sm space-y-1">
                      {insights.anomalies.ai_insights.recommendations.slice(0, 2).map((rec: string, i: number) => (
                        <li key={i} className="flex items-center gap-2">
                          <Activity className="w-3 h-3 text-info" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Run anomaly detection to identify unusual patterns</p>
                <Button onClick={runAnomalyDetection} disabled={isLoading} className="mt-3">
                  Detect Anomalies
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="explain" className="space-y-4">
            {insights.explainability ? (
              <SHAPWaterfall
                features={insights.explainability.feature_importance as FeatureContribution[]}
                predictedValue={
                  insights.explainability.predicted_label ||
                  `${(insights.explainability.predicted_value * 100).toFixed(1)}%`
                }
                confidence={insights.explainability.confidence}
                interpretation={insights.explainability.interpretation}
                modelVersion={insights.explainability.model_version}
              />
            ) : (
              <div className="text-center py-8">
                <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-1">Explain your latest prediction</p>
                <p className="text-xs text-muted-foreground mb-3">See which features drove the model's decision</p>
                <Button onClick={runExplainability} disabled={explainLoading}>
                  {explainLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Brain className="h-4 w-4 mr-2" />
                  )}
                  Generate Explanation
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}