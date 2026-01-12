/**
 * Unit tests for useChartConfigurations hook
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useChartConfigurations } from '@/hooks/useChartConfigurations';
import { createWrapper } from '@/test/utils';

describe('useChartConfigurations', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should initialize with correct return structure', () => {
        const { result } = renderHook(() => useChartConfigurations(), {
            wrapper: createWrapper(),
        });

        expect(result.current).toHaveProperty('configurations');
        expect(result.current).toHaveProperty('isLoading');
        expect(result.current).toHaveProperty('saveConfiguration');
        expect(result.current).toHaveProperty('updateConfiguration');
        expect(result.current).toHaveProperty('deleteConfiguration');
        expect(result.current).toHaveProperty('isSaving');
        expect(result.current).toHaveProperty('isUpdating');
        expect(result.current).toHaveProperty('isDeleting');
    });

    it('should have configurations as an array', async () => {
        const { result } = renderHook(() => useChartConfigurations(), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(Array.isArray(result.current.configurations)).toBe(true);
    });

    it('should have mutation functions', () => {
        const { result } = renderHook(() => useChartConfigurations(), {
            wrapper: createWrapper(),
        });

        expect(typeof result.current.saveConfiguration).toBe('function');
        expect(typeof result.current.updateConfiguration).toBe('function');
        expect(typeof result.current.deleteConfiguration).toBe('function');
    });

    it('should track saving state', async () => {
        const { result } = renderHook(() => useChartConfigurations(), {
            wrapper: createWrapper(),
        });

        expect(result.current.isSaving).toBe(false);
        expect(result.current.isUpdating).toBe(false);
        expect(result.current.isDeleting).toBe(false);
    });
});
