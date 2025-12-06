import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles } from 'lucide-react';
import { useOllamaML } from '@/hooks/useOllamaML';
import { useState } from 'react';

interface SHAPExplainerProps {
    features: Record<string, any>;
    modelType?: string;
}

export function SHAPExplainer({ features, modelType = 'revenue' }: SHAPExplainerProps) {
    const { getExplanation, isExplaining, explanation } = useOllamaML();
    const [hasGenerated, setHasGenerated] = useState(false);

    const handleGenerate = () => {
        getExplanation({ features, model_type: modelType });
        setHasGenerated(true);
    };

    return (
        <Card className="border-primary/20">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        <CardTitle>🔍 Model Explainability (SHAP)</CardTitle>
                    </div>
                    <Button
                        onClick={handleGenerate}
                        disabled={isExplaining}
                        size="sm"
                        variant="outline"
                    >
                        {isExplaining ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Analyzing...
                            </>
                        ) : (
                            'Generate Explanation'
                        )}
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {!hasGenerated && (
                    <div className="text-center py-8 text-muted-foreground">
                        <p>Click "Generate Explanation" to see feature importance</p>
                    </div>
                )}

                {isExplaining && (
                    <div className="text-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                        <p className="mt-2 text-sm text-muted-foreground">
                            Calculating feature importance...
                        </p>
                    </div>
                )}

                {explanation && (
                    <div>
                        <div className="text-sm text-muted-foreground mb-4">
                            {explanation.explanation}
                        </div>

                        <div className="space-y-3">
                            {Object.entries(explanation.feature_importance).map(([feature, value]: [string, any]) => (
                                <div key={feature} className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-medium capitalize">
                                            {feature.replace(/_/g, ' ')}
                                        </span>
                                        <span className="text-muted-foreground">
                                            {(value * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                                        <div
                                            className="bg-gradient-to-r from-primary to-primary/60 h-2 rounded-full transition-all duration-500"
                                            style={{ width: `${value * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                            <div className="text-xs text-muted-foreground">
                                <strong>Confidence:</strong> {(explanation.confidence * 100).toFixed(1)}%
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                                <strong>Model:</strong> {explanation.model_type}
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
