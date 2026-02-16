// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { useQuery, useMutation } from '@tanstack/react-query';

const ML_API_URL = 'http://localhost:8000';

interface PredictionRequest {
    prompt: string;
    model?: string;
    temperature?: number;
    max_tokens?: number;
}

interface ExplainRequest {
    features: Record<string, any>;
    model_type?: string;
}

export function useOllamaML() {
    // List available models
    const { data: modelsData, isLoading: modelsLoading } = useQuery({
        queryKey: ['ollama-models'],
        queryFn: async () => {
            const res = await fetch(`${ML_API_URL}/models`);
            if (!res.ok) throw new Error('Failed to fetch models');
            return res.json();
        },
        refetchInterval: 30000, // Refresh every 30s
    });

    // Health check
    const { data: healthData } = useQuery({
        queryKey: ['ml-health'],
        queryFn: async () => {
            const res = await fetch(`${ML_API_URL}/health`);
            return res.json();
        },
        refetchInterval: 10000, // Check every 10s
    });

    // Generate prediction
    const generatePrediction = useMutation({
        mutationFn: async (request: PredictionRequest) => {
            const res = await fetch(`${ML_API_URL}/predict`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: request.prompt,
                    model: request.model || 'llama3.1',
                    temperature: request.temperature || 0.7,
                    max_tokens: request.max_tokens || 1000,
                }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.detail || 'Prediction failed');
            }

            return res.json();
        },
    });

    // Get explanation
    const getExplanation = useMutation({
        mutationFn: async (request: ExplainRequest) => {
            const res = await fetch(`${ML_API_URL}/explain`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.detail || 'Explanation failed');
            }

            return res.json();
        },
    });

    return {
        models: modelsData?.models || [],
        modelsCount: modelsData?.count || 0,
        modelsLoading,
        health: healthData,
        isHealthy: healthData?.status === 'healthy',
        generatePrediction: generatePrediction.mutate,
        isGenerating: generatePrediction.isPending,
        predictionResult: generatePrediction.data,
        getExplanation: getExplanation.mutate,
        isExplaining: getExplanation.isPending,
        explanation: getExplanation.data,
    };
}
