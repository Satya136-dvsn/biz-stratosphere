/**
 * Batch Predictor
 * Process multiple predictions from CSV data
 */

import * as tf from '@tensorflow/tfjs';

export interface BatchPredictOptions {
    onProgress?: (current: number, total: number) => void;
}

export interface BatchResult {
    inputs: number[];
    prediction: number;
    confidence: number;
    rawScore?: number;
}

/**
 * Run batch predictions on array of feature data
 */
export async function batchPredict(
    data: number[][],
    modelName: string,
    options?: BatchPredictOptions
): Promise<BatchResult[]> {
    const results: BatchResult[] = [];

    try {
        // Load model
        const model = await tf.loadLayersModel(`indexeddb://${modelName}`);

        const isChurnModel = modelName.includes('churn');

        for (let i = 0; i < data.length; i++) {
            const features = data[i];

            // Create tensor
            const inputTensor = tf.tensor2d([features], [1, features.length]);

            // Make prediction
            const predictionTensor = model.predict(inputTensor) as tf.Tensor;
            const predictionArray = await predictionTensor.data();
            const rawScore = predictionArray[0];

            let prediction: number;
            let confidence: number;

            if (isChurnModel) {
                // Classification
                prediction = rawScore;
                confidence = rawScore > 0.5 ? rawScore : 1 - rawScore;
            } else {
                // Regression
                prediction = rawScore;
                confidence = Math.min(0.95, Math.max(0.6, 1 - Math.abs(rawScore % 1)));
            }

            results.push({
                inputs: features,
                prediction,
                confidence,
                rawScore,
            });

            // Clean up
            inputTensor.dispose();
            predictionTensor.dispose();

            // Report progress
            if (options?.onProgress) {
                options.onProgress(i + 1, data.length);
            }

            // Small delay to prevent UI freezing (every 10 rows)
            if ((i + 1) % 10 === 0) {
                await new Promise(resolve => setTimeout(resolve, 10));
            }
        }

        model.dispose();
        return results;
    } catch (error) {
        console.error('Batch prediction error:', error);
        throw error;
    }
}

/**
 * Format batch results as CSV
 */
export function formatBatchResultsCSV(
    results: BatchResult[],
    isChurnModel: boolean,
    featureNames: string[]
): string {
    const headers = [
        ...featureNames,
        'prediction',
        'confidence',
        'raw_score'
    ];

    const rows = results.map(result => {
        const inputsStr = result.inputs.join(',');

        let predictionStr: string;
        if (isChurnModel) {
            predictionStr = result.prediction > 0.5 ? 'Will Churn' : 'Will Stay';
        } else {
            predictionStr = (result.prediction * 1000).toFixed(2);
        }

        const confidenceStr = (result.confidence * 100).toFixed(1) + '%';
        const rawScoreStr = result.rawScore?.toFixed(4) || '';

        return `${inputsStr},"${predictionStr}",${confidenceStr},${rawScoreStr}`;
    });

    return [headers.join(','), ...rows].join('\n');
}
