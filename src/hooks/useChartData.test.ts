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
    });

    it('should fetch chart data with default filters', async () => {
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

        expect(result.current.chartData).toBeDefined();
    });

    it('should accept period filter', async () => {
        const { result } = renderHook(
            () => useChartData({
                startDate: subMonths(new Date(), 3),
                endDate: new Date(),
                period: 'weekly',
            }),
            { wrapper: createWrapper() }
        );

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });
    });

    it('should accept categories filter', async () => {
        const { result } = renderHook(
            () => useChartData({
                startDate: subMonths(new Date(), 6),
                endDate: new Date(),
                period: 'monthly',
                categories: ['revenue', 'customers'],
            }),
            { wrapper: createWrapper() }
        );

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.chartData).toBeDefined();
    });

    it('should handle undefined dates for all-time view', async () => {
        const { result } = renderHook(
            () => useChartData({
                startDate: undefined,
                endDate: undefined,
                period: 'monthly',
            }),
            { wrapper: createWrapper() }
        );

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });
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
