import * as tf from '@tensorflow/tfjs';
import { createChurnModel, createRevenueModel } from './browserML';

export interface TrainingProgress {
    epoch: number;
    totalEpochs: number;
    loss: number;
    accuracy?: number;
    valLoss?: number;
    valAccuracy?: number;
}

export interface TrainingResult {
    finalLoss: number;
    finalAccuracy?: number;
    trainingTime: number;
    modelName: string;
}

/**
 * Train a churn prediction model with provided data
 */
export async function trainChurnModel(
    trainingData: { features: number[]; label: number }[],
    onProgress?: (progress: TrainingProgress) => void
): Promise<TrainingResult> {
    const startTime = Date.now();

    // Create fresh untrained model
    const model = createChurnModel();

    // Prepare tensors
    const xs = tf.tensor2d(trainingData.map(d => d.features));
    const ys = tf.tensor2d(trainingData.map(d => [d.label]));

    // Training configuration - increased epochs for advanced model
    const epochs = 100;
    let finalLoss = 0;
    let finalAccuracy = 0;

    try {
        // Train the model
        await model.fit(xs, ys, {
            epochs,
            batchSize: 32,
            validationSplit: 0.2,
            shuffle: true,
            callbacks: {
                onEpochEnd: (epoch, logs) => {
                    finalLoss = logs?.loss || 0;
                    finalAccuracy = logs?.acc || 0;

                    if (onProgress) {
                        onProgress({
                            epoch: epoch + 1,
                            totalEpochs: epochs,
                            loss: finalLoss,
                            accuracy: finalAccuracy,
                            valLoss: logs?.val_loss,
                            valAccuracy: logs?.val_acc,
                        });
                    }
                },
            },
        });

        // Save trained model to IndexedDB
        await model.save('indexeddb://churn_model_trained');
        console.log('✅ Churn model trained and saved');

    } finally {
        // Cleanup tensors
        xs.dispose();
        ys.dispose();
    }

    const trainingTime = Date.now() - startTime;

    return {
        finalLoss,
        finalAccuracy,
        trainingTime,
        modelName: 'churn_model_trained',
    };
}

/**
 * Train a revenue forecasting model with provided data
 */
export async function trainRevenueModel(
    trainingData: { features: number[]; label: number }[],
    onProgress?: (progress: TrainingProgress) => void
): Promise<TrainingResult> {
    const startTime = Date.now();

    // Create fresh untrained model
    const model = createRevenueModel();

    // Prepare tensors
    const xs = tf.tensor2d(trainingData.map(d => d.features));
    const ys = tf.tensor2d(trainingData.map(d => [d.label]));

    // Training configuration - increased epochs for advanced model
    const epochs = 100;
    let finalLoss = 0;

    try {
        // Train the model
        await model.fit(xs, ys, {
            epochs,
            batchSize: 32,
            validationSplit: 0.2,
            shuffle: true,
            callbacks: {
                onEpochEnd: (epoch, logs) => {
                    finalLoss = logs?.loss || 0;

                    if (onProgress) {
                        onProgress({
                            epoch: epoch + 1,
                            totalEpochs: epochs,
                            loss: finalLoss,
                            valLoss: logs?.val_loss,
                        });
                    }
                },
            },
        });

        // Save trained model to IndexedDB
        await model.save('indexeddb://revenue_model_trained');
        console.log('✅ Revenue model trained and saved');

    } finally {
        // Cleanup tensors
        xs.dispose();
        ys.dispose();
    }

    const trainingTime = Date.now() - startTime;

    return {
        finalLoss,
        trainingTime,
        modelName: 'revenue_model_trained',
    };
}

/**
 * Evaluate model accuracy on test data
 */
export async function evaluateModel(
    modelPath: string,
    testData: { features: number[]; label: number }[],
    isClassification: boolean = true
): Promise<{ accuracy?: number; mae?: number; r2?: number }> {
    // Load trained model
    const model = await tf.loadLayersModel(modelPath);

    // Prepare test tensors
    const xs = tf.tensor2d(testData.map(d => d.features));
    const ys = tf.tensor2d(testData.map(d => [d.label]));

    try {
        if (isClassification) {
            // For classification: calculate accuracy
            const predictions = model.predict(xs) as tf.Tensor;
            const predLabels = predictions.greater(0.5).asType('float32');
            const correct = predLabels.equal(ys).asType('float32');
            const accuracy = await correct.mean().data();

            predictions.dispose();
            predLabels.dispose();
            correct.dispose();

            return { accuracy: accuracy[0] };
        } else {
            // For regression: calculate MAE and R²
            const predictions = model.predict(xs) as tf.Tensor;

            // Mean Absolute Error
            const mae = await predictions.sub(ys).abs().mean().data();

            // R² Score
            const yMean = await ys.mean().data();
            const totalSS = await ys.sub(yMean[0]).square().sum().data();
            const residualSS = await predictions.sub(ys).square().sum().data();
            const r2 = 1 - (residualSS[0] / totalSS[0]);

            predictions.dispose();

            return { mae: mae[0], r2 };
        }
    } finally {
        // Cleanup
        xs.dispose();
        ys.dispose();
    }
}

/**
 * Train both models sequentially
 */
export async function trainBothModels(
    churnData: { features: number[]; label: number }[],
    revenueData: { features: number[]; label: number }[],
    onProgress?: (modelName: string, progress: TrainingProgress) => void
): Promise<{ churn: TrainingResult; revenue: TrainingResult }> {
    console.log('🚀 Starting model training...');

    // Train churn model
    const churnResult = await trainChurnModel(churnData, (progress) => {
        if (onProgress) onProgress('Churn Model', progress);
    });

    // Train revenue model
    const revenueResult = await trainRevenueModel(revenueData, (progress) => {
        if (onProgress) onProgress('Revenue Model', progress);
    });

    console.log('✅ Both models trained successfully!');

    return {
        churn: churnResult,
        revenue: revenueResult,
    };
}
