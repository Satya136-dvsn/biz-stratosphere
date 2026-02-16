// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { supabase } from '../supabaseClient';

export interface ModelMetrics {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1?: number;
    mae?: number; // Mean Absolute Error (Regression)
    r2?: number;  // R-squared (Regression)
    loss?: number;
    val_loss?: number;
    training_time_ms?: number;
    dataset_size?: number;
}

export interface DriftCheckResult {
    hasDrift: boolean;
    driftScore: number;
    featureDrift: Record<string, number>;
}

export class MLMonitor {
    /**
     * Log training metrics to Supabase for historical tracking and auditing.
     */
    static async logTrainingMetrics(
        modelName: string,
        version: string,
        metrics: ModelMetrics
    ): Promise<void> {
        try {
            const { data: model } = await supabase
                .from('ml_models')
                .select('id')
                .eq('name', modelName)
                .single();

            if (!model) {
                console.warn(`[MLMonitor] Model not found: ${modelName}`);
                return;
            }

            const { error } = await supabase.from('ml_model_metrics').insert({
                model_id: model.id,
                version: version,
                accuracy: metrics.accuracy,
                precision: metrics.precision,
                recall: metrics.recall,
                f1_score: metrics.f1,
                mae: metrics.mae,
                r2_score: metrics.r2,
                training_time_ms: metrics.training_time_ms,
                dataset_size: metrics.dataset_size,
                metadata: {
                    loss: metrics.loss,
                    val_loss: metrics.val_loss
                }
            });

            if (error) throw error;
            console.log(`[MLMonitor] Logged metrics for ${modelName} v${version}`);
        } catch (err) {
            console.error('[MLMonitor] Failed to log metrics:', err);
        }
    }

    /**
     * Check for concept drift by comparing distribution of live data vs training baseline.
     * Simple statistical distance (e.g., PSI or KL Divergence approximation).
     */
    static checkDrift(
        liveFeatures: number[][],
        baselineStats: { mean: number[]; std: number[] }
    ): DriftCheckResult {
        // Placeholder for simple drift detection logic
        // In a real browser implementation, we'd calculate current mean/std and compare Z-scores

        if (liveFeatures.length < 10) {
            return { hasDrift: false, driftScore: 0, featureDrift: {} };
        }

        // Simplified: Check if current batch mean deviates significantly (>2 std devs) from baseline
        let driftScore = 0;
        const featureDrift: Record<string, number> = {};
        const featureCount = liveFeatures[0].length;

        for (let f = 0; f < featureCount; f++) {
            const values = liveFeatures.map(row => row[f]);
            const currentMean = values.reduce((a, b) => a + b, 0) / values.length;

            // Z-score difference
            const diff = Math.abs(currentMean - baselineStats.mean[f]) / (baselineStats.std[f] || 1);
            featureDrift[`feature_${f}`] = diff;

            if (diff > 2.0) {
                driftScore += diff;
            }
        }

        return {
            hasDrift: driftScore > 3.0, // Arbitrary threshold for this demo
            driftScore,
            featureDrift
        };
    }

    /**
     * Compare two model versions to decide if we should promote the new one.
     * Returns true if v2 (new) is better than v1 (old).
     */
    static compareVersions(
        v1: ModelMetrics,
        v2: ModelMetrics,
        metric: 'accuracy' | 'f1' | 'r2' = 'accuracy'
    ): boolean {
        const score1 = v1[metric] || 0;
        const score2 = v2[metric] || 0;

        // We require at least equal performance, or better.
        // Ideally, new model should be strictly better or have more data.
        return score2 >= score1;
    }
}
