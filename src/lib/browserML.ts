import * as tf from '@tensorflow/tfjs';
import { supabase } from './supabase';

// Model metadata interface
export interface MLModel {
    id: string;
    name: string;
    version: string;
    type: 'classification' | 'regression';
    storage_path: string;
    size_kb: number;
    input_features: string[];
    output_labels?: string[];
    description: string;
}

// Cached models for browser
const modelCache = new Map<string, tf.LayersModel>();

/**
 * Load TensorFlow.js model from Supabase Storage
 * Models run entirely in the browser - FREE!
 */
export async function loadModel(modelPath: string): Promise<tf.LayersModel | null> {
    try {
        // Check cache first
        if (modelCache.has(modelPath)) {
            console.log(`✅ Model loaded from cache: ${modelPath}`);
            return modelCache.get(modelPath)!;
        }

        console.log(`📥 Loading model from storage: ${modelPath}`);

        // Get model URL from Supabase Storage (public bucket)
        const { data } = supabase.storage
            .from('ml-models')
            .getPublicUrl(modelPath);

        if (!data?.publicUrl) {
            throw new Error('Failed to get model URL');
        }

        // Load TensorFlow.js model from URL
        const model = await tf.loadLayersModel(data.publicUrl);

        // Cache for future use
        modelCache.set(modelPath, model);

        console.log(`✅ Model loaded successfully: ${modelPath}`);
        return model;
    } catch (error) {
        console.error('❌ Error loading model:', error);
        return null;
    }
}

/**
 * Make prediction using browser-based TensorFlow.js model
 * Runs 100% locally - no server calls!
 */
export async function predict(
    model: tf.LayersModel,
    inputs: number[],
    normalize: boolean = true
): Promise<{ prediction: number; confidence?: number }> {
    try {
        // Normalize inputs if needed (simple min-max scaling)
        let processedInputs = inputs;
        if (normalize) {
            processedInputs = inputs.map(val => val / 100); // Simple normalization
        }

        // Create tensor from inputs
        const inputTensor = tf.tensor2d([processedInputs]);

        // Run prediction (happens in browser!)
        const predictionTensor = model.predict(inputTensor) as tf.Tensor;

        // Get prediction value
        const prediction = (await predictionTensor.data())[0];

        // Calculate confidence (for binary classification)
        const confidence = Math.abs(prediction - 0.5) * 2; // 0 to 1 scale

        // Clean up tensors
        inputTensor.dispose();
        predictionTensor.dispose();

        return {
            prediction: Number(prediction.toFixed(4)),
            confidence: Number(confidence.toFixed(4)),
        };
    } catch (error) {
        console.error('❌ Prediction error:', error);
        throw error;
    }
}

/**
 * Batch predictions for multiple inputs
 * Still runs in browser, no server needed
 */
export async function batchPredict(
    model: tf.LayersModel,
    inputsBatch: number[][],
    normalize: boolean = true
): Promise<Array<{ prediction: number; confidence?: number }>> {
    try {
        // Process all inputs
        const processedBatch = normalize
            ? inputsBatch.map(inputs => inputs.map(val => val / 100))
            : inputsBatch;

        // Create batch tensor
        const inputTensor = tf.tensor2d(processedBatch);

        // Predict for entire batch
        const predictionTensor = model.predict(inputTensor) as tf.Tensor;
        const predictions = await predictionTensor.data();

        // Format results
        const results = Array.from(predictions).map(pred => ({
            prediction: Number(pred.toFixed(4)),
            confidence: Number((Math.abs(pred - 0.5) * 2).toFixed(4)),
        }));

        // Cleanup
        inputTensor.dispose();
        predictionTensor.dispose();

        return results;
    } catch (error) {
        console.error('❌ Batch prediction error:', error);
        throw error;
    }
}

/**
 * Get simple feature importance (browser-based approximation)
 * Uses input perturbation to estimate feature impact
 */
export async function getFeatureImportance(
    model: tf.LayersModel,
    baseInputs: number[],
    featureNames: string[]
): Promise<Record<string, number>> {
    try {
        // Get base prediction
        const basePred = await predict(model, baseInputs, false);

        const importance: Record<string, number> = {};

        // Test each feature by perturbing it
        for (let i = 0; i < baseInputs.length; i++) {
            const perturbedInputs = [...baseInputs];
            perturbedInputs[i] = perturbedInputs[i] * 1.1; // 10% increase

            const perturbedPred = await predict(model, perturbedInputs, false);

            // Calculate impact
            const impact = Math.abs(perturbedPred.prediction - basePred.prediction);
            importance[featureNames[i]] = Number(impact.toFixed(4));
        }

        return importance;
    } catch (error) {
        console.error('❌ Feature importance error:', error);
        return {};
    }
}

/**
 * Create a simple churn prediction model (browser-trained)
 * This is a demo model that can be trained entirely in the browser
 */
export function createChurnModel(): tf.Sequential {
    const model = tf.sequential({
        layers: [
            tf.layers.dense({ inputShape: [5], units: 10, activation: 'relu' }),
            tf.layers.dropout({ rate: 0.2 }),
            tf.layers.dense({ units: 5, activation: 'relu' }),
            tf.layers.dense({ units: 1, activation: 'sigmoid' }),
        ],
    });

    model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'binaryCrossentropy',
        metrics: ['accuracy'],
    });

    return model;
}

/**
 * Create a simple revenue prediction model
 */
export function createRevenueModel(): tf.Sequential {
    const model = tf.sequential({
        layers: [
            tf.layers.dense({ inputShape: [5], units: 8, activation: 'relu' }),
            tf.layers.dense({ units: 4, activation: 'relu' }),
            tf.layers.dense({ units: 1, activation: 'linear' }), // Linear for regression
        ],
    });

    model.compile({
        optimizer: tf.train.adam(0.01),
        loss: 'meanSquaredError',
        metrics: ['mae'],
    });

    return model;
}

/**
 * Save model to browser storage (IndexedDB) for offline use
 */
export async function saveModelLocally(model: tf.LayersModel, modelName: string): Promise<void> {
    try {
        await model.save(`indexeddb://${modelName}`);
        console.log(`✅ Model saved locally: ${modelName}`);
    } catch (error) {
        console.error('❌ Error saving model:', error);
    }
}

/**
 * Load model from browser storage
 */
export async function loadModelLocally(modelName: string): Promise<tf.LayersModel | null> {
    try {
        const model = await tf.loadLayersModel(`indexeddb://${modelName}`);
        console.log(`✅ Model loaded from local storage: ${modelName}`);
        return model;
    } catch (error) {
        console.error('❌ Error loading local model:', error);
        return null;
    }
}

/**
 * Clear model cache (useful for updates)
 */
export function clearModelCache(): void {
    modelCache.clear();
    console.log('🗑️ Model cache cleared');
}

/**
 * Get memory usage of loaded models
 */
export function getMemoryInfo(): { numTensors: number; numBytes: number } {
    return {
        numTensors: tf.memory().numTensors,
        numBytes: tf.memory().numBytes,
    };
}
