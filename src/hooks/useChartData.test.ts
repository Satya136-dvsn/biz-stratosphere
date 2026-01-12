/**
 * Unit tests for useChartData hook
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useChartData } from '@/hooks/useChartData';
import { createWrapper } from '@/test/utils';
import { subMonths } from 'date-fns';

describe('useChartData', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should initialize with loading state', () => {
        const { result } = renderHook(
            () => useChartData({
                startDate: subMonths(new Date(), 6),
                endDate: new Date(),
                period: 'monthly',
            }),
            { wrapper: createWrapper() }
        );

        expect(result.current.isLoading).toBeDefined();
        expect(typeof result.current.refreshData).toBe('function');
    });

    it('should return chart data structure', async () => {
        const { result } = renderHook(
            () => useChartData({
                startDate: subMonths(new Date(), 6),
                endDate: new Date(),
                period: 'monthly',
            }),
            { wrapper: createWrapper() }
        );

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current).toHaveProperty('chartData');
        expect(result.current).toHaveProperty('isLoading');
        expect(result.current).toHaveProperty('isFiltering');
        expect(result.current).toHaveProperty('refreshData');
        expect(Array.isArray(result.current.chartData)).toBe(true);
    });

    it('should provide refreshData function', () => {
        const { result } = renderHook(
            () => useChartData({
                startDate: subMonths(new Date(), 6),
                endDate: new Date(),
                period: 'monthly',
            }),
            { wrapper: createWrapper() }
        );

        expect(typeof result.current.refreshData).toBe('function');
    });
});
