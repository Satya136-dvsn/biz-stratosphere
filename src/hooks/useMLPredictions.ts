// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

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
            try {
                const response = await fetch(`${ML_API_BASE}/ml/models`);
                if (!response.ok) {
                    console.error('[useMLPredictions] Failed to fetch models:', response.status);
                    return [];
                }
                const data = await response.json();
                return data.models as MLModel[];
            } catch (error: any) {
                console.error('[useMLPredictions] Error fetching models:', error);
                return [];
            }
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
                // Handle specific error codes
                if (response.status === 404) {
                    throw new Error('MODEL_NOT_FOUND');
                } else if (response.status === 500) {
                    throw new Error('SERVER_ERROR');
                } else {
                    const error = await response.json().catch(() => ({}));
                    throw new Error(error.detail || 'PREDICTION_FAILED');
                }
            }

            const result = await response.json();
            toast({
                title: 'Prediction Complete',
                description: 'Your prediction has been generated successfully.',
            });
            return result;
        } catch (error: any) {
            console.error('[useMLPredictions] Prediction error:', error);

            // User-friendly error messages
            let errorMessage = 'Unable to generate prediction. Please try again later.';

            if (error.name === 'TypeError' || error.message.includes('fetch')) {
                errorMessage = 'ML service is currently unavailable. Please ensure the backend is running.';
            } else if (error.message === 'MODEL_NOT_FOUND') {
                errorMessage = 'The selected model was not found. Please try a different model.';
            } else if (error.message === 'SERVER_ERROR') {
                errorMessage = 'The ML service encountered an error. Please try again later.';
            }

            toast({
                title: 'Prediction Unavailable',
                description: errorMessage,
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
                // Handle specific error codes
                if (response.status === 404) {
                    throw new Error('MODEL_NOT_FOUND');
                } else if (response.status === 500) {
                    throw new Error('SERVER_ERROR');
                } else {
                    const error = await response.json().catch(() => ({}));
                    throw new Error(error.detail || 'EXPLANATION_FAILED');
                }
            }

            const result = await response.json();
            toast({
                title: 'Explanation Generated',
                description: 'Feature importance analysis is ready.',
            });
            return result;
        } catch (error: any) {
            console.error('[useMLPredictions] Explanation error:', error);

            // User-friendly error messages
            let errorMessage = 'Unable to generate explanation. Please try again later.';

            if (error.name === 'TypeError' || error.message.includes('fetch')) {
                errorMessage = 'ML service is currently unavailable. Please ensure the backend is running.';
            } else if (error.message === 'MODEL_NOT_FOUND') {
                errorMessage = 'The selected model was not found. Please try a different model.';
            } else if (error.message === 'SERVER_ERROR') {
                errorMessage = 'The ML service encountered an error. Please try again later.';
            }

            toast({
                title: 'Explanation Unavailable',
                description: errorMessage,
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
