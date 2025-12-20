/**
 * Model Exporter/Importer
 * Export and import trained TensorFlow.js models
 */

import * as tf from '@tensorflow/tfjs';

export interface ModelMetadata {
    modelName: string;
    version: string;
    exportedAt: string;
    accuracy?: number;
    r2Score?: number;
    trainingMetadata: {
        datasetSize: number;
        epochs: number;
        batchSize: number;
        trainedAt?: string;
    };
}

export interface ExportedModel {
    metadata: ModelMetadata;
    modelJSON: any; // Model topology
    weightsData: ArrayBuffer; // Model weights
}

export interface ExportResult {
    success: boolean;
    blob?: Blob;
    error?: string;
}

export interface ImportResult {
    success: boolean;
    metadata?: ModelMetadata;
    error?: string;
}

/**
 * Export a trained model from IndexedDB to a downloadable file
 */
export async function exportModel(
    modelName: string,
    metadata?: Partial<ModelMetadata>
): Promise<ExportResult> {
    try {
        // Load model from IndexedDB
        const model = await tf.loadLayersModel(`indexeddb://${modelName}`);

        // Get model topology (JSON)
        const modelJSON = model.toJSON();

        // Get model weights
        const weights = model.getWeights();
        const weightData: number[][] = [];
        const weightShapes: number[][] = [];

        weights.forEach(weight => {
            weightShapes.push(weight.shape);
            weightData.push(Array.from(weight.dataSync()));
        });

        // Create metadata
        const exportMetadata: ModelMetadata = {
            modelName,
            version: metadata?.version || '1.0.0',
            exportedAt: new Date().toISOString(),
            accuracy: metadata?.accuracy,
            r2Score: metadata?.r2Score,
            trainingMetadata: {
                datasetSize: metadata?.trainingMetadata?.datasetSize || 0,
                epochs: metadata?.trainingMetadata?.epochs || 100,
                batchSize: metadata?.trainingMetadata?.batchSize || 32,
                trainedAt: metadata?.trainingMetadata?.trainedAt,
            },
        };

        // Package everything
        const exportData = {
            metadata: exportMetadata,
            modelJSON,
            weightData,
            weightShapes,
        };

        // Convert to JSON blob
        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });

        return {
            success: true,
            blob,
        };
    } catch (error: any) {
        console.error('Export error:', error);
        return {
            success: false,
            error: error.message || 'Failed to export model',
        };
    }
}

/**
 * Import a model from a file and save to IndexedDB
 */
export async function importModel(
    file: File,
    targetName?: string
): Promise<ImportResult> {
    try {
        // Read file
        const text = await file.text();
        const exportData = JSON.parse(text);

        // Validate structure
        if (!exportData.metadata || !exportData.modelJSON || !exportData.weightData) {
            return {
                success: false,
                error: 'Invalid model file format',
            };
        }

        // Reconstruct model
        const model = await tf.models.modelFromJSON(exportData.modelJSON);

        // Restore weights
        const weightTensors = exportData.weightData.map((data: number[], index: number) => {
            return tf.tensor(data, exportData.weightShapes[index]);
        });

        model.setWeights(weightTensors);

        // Save to IndexedDB
        const saveName = targetName || exportData.metadata.modelName;
        await model.save(`indexeddb://${saveName}`);

        // Clean up tensors
        weightTensors.forEach(tensor => tensor.dispose());
        model.dispose();

        return {
            success: true,
            metadata: exportData.metadata,
        };
    } catch (error: any) {
        console.error('Import error:', error);
        return {
            success: false,
            error: error.message || 'Failed to import model',
        };
    }
}

/**
 * List all models in IndexedDB
 */
export async function listModels(): Promise<string[]> {
    try {
        const models = await tf.io.listModels();
        return Object.keys(models)
            .filter(key => key.startsWith('indexeddb://'))
            .map(key => key.replace('indexeddb://', ''));
    } catch (error) {
        console.error('Error listing models:', error);
        return [];
    }
}

/**
 * Delete a model from IndexedDB
 */
export async function deleteModel(modelName: string): Promise<boolean> {
    try {
        await tf.io.removeModel(`indexeddb://${modelName}`);
        return true;
    } catch (error) {
        console.error('Error deleting model:', error);
        return false;
    }
}

/**
 * Get model info from IndexedDB
 */
export async function getModelInfo(modelName: string): Promise<any> {
    try {
        const models = await tf.io.listModels();
        const key = `indexeddb://${modelName}`;
        return models[key] || null;
    } catch (error) {
        console.error('Error getting model info:', error);
        return null;
    }
}
