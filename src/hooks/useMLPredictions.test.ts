/**
 * Unit tests for useMLPredictions hook
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useMLPredictions } from '@/hooks/useMLPredictions';
import { createWrapper } from '@/test/utils';
import { mockFetch, mockMLService } from '@/test/mocks';

// Mock fetch globally
global.fetch = mockFetch as any;

describe('useMLPredictions', () => {
    beforeEach(() => {
        mockFetch.mockClear();
        vi.clearAllMocks();
    });

    it('should fetch available ML models', async () => {
        const { result } = renderHook(() => useMLPredictions(), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(result.current.modelsLoading).toBe(false);
        });

        await waitFor(() => {
            expect(result.current.models.length).toBeGreaterThan(0);
        });

        const models = result.current.models;
        expect(models).toEqual(expect.arrayContaining([
            expect.objectContaining({ name: expect.any(String) }),
        ]));
    });

    it('should make predictions', async () => {
        const { result } = renderHook(() => useMLPredictions(), {
            wrapper: createWrapper(),
        });

        const features = {
            usage_frequency: 45,
            support_tickets: 5,
            tenure_months: 12,
            monthly_spend: 150.50,
            feature_usage_pct: 60.0,
        };

        let prediction: any;
        await act(async () => {
            prediction = await result.current.predict('churn_model', features);
        });

        expect(prediction).toBeDefined();
        expect(prediction).toHaveProperty('prediction');
        expect(prediction).toHaveProperty('model');
        expect(prediction.model).toBe('churn_model');
    });

    it('should generate SHAP explanations', async () => {
        const { result } = renderHook(() => useMLPredictions(), {
            wrapper: createWrapper(),
        });

        const features = {
            usage_frequency: 45,
            support_tickets: 5,
            tenure_months: 12,
        };

        let explanation: any;
        await act(async () => {
            explanation = await result.current.explain('churn_model', features, true);
        });

        expect(explanation).toBeDefined();
        expect(explanation).toHaveProperty('shap_values');
        expect(explanation).toHaveProperty('base_value');
        expect(explanation).toHaveProperty('top_features');
        expect(Array.isArray(explanation.top_features)).toBe(true);
    });

    it('should track prediction loading state', async () => {
        const { result } = renderHook(() => useMLPredictions(), {
            wrapper: createWrapper(),
        });

        expect(result.current.isPredicting).toBe(false);

        const features = { usage_frequency: 45 };

        act(() => {
            result.current.predict('churn_model', features);
        });

        // Should be predicting immediately after call
        expect(result.current.isPredicting).toBe(true);

        await waitFor(() => {
            expect(result.current.isPredicting).toBe(false);
        });
    });

    it('should handle prediction errors', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Prediction failed'));

        const { result } = renderHook(() => useMLPredictions(), {
            wrapper: createWrapper(),
        });

        const features = { usage_frequency: 45 };

        let prediction: any;
        await act(async () => {
            prediction = await result.current.predict('churn_model', features);
        });

        // Should return null on error
        expect(prediction).toBe(null);
        expect(result.current.isPredicting).toBe(false);
    });

    it('should handle explanation errors', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Explanation failed'));

        const { result } = renderHook(() => useMLPredictions(), {
            wrapper: createWrapper(),
        });

        const features = { usage_frequency: 45 };

        let explanation: any;
        await act(async () => {
            explanation = await result.current.explain('churn_model', features);
        });

        // Should return null on error
        expect(explanation).toBe(null);
        expect(result.current.isExplaining).toBe(false);
    });

    it('should get model info', async () => {
        const { result } = renderHook(() => useMLPredictions(), {
            wrapper: createWrapper(),
        });

        let modelInfo: any;
        await act(async () => {
            modelInfo = await result.current.getModelInfo('churn_model');
        });

        expect(modelInfo).toBeDefined();
    });
});
