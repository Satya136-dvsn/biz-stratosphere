import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useMLPredictions } from '@/hooks/useMLPredictions';
import { Loader2, Brain, TrendingUp, UserX, Info, BarChart3 } from 'lucide-react';
import { FeatureBadge } from '@/components/ui/FeatureBadge';

const MODEL_FEATURES = {
    churn_model: {
        name: 'Customer Churn Predictor',
        description: 'Predicts whether a customer is likely to churn',
        icon: UserX,
        features: [
            { name: 'usage_frequency', label: 'Usage Frequency', type: 'number', min: 1, max: 100, placeholder: '45' },
            { name: 'support_tickets', label: 'Support Tickets', type: 'number', min: 0, max: 20, placeholder: '5' },
            { name: 'tenure_months', label: 'Tenure (months)', type: 'number', min: 1, max: 60, placeholder: '12' },
            { name: 'monthly_spend', label: 'Monthly Spend ($)', type: 'number', min: 10, max: 500, placeholder: '150' },
            { name: 'feature_usage_pct', label: 'Feature Usage %', type: 'number', min: 0, max: 100, placeholder: '60' },
        ],
    },
    revenue_model: {
        name: 'Revenue Forecaster',
        description: 'Forecasts monthly revenue based on business metrics',
        icon: TrendingUp,
        features: [
            { name: 'num_customers', label: 'Number of Customers', type: 'number', min: 10, max: 1000, placeholder: '250' },
            { name: 'avg_deal_size', label: 'Avg Deal Size ($)', type: 'number', min: 100, max: 10000, placeholder: '2500' },
            { name: 'marketing_spend', label: 'Marketing Spend ($)', type: 'number', min: 1000, max: 50000, placeholder: '15000' },
            { name: 'sales_team_size', label: 'Sales Team Size', type: 'number', min: 1, max: 50, placeholder: '10' },
            { name: 'market_growth_pct', label: 'Market Growth %', type: 'number', min: -10, max: 30, placeholder: '5' },
        ],
    },
};

export function MLPredictions() {
    const { models, modelsLoading, predict, explain, isPredicting, isExplaining } = useMLPredictions();
    const [selectedModel, setSelectedModel] = useState<string>('churn_model');
    const [features, setFeatures] = useState<Record<string, string>>({});
    const [prediction, setPrediction] = useState<any>(null);
    const [explanation, setExplanation] = useState<any>(null);

    const modelConfig = MODEL_FEATURES[selectedModel as keyof typeof MODEL_FEATURES];
    const ModelIcon = modelConfig?.icon || Brain;

    const handleFeatureChange = (name: string, value: string) => {
        setFeatures(prev => ({ ...prev, [name]: value }));
    };

    const handlePredict = async () => {
        // Convert features to numbers
        const numericFeatures = Object.entries(features).reduce((acc, [key, value]) => {
            acc[key] = parseFloat(value) || 0;
            return acc;
        }, {} as Record<string, number>);

        const result = await predict(selectedModel, numericFeatures);
        setPrediction(result);
        setExplanation(null);  // Clear previous explanation
    };

    const handleExplain = async () => {
        if (!prediction) {
            await handlePredict();
        }

        // Convert features to numbers
        const numericFeatures = Object.entries(features).reduce((acc, [key, value]) => {
            acc[key] = parseFloat(value) || 0;
            return acc;
        }, {} as Record<string, number>);

        const result = await explain(selectedModel, numericFeatures, true);
        setExplanation(result);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Brain className="h-8 w-8 text-primary" />
                        ML Predictions & Explainability
                    </h2>
                    <FeatureBadge variant="prototype" size="md" />
                </div>
                <p className="text-muted-foreground mb-3">
                    Make predictions with trained ML models and understand results with SHAP explanations (evolving feature)
                </p>
                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                        <strong>Prototype Feature:</strong> Predictions are experimental and for demonstration purposes only.
                        Results should not be used for business-critical decisions.
                    </AlertDescription>
                </Alert>
            </div>

            {/* Model Status */}
            {modelsLoading ? (
                <Alert>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <AlertDescription>Loading ML models...</AlertDescription>
                </Alert>
            ) : models.length === 0 ? (
                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                        No ML models are currently available. The ML service may not be running.
                        To use this feature, please start the ML backend service.
                    </AlertDescription>
                </Alert>
            ) : (
                <Alert>
                    <BarChart3 className="h-4 w-4" />
                    <AlertDescription>
                        {models.length} ML model{models.length > 1 ? 's' : ''} available
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Input Panel */}
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ModelIcon className="h-5 w-5" />
                                {modelConfig?.name || 'Model'}
                            </CardTitle>
                            <CardDescription>{modelConfig?.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Model Selector */}
                            <div className="space-y-2">
                                <Label>Select Model</Label>
                                <Select value={selectedModel} onValueChange={setSelectedModel}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="churn_model">Churn Predictor</SelectItem>
                                        <SelectItem value="revenue_model">Revenue Forecaster</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Feature Inputs */}
                            {modelConfig?.features.map((feature) => (
                                <div key={feature.name} className="space-y-2">
                                    <Label htmlFor={feature.name}>{feature.label}</Label>
                                    <Input
                                        id={feature.name}
                                        type="number"
                                        min={feature.min}
                                        max={feature.max}
                                        placeholder={feature.placeholder}
                                        value={features[feature.name] || ''}
                                        onChange={(e) => handleFeatureChange(feature.name, e.target.value)}
                                    />
                                </div>
                            ))}

                            {/* Action Buttons */}
                            <div className="flex flex-col gap-2 pt-4">
                                <Button
                                    onClick={handlePredict}
                                    disabled={isPredicting || Object.keys(features).length === 0}
                                    className="w-full"
                                >
                                    {isPredicting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Predicting...
                                        </>
                                    ) : (
                                        'Get Prediction'
                                    )}
                                </Button>
                                <Button
                                    onClick={handleExplain}
                                    disabled={isExplaining || Object.keys(features).length === 0}
                                    variant="outline"
                                    className="w-full"
                                >
                                    {isExplaining ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Explaining...
                                        </>
                                    ) : (
                                        'Explain with SHAP'
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Results Panel */}
                <div className="lg:col-span-2">
                    <Tabs defaultValue="prediction" className="space-y-4">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="prediction">Prediction</TabsTrigger>
                            <TabsTrigger value="explanation">SHAP Explanation</TabsTrigger>
                        </TabsList>

                        {/* Prediction Tab */}
                        <TabsContent value="prediction">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Prediction Result</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {prediction ? (
                                        <div className="space-y-4">
                                            <div className="text-center py-8">
                                                <div className="text-6xl font-bold text-primary mb-2">
                                                    {selectedModel === 'revenue_model'
                                                        ? `$${prediction.prediction.toLocaleString()}`
                                                        : prediction.prediction === 1
                                                            ? 'Will Churn'
                                                            : 'Will Stay'}
                                                </div>
                                                {prediction.probability !== undefined && (
                                                    <Badge variant="outline" className="text-lg px-4 py-2">
                                                        Probability: {(prediction.probability * 100).toFixed(1)}%
                                                    </Badge>
                                                )}
                                                {prediction.confidence !== undefined && (
                                                    <div className="mt-2">
                                                        <span className="text-sm text-muted-foreground">
                                                            Confidence: {(prediction.confidence * 100).toFixed(1)}%
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 text-muted-foreground">
                                            <Brain className="h-16 w-16 mx-auto mb-4 opacity-50" />
                                            <p>Enter features and click "Get Prediction" to see results</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Explanation Tab */}
                        <TabsContent value="explanation">
                            <Card>
                                <CardHeader>
                                    <CardTitle>SHAP Explanation</CardTitle>
                                    <CardDescription>Feature importance and model interpretation</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {explanation ? (
                                        <div className="space-y-6">
                                            {/* Top Features */}
                                            <div>
                                                <h3 className="font-semibold mb-3">Top Contributing Features</h3>
                                                <div className="space-y-2">
                                                    {explanation.top_features.slice(0, 5).map((feature: string, idx: number) => (
                                                        <div key={feature} className="flex items-center justify-between p-2 bg-muted rounded">
                                                            <span className="font-medium">{idx + 1}. {feature}</span>
                                                            <Badge variant={explanation.shap_values[feature] > 0 ? 'default' : 'secondary'}>
                                                                {explanation.shap_values[feature] > 0 ? '+' : ''}
                                                                {explanation.shap_values[feature].toFixed(3)}
                                                            </Badge>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Visualizations */}
                                            {explanation.visualizations && (
                                                <div className="space-y-4">
                                                    {explanation.visualizations.waterfall_plot && (
                                                        <div>
                                                            <h3 className="font-semibold mb-2">Waterfall Plot</h3>
                                                            <img
                                                                src={explanation.visualizations.waterfall_plot}
                                                                alt="SHAP Waterfall Plot"
                                                                className="w-full rounded-lg border"
                                                            />
                                                        </div>
                                                    )}
                                                    {explanation.visualizations.summary_plot && (
                                                        <div>
                                                            <h3 className="font-semibold mb-2">Feature Importance</h3>
                                                            <img
                                                                src={explanation.visualizations.summary_plot}
                                                                alt="SHAP Summary Plot"
                                                                className="w-full rounded-lg border"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 text-muted-foreground">
                                            <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                                            <p>Click "Explain with SHAP" to see feature importance</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
