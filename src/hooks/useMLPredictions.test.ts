/**
 * Unit tests for useMLPredictions hook
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useMLPredictions } from '@/hooks/useMLPredictions';
import { createWrapper } from '@/test/utils';
import { mockFetch } from '@/test/mocks';

// Mock fetch globally
global.fetch = mockFetch as any;

describe('useMLPredictions', () => {
    beforeEach(() => {
        mockFetch.mockClear();
        vi.clearAllMocks();
    });

    it('should initialize with correct return structure', () => {
        const { result } = renderHook(() => useMLPredictions(), {
            wrapper: createWrapper(),
        });

        expect(result.current).toHaveProperty('models');
        expect(result.current).toHaveProperty('modelsLoading');
        expect(result.current).toHaveProperty('predict');
        expect(result.current).toHaveProperty('explain');
        expect(result.current).toHaveProperty('getModelInfo');
        expect(result.current).toHaveProperty('isPredicting');
        expect(result.current).toHaveProperty('isExplaining');
    });

    it('should have models as an array', async () => {
        const { result } = renderHook(() => useMLPredictions(), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(result.current.modelsLoading).toBe(false);
        });

        expect(Array.isArray(result.current.models)).toBe(true);
    });

    it('should have prediction functions', () => {
        const { result } = renderHook(() => useMLPredictions(), {
            wrapper: createWrapper(),
        });

        expect(typeof result.current.predict).toBe('function');
        expect(typeof result.current.explain).toBe('function');
        expect(typeof result.current.getModelInfo).toBe('function');
    });

    it('should track loading states', () => {
        const { result } = renderHook(() => useMLPredictions(), {
            wrapper: createWrapper(),
        });

        expect(result.current.isPredicting).toBe(false);
        expect(result.current.isExplaining).toBe(false);
    });

    it('should call fetch on predict', async () => {
        const { result } = renderHook(() => useMLPredictions(), {
            wrapper: createWrapper(),
        });

        const features = { usage_frequency: 45 };

        await result.current.predict('churn_model', features);

        // Expect fetch to have been called
        expect(mockFetch).toHaveBeenCalled();
    });
});
