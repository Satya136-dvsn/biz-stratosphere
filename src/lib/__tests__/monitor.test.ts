import { describe, it, expect } from 'vitest';
import { MLMonitor } from '../ml/monitor';

// Mock Supabase to avoid load error (though not used in pure functions below)
import { vi } from 'vitest';
vi.mock('@/integrations/supabase/client', () => ({
    supabase: {}
}));

describe('MLMonitor Logic', () => {

    describe('compareVersions', () => {
        it('should prefer v2 if accuracy is higher', () => {
            const v1 = { accuracy: 0.80 };
            const v2 = { accuracy: 0.85 };
            const result = MLMonitor.compareVersions(v1, v2, 'accuracy');
            expect(result).toBe(true);
        });

        it('should reject v2 if accuracy is lower', () => {
            const v1 = { accuracy: 0.90 };
            const v2 = { accuracy: 0.85 };
            const result = MLMonitor.compareVersions(v1, v2, 'accuracy');
            expect(result).toBe(false);
        });
    });

    describe('checkDrift (Data Drift)', () => {
        it('should detect drift if live data deviates from baseline', () => {
            // Baseline: Mean=0, Std=1
            const baseline = { mean: [0], std: [1] };

            // Live: Mean=5 (High deviation)
            const liveFeatures = Array(20).fill([5]);

            const result = MLMonitor.checkDrift(liveFeatures, baseline);
            expect(result.hasDrift).toBe(true);
            expect(result.driftScore).toBeGreaterThan(0);
        });

        it('should NOT detect drift if live data matches baseline', () => {
            // Baseline: Mean=10, Std=2
            const baseline = { mean: [10], std: [2] };

            // Live: Mean=10
            const liveFeatures = Array(20).fill([10]);

            const result = MLMonitor.checkDrift(liveFeatures, baseline);
            expect(result.hasDrift).toBe(false);
        });
    });
});
