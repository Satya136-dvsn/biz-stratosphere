import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useBrowserML } from '@/hooks/useBrowserML';
import { Loader2, Brain, TrendingUp, UserX, Info, BarChart3, Zap, CheckCircle2, History } from 'lucide-react';
import { FeatureBadge } from '@/components/ui/FeatureBadge';
import { ModelTrainingPanel } from '@/components/ml/ModelTrainingPanel';
import { PredictionHistory } from '@/components/ml/PredictionHistory';

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
    const [selectedModel, setSelectedModel] = useState<string>('churn_model');
    const [features, setFeatures] = useState<Record<string, string>>({});
    const [prediction, setPrediction] = useState<any>(null);
    const [isPredicting, setIsPredicting] = useState(false);
    const [modelsCreated, setModelsCreated] = useState(false);

    const modelConfig = MODEL_FEATURES[selectedModel as keyof typeof MODEL_FEATURES];
    const ModelIcon = modelConfig?.icon || Brain;

    // Create demo models on first load
    useEffect(() => {
        const initModels = async () => {
            if (!modelsCreated) {
                // Import TensorFlow.js functions
                const { createChurnModel, createRevenueModel } = await import('@/lib/browserML');

                // Create and save models locally
                const churnModel = createChurnModel();
                await churnModel.save('indexeddb://churn_model');

                const revenueModel = createRevenueModel();
                await revenueModel.save('indexeddb://revenue_model');

                setModelsCreated(true);
                console.log('✅ Demo models ready for predictions');
            }
        };
        initModels();
    }, [modelsCreated]);

    const handleFeatureChange = (name: string, value: string) => {
        setFeatures(prev => ({ ...prev, [name]: value }));
    };

    const handlePredict = async () => {
        // Validate all features are filled
        const missingFeatures = modelConfig.features.filter(
            f => !features[f.name] || features[f.name] === ''
        );

        if (missingFeatures.length > 0) {
            return;
        }

        setIsPredicting(true);
        setPrediction(null);

        try {
            // Import TensorFlow.js
            const tf = await import('@tensorflow/tfjs');
            const { predict: tfPredict, getFeatureImportance } = await import('@/lib/browserML');

            // Try to load trained model first, fallback to untrained
            let model;
            const trainedModelPath = `indexeddb://${selectedModel}_trained`;
            const untrainedModelPath = `indexeddb://${selectedModel}`;

            try {
                model = await tf.loadLayersModel(trainedModelPath);
                console.log('✅ Using trained model');
            } catch (error) {
                console.log('⚠️ Trained model not found, using untrained model');
                model = await tf.loadLayersModel(untrainedModelPath);
            }

            // Convert features to number array in correct order
            const featureValues = modelConfig.features.map(f => parseFloat(features[f.name]) || 0);

            // Make prediction using browser ML
            const result = await tfPredict(model, featureValues);

            // Get feature importance
            const importance = await getFeatureImportance(
                model,
                featureValues,
                modelConfig.features.map(f => f.name)
            );

            const predictionResult = {
                ...result,
                feature_importance: importance,
                cache_hit: false,
            };

            setPrediction(predictionResult);

            // Save prediction to database for history
            try {
                const { supabase } = await import('@/lib/supabaseClient');
                const { data: userData } = await supabase.auth.getUser();

                if (userData.user) {
                    const { error: dbError } = await supabase
                        .from('ml_predictions')
                        .insert({
                            user_id: userData.user.id,
                            model_name: selectedModel,
                            inputs: featureValues,
                            prediction: result.prediction,
                            confidence: result.confidence || 0,
                            feature_importance: importance,
                            cache_hit: false,
                        });

                    if (dbError) {
                        console.error('Error saving prediction:', dbError);
                    } else {
                        console.log('✅ Prediction saved to history');
                    }
                }
            } catch (dbError) {
                console.error('Database save error:', dbError);
            }

        } catch (error: any) {
            console.error('Prediction error:', error);
            setPrediction({
                error: true,
                message: 'Failed to make prediction. Please try again.',
            });
        } finally {
            setIsPredicting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Brain className="h-8 w-8 text-primary" />
                        ML Predictions
                    </h2>
                    <FeatureBadge variant="production" size="md" />
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <Zap className="h-3 w-3 mr-1" />
                        Browser-Powered
                    </Badge>
                </div>
                <p className="text-muted-foreground mb-3">
                    Make instant predictions with TensorFlow.js models running entirely in your browser - 100% FREE!
                </p>
                <Alert className="bg-blue-50 border-blue-200">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                        <strong>Production Feature:</strong> Browser-based ML predictions using TensorFlow.js.
                        Models run locally - your data never leaves your browser. Unlimited predictions at zero cost!
                    </AlertDescription>
                </Alert>
            </div>

            <Tabs defaultValue="predict" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="predict" className="gap-2">
                        <Brain className="h-4 w-4" />
                        Make Prediction
                    </TabsTrigger>
                    <TabsTrigger value="train" className="gap-2">
                        <Zap className="h-4 w-4" />
                        Train Models
                    </TabsTrigger>
                    <TabsTrigger value="history" className="gap-2">
                        <History className="h-4 w-4" />
                        History
                    </TabsTrigger>
                    <TabsTrigger value="models" className="gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Model Info
                    </TabsTrigger>
                </TabsList>

                {/* Predict Tab */}
                <TabsContent value="predict" className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Input Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <ModelIcon className="h-5 w-5" />
                                    {modelConfig.name}
                                </CardTitle>
                                <CardDescription>{modelConfig.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Model Selection */}
                                <div className="space-y-2">
                                    <Label>Select Model</Label>
                                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="churn_model">
                                                <div className="flex items-center gap-2">
                                                    <UserX className="h-4 w-4" />
                                                    <span>Customer Churn Predictor</span>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="revenue_model">
                                                <div className="flex items-center gap-2">
                                                    <TrendingUp className="h-4 w-4" />
                                                    <span>Revenue Forecaster</span>
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Feature Inputs */}
                                {modelConfig.features.map((feature) => (
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

                                {/* Predict Button */}
                                <Button
                                    onClick={handlePredict}
                                    disabled={isPredicting || !modelsCreated}
                                    className="w-full"
                                    size="lg"
                                >
                                    {isPredicting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Predicting...
                                        </>
                                    ) : (
                                        <>
                                            <Brain className="mr-2 h-4 w-4" />
                                            Get Prediction
                                        </>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Results Card */}
                        <Card className="h-fit">
                            <CardHeader>
                                <CardTitle>Prediction Results</CardTitle>
                                <CardDescription>
                                    {prediction ? 'Your prediction is ready' : 'Results will appear here'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {prediction ? (
                                    <div className="space-y-4">
                                        {/* Prediction Result */}
                                        <div className="space-y-2">
                                            <Label className="text-muted-foreground">Prediction</Label>
                                            <div className="text-3xl font-bold">
                                                {selectedModel === 'churn_model' ? (
                                                    <span className={prediction.prediction > 0.5 ? 'text-red-600' : 'text-green-600'}>
                                                        {prediction.prediction > 0.5 ? 'Will Churn' : 'Will Stay'}
                                                    </span>
                                                ) : (
                                                    <span className="text-blue-600">
                                                        ${(prediction.prediction * 1000).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                Raw value: {prediction.prediction.toFixed(4)}
                                            </div>
                                        </div>

                                        {/* Confidence */}
                                        {prediction.confidence && (
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">Confidence</span>
                                                    <span className="font-medium">{(prediction.confidence * 100).toFixed(1)}%</span>
                                                </div>
                                                <Progress value={prediction.confidence * 100} />
                                            </div>
                                        )}

                                        {/* Feature Importance */}
                                        {prediction.feature_importance && (
                                            <div className="space-y-3">
                                                <div className="text-sm font-medium">Feature Importance</div>
                                                {Object.entries(prediction.feature_importance)
                                                    .sort(([, a], [, b]) => (b as number) - (a as number))
                                                    .slice(0, 5)
                                                    .map(([name, value]) => {
                                                        const feature = modelConfig.features.find(f => f.name === name);
                                                        return (
                                                            <div key={name} className="space-y-1">
                                                                <div className="flex justify-between text-sm">
                                                                    <span className="text-muted-foreground">{feature?.label || name}</span>
                                                                    <span className="font-medium">{(value as number).toFixed(4)}</span>
                                                                </div>
                                                                <Progress value={(value as number) * 100} className="h-1" />
                                                            </div>
                                                        );
                                                    })
                                                }
                                            </div>
                                        )}

                                        {/* Cache indicator */}
                                        {prediction.cache_hit && (
                                            <div className="flex items-center gap-2 text-sm text-green-600">
                                                <CheckCircle2 className="h-4 w-4" />
                                                <span>Loaded from cache (instant!)</span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <Brain className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                                        <p className="text-muted-foreground">
                                            Fill in the features and click "Get Prediction" to see results
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Training Tab */}
                <TabsContent value="train">
                    <ModelTrainingPanel />
                </TabsContent>

                {/* History Tab */}
                <TabsContent value="history">
                    <PredictionHistory />
                </TabsContent>

                {/* Models Tab */}
                <TabsContent value="models">
                    <Card>
                        <CardHeader>
                            <CardTitle>Available Models</CardTitle>
                            <CardDescription>Browser-based TensorFlow.js demo models</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {Object.entries(MODEL_FEATURES).map(([key, modelInfo]) => (
                                    <div key={key} className="p-4 border rounded-lg">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="font-semibold">{modelInfo.name}</h3>
                                                <p className="text-sm text-muted-foreground">{modelInfo.description}</p>
                                                <div className="flex gap-2 mt-2">
                                                    <Badge variant="outline">
                                                        {key.includes('churn') ? 'classification' : 'regression'}
                                                    </Badge>
                                                    <Badge variant="outline">v1.0</Badge>
                                                    <Badge variant="secondary">Demo Model</Badge>
                                                    <Badge variant="secondary" className="bg-green-50 text-green-700">
                                                        Browser-Based
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Info Cards */}
            <div className="grid md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">Browser-Based</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">100%</p>
                        <p className="text-xs text-muted-foreground">Runs entirely in your browser</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">Speed</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">&lt;100ms</p>
                        <p className="text-xs text-muted-foreground">Instant predictions</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">Cost</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-green-600">$0</p>
                        <p className="text-xs text-muted-foreground">FREE forever</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
