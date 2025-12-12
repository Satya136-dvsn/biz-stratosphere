import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from './use-toast';

const ML_API_BASE = 'http://localhost:8000';

export interface MLModel {
    name: string;
    source: 'local' | 'mlflow';
    path?: string;
    latest_version?: string;
}

export interface PredictionResult {
    prediction: number;
    probability?: number;
    confidence?: number;
    model: string;
}

export interface SHAPExplanation {
    shap_values: Record<string, number>;
    base_value: number;
    feature_names: string[];
    top_features: string[];
    prediction: number;
    visualizations?: {
        waterfall_plot?: string;
        summary_plot?: string;
    };
}

export function useMLPredictions() {
    const { toast } = useToast();
    const [isPredicting, setIsPredicting] = useState(false);
    const [isExplaining, setIsExplaining] = useState(false);

    // Fetch available models
    const { data: models = [], isLoading: modelsLoading } = useQuery({
        queryKey: ['ml-models'],
        queryFn: async () => {
            const response = await fetch(`${ML_API_BASE}/ml/models`);
            if (!response.ok) throw new Error('Failed to fetch models');
            const data = await response.json();
            return data.models as MLModel[];
        },
        retry: 2,
    });

    // Make prediction
    const predict = async (
        modelName: string,
        features: Record<string, any>
    ): Promise<PredictionResult | null> => {
        setIsPredicting(true);
        try {
            const response = await fetch(`${ML_API_BASE}/ml/predict`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model_name: modelName,
                    features,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Prediction failed');
            }

            const result = await response.json();
            toast({
                title: 'Prediction Complete',
                description: `Result: ${result.prediction}`,
            });
            return result;
        } catch (error: any) {
            toast({
                title: 'Prediction Error',
                description: error.message,
                variant: 'destructive',
            });
            return null;
        } finally {
            setIsPredicting(false);
        }
    };

    // Get SHAP explanation
    const explain = async (
        modelName: string,
        features: Record<string, any>,
        includePlots: boolean = true
    ): Promise<SHAPExplanation | null> => {
        setIsExplaining(true);
        try {
            const response = await fetch(`${ML_API_BASE}/ml/explain`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model_name: modelName,
                    features,
                    include_plots: includePlots,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Explanation failed');
            }

            const result = await response.json();
            toast({
                title: 'Explanation Generated',
                description: `Top feature: ${result.top_features[0]}`,
            });
            return result;
        } catch (error: any) {
            toast({
                title: 'Explanation Error',
                description: error.message,
                variant: 'destructive',
            });
            return null;
        } finally {
            setIsExplaining(false);
        }
    };

    // Get model info
    const getModelInfo = async (modelName: string) => {
        try {
            const response = await fetch(`${ML_API_BASE}/ml/models/${modelName}/info`);
            if (!response.ok) throw new Error('Failed to fetch model info');
            return await response.json();
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
            });
            return null;
        }
    };

    return {
        models,
        modelsLoading,
        predict,
        explain,
        getModelInfo,
        isPredicting,
        isExplaining,
    };
}
