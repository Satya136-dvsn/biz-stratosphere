import { useState, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import {
    loadModel,
    predict,
    batchPredict,
    getFeatureImportance,
    createChurnModel,
    createRevenueModel,
    getMemoryInfo,
} from '@/lib/browserML';
import { supabase } from '@/lib/supabaseClient';

export interface BrowserMLModel {
    id: string;
    name: string;
    version: string;
    type: 'classification' | 'regression';
    storage_path: string;
    size_kb: number;
    input_features: string[];
    output_labels?: string[];
    description: string;
    accuracy?: number;
    is_active: boolean;
}

export interface PredictionResult {
    prediction: number;
    confidence?: number;
    feature_importance?: Record<string, number>;
    cache_hit: boolean;
}

export function useBrowserML() {
    const [models, setModels] = useState<BrowserMLModel[]>([]);
    const [loadedModels, setLoadedModels] = useState<Map<string, tf.LayersModel>>(new Map());
    const [isLoading, setIsLoading] = useState(true);
    const [isPredicting, setIsPredicting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch available models from database
    useEffect(() => {
        fetchModels();
    }, []);

    const fetchModels = async () => {
        try {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('ml_models')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setModels(data || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Load a model for predictions
    const loadMLModel = async (modelName: string): Promise<tf.LayersModel | null> => {
        try {
            // Check if already loaded
            if (loadedModels.has(modelName)) {
                return loadedModels.get(modelName)!;
            }

            const modelInfo = models.find((m) => m.name === modelName);
            if (!modelInfo) {
                throw new Error(`Model ${modelName} not found`);
            }

            // Load model from Supabase Storage
            const model = await loadModel(modelInfo.storage_path);
            if (!model) {
                throw new Error('Failed to load model');
            }

            // Cache in state
            setLoadedModels((prev) => new Map(prev).set(modelName, model));

            return model;
        } catch (err: any) {
            setError(err.message);
            return null;
        }
    };

    // Make a prediction
    const makePrediction = async (
        modelName: string,
        inputs: number[],
        calculateImportance: boolean = false
    ): Promise<PredictionResult | null> => {
        try {
            setIsPredicting(true);
            setError(null);

            // Check cache first
            const cacheKey = JSON.stringify({ model: modelName, inputs });
            const cached = await checkPredictionCache(modelName, cacheKey);
            if (cached) {
                return cached;
            }

            // Load model if needed
            let model = loadedModels.get(modelName);
            if (!model) {
                model = await loadMLModel(modelName);
                if (!model) {
                    throw new Error('Failed to load model');
                }
            }

            // Run prediction (in browser!)
            const result = await predict(model, inputs);

            // Get feature importance if requested
            let importance: Record<string, number> | undefined;
            if (calculateImportance) {
                const modelInfo = models.find((m) => m.name === modelName);
                if (modelInfo) {
                    importance = await getFeatureImportance(model, inputs, modelInfo.input_features);
                }
            }

            const predictionResult: PredictionResult = {
                ...result,
                feature_importance: importance,
                cache_hit: false,
            };

            // Save to cache and history
            await savePrediction(modelName, inputs, predictionResult);

            return predictionResult;
        } catch (err: any) {
            setError(err.message);
            return null;
        } finally {
            setIsPredicting(false);
        }
    };

    // Batch predictions
    const makeBatchPrediction = async (
        modelName: string,
        inputsBatch: number[][]
    ): Promise<PredictionResult[] | null> => {
        try {
            setIsPredicting(true);
            setError(null);

            // Load model
            let model = loadedModels.get(modelName);
            if (!model) {
                model = await loadMLModel(modelName);
                if (!model) {
                    throw new Error('Failed to load model');
                }
            }

            // Run batch prediction
            const results = await batchPredict(model, inputsBatch);

            return results.map((r) => ({ ...r, cache_hit: false }));
        } catch (err: any) {
            setError(err.message);
            return null;
        } finally {
            setIsPredicting(false);
        }
    };

    // Check prediction cache
    const checkPredictionCache = async (
        modelName: string,
        inputHash: string
    ): Promise<PredictionResult | null> => {
        try {
            const modelInfo = models.find((m) => m.name === modelName);
            if (!modelInfo) return null;

            const { data } = await supabase
                .from('ml_prediction_cache')
                .select('*')
                .eq('model_id', modelInfo.id)
                .eq('input_hash', inputHash)
                .gt('expires_at', new Date().toISOString())
                .maybeSingle();

            if (data) {
                return {
                    prediction: data.prediction,
                    confidence: data.confidence,
                    feature_importance: data.feature_importance,
                    cache_hit: true,
                };
            }

            return null;
        } catch (err) {
            console.error('Cache check error:', err);
            return null;
        }
    };

    // Save prediction to database
    const savePrediction = async (
        modelName: string,
        inputs: number[],
        result: PredictionResult
    ): Promise<void> => {
        try {
            const modelInfo = models.find((m) => m.name === modelName);
            if (!modelInfo) return;

            const { data: userData } = await supabase.auth.getUser();
            if (!userData.user) return;

            const inputHash = JSON.stringify(inputs);

            // Save to cache
            await supabase.from('ml_prediction_cache').upsert({
                user_id: userData.user.id,
                model_id: modelInfo.id,
                input_hash: inputHash,
                inputs: inputs,
                prediction: result.prediction,
                confidence: result.confidence,
                feature_importance: result.feature_importance,
            });

            // Save to history
            await supabase.from('ml_predictions').insert({
                user_id: userData.user.id,
                model_id: modelInfo.id,
                inputs: inputs,
                prediction: result.prediction,
                confidence: result.confidence,
                feature_importance: result.feature_importance,
                cache_hit: result.cache_hit,
            });
        } catch (err) {
            console.error('Save prediction error:', err);
        }
    };

    // Get prediction history
    const getPredictionHistory = async (limit: number = 10) => {
        try {
            const { data, error } = await supabase
                .from('ml_predictions')
                .select('*, ml_models(name, type)')
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data;
        } catch (err: any) {
            setError(err.message);
            return [];
        }
    };

    // Get model statistics
    const getModelStats = async () => {
        try {
            const { data, error } = await supabase.from('ml_model_stats').select('*');

            if (error) throw error;
            return data;
        } catch (err: any) {
            setError(err.message);
            return [];
        }
    };

    // Create demo models (for first-time setup)
    const createDemoModels = async () => {
        try {
            // Create churn model
            const churnModel = createChurnModel();
            await churnModel.save('indexeddb://churn_model_advanced');

            // Create revenue model
            const revenueModel = createRevenueModel();
            await revenueModel.save('indexeddb://revenue_model_advanced');

            console.log('✅ Demo models created and saved locally');
        } catch (err: any) {
            console.error('❌ Error creating demo models:', err);
        }
    };

    // Get memory usage
    const getModelMemoryInfo = () => {
        return getMemoryInfo();
    };

    return {
        models,
        loadedModels: Array.from(loadedModels.keys()),
        isLoading,
        isPredicting,
        error,
        loadMLModel,
        makePrediction,
        makeBatchPrediction,
        getPredictionHistory,
        getModelStats,
        createDemoModels,
        getModelMemoryInfo,
        refetch: fetchModels,
    };
}
