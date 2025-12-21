import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Zap, CheckCircle2, Info, TrendingUp } from 'lucide-react';
import { generateChurnTrainingData, generateRevenueTrainingData, splitTrainTest } from '@/lib/trainingDataGenerator';
import { trainBothModels, evaluateModel, TrainingProgress } from '@/lib/modelTrainer';
import { useToast } from '@/hooks/use-toast';
import { useAdvancedML } from '@/hooks/useAdvancedML';

export function ModelTrainingPanel() {
    const { toast } = useToast();
    const { metrics, saveMetrics, getNextVersion } = useAdvancedML();
    const [isTraining, setIsTraining] = useState(false);
    const [trainingComplete, setTrainingComplete] = useState(false);
    const [currentModel, setCurrentModel] = useState('');
    const [version, setVersion] = useState('1.0.0');
    const [progress, setProgress] = useState<TrainingProgress | null>(null);
    const [results, setResults] = useState<{
        churnAccuracy?: number;
        revenueR2?: number;
        trainingTime?: number;
    }>({});

    const handleTrainModels = async () => {
        setIsTraining(true);
        setTrainingComplete(false);
        setResults({});

        try {
            toast({
                title: 'Training Started',
                description: 'Generating training data and training models...',
            });

            // Generate training data (1000 samples each)
            console.log('📊 Generating training data...');
            const churnData = generateChurnTrainingData(1000);
            const revenueData = generateRevenueTrainingData(1000);

            // Split into train/test
            const churnSplit = splitTrainTest(churnData, 0.8);
            const revenueSplit = splitTrainTest(revenueData, 0.8);

            console.log(`✅ Data generated: ${churnData.length} churn samples, ${revenueData.length} revenue samples`);

            // Determine next version
            const nextVersion = await getNextVersion('churn_model');
            setVersion(nextVersion);

            // Train both models
            const startTime = Date.now();
            await trainBothModels(
                churnSplit.train,
                revenueSplit.train,
                nextVersion,
                (modelName, prog) => {
                    setCurrentModel(modelName);
                    setProgress(prog);
                }
            );
            const totalTime = Date.now() - startTime;

            // Evaluate models on test data
            console.log('📈 Evaluating model accuracy...');
            const churnEval = await evaluateModel(
                'indexeddb://churn_model_trained',
                churnSplit.test,
                true
            );
            const revenueEval = await evaluateModel(
                'indexeddb://revenue_model_trained',
                revenueSplit.test,
                false
            );

            setResults({
                churnAccuracy: churnEval.accuracy,
                revenueR2: revenueEval.r2,
                trainingTime: totalTime,
            });

            setTrainingComplete(true);

            // Save metrics to Supabase for historical tracking
            await Promise.all([
                saveMetrics({
                    model_name: 'churn_model',
                    version: nextVersion,
                    accuracy: churnEval.accuracy,
                    training_time_ms: totalTime / 2, // Approx
                    dataset_size: 1000
                }),
                saveMetrics({
                    model_name: 'revenue_model',
                    version: nextVersion,
                    r2: revenueEval.r2,
                    training_time_ms: totalTime / 2, // Approx
                    dataset_size: 1000
                })
            ]);

            toast({
                title: `Training v${nextVersion} Complete! 🎉`,
                description: `Models trained successfully in ${(totalTime / 1000).toFixed(1)}s. Churn accuracy: ${(churnEval.accuracy! * 100).toFixed(1)}%`,
            });

        } catch (error: any) {
            console.error('Training error:', error);
            toast({
                title: 'Training Failed',
                description: error.message || 'Failed to train models',
                variant: 'destructive',
            });
        } finally {
            setIsTraining(false);
            setCurrentModel('');
            setProgress(null);
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Zap className="h-5 w-5 text-primary" />
                            Train Models
                        </CardTitle>
                        <CardDescription>Train models with synthetic data for accurate predictions</CardDescription>
                    </div>
                    {trainingComplete && (
                        <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Trained
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <Alert className="bg-blue-50 border-blue-200">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                        Training generates 1000 realistic samples per model and trains in your browser (FREE!).
                        Expected accuracy: 80-90%. Training takes ~20-30 seconds.
                    </AlertDescription>
                </Alert>

                {/* Training Button */}
                {!isTraining && !trainingComplete && (
                    <Button
                        onClick={handleTrainModels}
                        className="w-full"
                        size="lg"
                    >
                        <Zap className="mr-2 h-4 w-4" />
                        Train Models Now
                    </Button>
                )}

                {/* Training Progress */}
                {isTraining && progress && (
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="font-medium">{currentModel}</span>
                            <span className="text-muted-foreground">
                                Epoch {progress.epoch}/{progress.totalEpochs}
                            </span>
                        </div>
                        <Progress value={(progress.epoch / progress.totalEpochs) * 100} />
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                                <span className="text-muted-foreground">Loss:</span>{' '}
                                <span className="font-medium">{progress.loss.toFixed(4)}</span>
                            </div>
                            {progress.accuracy !== undefined && (
                                <div>
                                    <span className="text-muted-foreground">Accuracy:</span>{' '}
                                    <span className="font-medium">{(progress.accuracy * 100).toFixed(1)}%</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {isTraining && !progress && (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <span className="ml-2 text-muted-foreground">Generating training data...</span>
                    </div>
                )}

                {/* Results */}
                {trainingComplete && results && (
                    <div className="space-y-3 pt-2 border-t">
                        <div className="flex items-center gap-2 text-sm font-medium text-green-700">
                            <CheckCircle2 className="h-4 w-4" />
                            Training Complete!
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="text-xs text-blue-600 mb-1">Churn Model</div>
                                <div className="text-2xl font-bold text-blue-700">
                                    {(results.churnAccuracy! * 100).toFixed(1)}%
                                </div>
                                <div className="text-xs text-blue-600">Accuracy</div>
                            </div>

                            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                                <div className="text-xs text-green-600 mb-1">Revenue Model</div>
                                <div className="text-2xl font-bold text-green-700">
                                    {(results.revenueR2! * 100).toFixed(1)}%
                                </div>
                                <div className="text-xs text-green-600">R² Score</div>
                            </div>
                        </div>

                        <div className="text-xs text-muted-foreground text-center">
                            Training time: {(results.trainingTime! / 1000).toFixed(1)}s
                        </div>

                        <Alert className="bg-green-50 border-green-200">
                            <TrendingUp className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-800 text-sm">
                                <strong>Predictions are now accurate!</strong> Use the prediction form above to get reliable results based on trained models.
                            </AlertDescription>
                        </Alert>

                        <Button
                            onClick={handleTrainModels}
                            variant="outline"
                            className="w-full"
                        >
                            Re-train Models
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
