// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Copy, TrendingUp, UserX, Calendar, Target, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDecisionMemory } from '@/hooks/useDecisionMemory';
import { CheckCircle } from 'lucide-react';

interface PredictionRecord {
    id: string;
    model_id: string;
    inputs: number[];
    prediction: number;
    confidence: number;
    feature_importance?: Record<string, number>;
    cache_hit: boolean;
    created_at: string;
}

interface PredictionDetailsModalProps {
    prediction: PredictionRecord;
    open: boolean;
    onClose: () => void;
}

const MODEL_CONFIGS = {
    churn: {
        name: 'Customer Churn Predictor',
        icon: UserX,
        features: [
            'Usage Frequency',
            'Support Tickets',
            'Tenure (months)',
            'Monthly Spend ($)',
            'Feature Usage %',
        ],
    },
    revenue: {
        name: 'Revenue Forecaster',
        icon: TrendingUp,
        features: [
            'Number of Customers',
            'Avg Deal Size ($)',
            'Marketing Spend ($)',
            'Sales Team Size',
            'Market Growth %',
        ],
    },
};

export function PredictionDetailsModal({ prediction, open, onClose }: PredictionDetailsModalProps) {
    const { toast } = useToast();
    const { createDecision } = useDecisionMemory();

    // Determine model type
    const isChurn = prediction.inputs.length === 5 && prediction.prediction <= 1;
    const config = isChurn ? MODEL_CONFIGS.churn : MODEL_CONFIGS.revenue;
    const ModelIcon = config.icon;

    const formatPrediction = () => {
        if (isChurn) {
            return prediction.prediction > 0.5 ? 'Will Churn' : 'Will Stay';
        } else {
            return `$${(prediction.prediction * 1000).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const handleCopyInputs = () => {
        const inputText = prediction.inputs.map((val, idx) => {
            return `${config.features[idx]}: ${val}`;
        }).join('\n');

        navigator.clipboard.writeText(inputText);
        toast({
            title: 'Copied!',
            description: 'Input values copied to clipboard',
        });
    };

    const handleUsePrediction = () => {
        createDecision.mutate({
            decision_type: 'ml_prediction',
            input_context: {
                model_name: config.name,
                inputs: prediction.inputs,
                prediction_value: prediction.prediction,
                features: config.features
            },
            expected_outcome: isChurn ? (prediction.prediction > 0.5 ? 'Prevent Churn' : 'Retain Customer') : 'Hit Revenue Target',
            human_action: 'accepted',
            ai_confidence_score: prediction.confidence,
            ai_confidence_level: prediction.confidence > 0.8 ? 'high' : (prediction.confidence > 0.5 ? 'medium' : 'low')
        });
        onClose();
    };

    // Sort feature importance by value
    const sortedFeatures = prediction.feature_importance
        ? Object.entries(prediction.feature_importance).sort(([, a], [, b]) => b - a)
        : [];

    const maxImportance = sortedFeatures.length > 0
        ? Math.max(...sortedFeatures.map(([, value]) => value))
        : 1;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ModelIcon className="h-5 w-5" />
                        Prediction Details
                    </DialogTitle>
                    <DialogDescription>
                        Complete information about this prediction
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Model & Date Info */}
                    <div className="flex items-center justify-between">
                        <div>
                            <Badge variant={isChurn ? 'secondary' : 'default'}>
                                {config.name}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {formatDate(prediction.created_at)}
                        </div>
                    </div>

                    {/* Prediction Result */}
                    <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                        <div className="flex items-center gap-2 mb-2">
                            <Target className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">Prediction</span>
                        </div>
                        <div className="text-3xl font-bold text-primary mb-2">
                            {formatPrediction()}
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                                Confidence: {(prediction.confidence * 100).toFixed(1)}%
                            </span>
                            <span className="text-muted-foreground">
                                Raw value: {prediction.prediction.toFixed(4)}
                            </span>
                        </div>
                    </div>

                    {/* Input Values */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-medium">Input Values</h3>
                            <Button variant="outline" size="sm" onClick={handleCopyInputs}>
                                <Copy className="h-3 w-3 mr-2" />
                                Copy
                            </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {prediction.inputs.map((value, idx) => (
                                <div key={idx} className="p-3 bg-muted rounded-lg">
                                    <div className="text-xs text-muted-foreground mb-1">
                                        {config.features[idx]}
                                    </div>
                                    <div className="text-sm font-medium">{value}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Feature Importance */}
                    {sortedFeatures.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <BarChart3 className="h-4 w-4" />
                                <h3 className="text-sm font-medium">Feature Importance</h3>
                            </div>
                            <div className="space-y-3">
                                {sortedFeatures.map(([feature, importance]) => {
                                    // Convert from snake_case to display names
                                    const featureIndex = [
                                        'usage_frequency',
                                        'support_tickets',
                                        'tenure_months',
                                        'monthly_spend',
                                        'feature_usage_pct',
                                        'num_customers',
                                        'avg_deal_size',
                                        'marketing_spend',
                                        'sales_team_size',
                                        'market_growth_pct',
                                    ].indexOf(feature);

                                    const displayName = featureIndex >= 0
                                        ? config.features[featureIndex % config.features.length]
                                        : feature;

                                    const percentage = (importance / maxImportance) * 100;

                                    return (
                                        <div key={feature}>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span>{displayName}</span>
                                                <span className="font-medium">{importance.toFixed(4)}</span>
                                            </div>
                                            <Progress value={percentage} className="h-2" />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Additional Info */}
                    <div className="pt-4 border-t text-xs text-muted-foreground space-y-1">
                        <div>Prediction ID: {prediction.id}</div>
                        <div>Cache hit: {prediction.cache_hit ? 'Yes' : 'No'}</div>
                    </div>
                    <div className="pt-4 border-t text-xs text-muted-foreground space-y-1">
                        <div>Prediction ID: {prediction.id}</div>
                        <div>Cache hit: {prediction.cache_hit ? 'Yes' : 'No'}</div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={onClose}>Close</Button>
                        <Button onClick={handleUsePrediction} className="gap-2">
                            <CheckCircle className="h-4 w-4" />
                            Use Prediction
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
