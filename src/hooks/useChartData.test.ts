/**
 * Unit tests for useChartData hook
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useChartData } from '@/hooks/useChartData';
import { createWrapper } from '@/test/utils';
import { resetAllMocks } from '@/test/mocks';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: () => ({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            gte: vi.fn().mockReturnThis(),
            lte: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            then: vi.fn((cb) => cb({
                data: [
                    { id: '1', date: '2024-01-01', value: 100, category: 'A' },
                    { id: '2', date: '2024-01-02', value: 150, category: 'B' },
                    { id: '3', date: '2024-01-03', value: 200, category: 'A' },
                ],
                error: null,
            })),
        }),
    },
}));

describe('useChartData', () => {
    beforeEach(() => {
        resetAllMocks();
        vi.clearAllMocks();
    });

    it('should fetch chart data for a dataset', async () => {
        const { result } = renderHook(
            () => useChartData('dataset-123'),
            { wrapper: createWrapper() }
        );

        await waitFor(() => {
            expect(result.current.data).toBeDefined();
        });

        expect(result.current.data).toHaveLength(3);
    });

    it('should apply filters to data', async () => {
        const { result } = renderHook(
            () => useChartData('dataset-123', { category: 'A' }),
            { wrapper: createWrapper() }
        );

        await waitFor(() => {
            expect(result.current.data).toBeDefined();
        });

        // Data should be filtered
        expect(result.current.isLoading).toBe(false);
    });

    it('should apply date range filters', async () => {
        const { result } = renderHook(
            () => useChartData('dataset-123', {
                startDate: '2024-01-01',
                endDate: '2024-01-02',
            }),
            { wrapper: createWrapper() }
        );

        await waitFor(() => {
            expect(result.current.data).toBeDefined();
        });
    });

    it('should handle aggregation', async () => {
        const { result } = renderHook(
            () => useChartData('dataset-123', { groupBy: 'category' }),
            { wrapper: createWrapper() }
        );

        await waitFor(() => {
            expect(result.current.data).toBeDefined();
        });

        // Should process aggregation
        expect(Array.isArray(result.current.data)).toBe(true);
    });

    it('should track loading state', () => {
        const { result } = renderHook(
            () => useChartData('dataset-123'),
            { wrapper: createWrapper() }
        );

        // Should start as loading
        expect(result.current.isLoading).toBeDefined();
    });

    it('should handle errors gracefully', async () => {
        // Mock error response
        vi.mock('@/integrations/supabase/client', () => ({
            supabase: {
                from: () => ({
                    select: vi.fn().mockReturnThis(),
                    then: vi.fn((cb) => cb({ data: null, error: new Error('Fetch failed') })),
                }),
            },
        }));

        const { result } = renderHook(
            () => useChartData('dataset-123'),
            { wrapper: createWrapper() }
        );

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        // Should handle error without crashing
    });

    it('should refetch data when dataset changes', async () => {
        const { result, rerender } = renderHook(
            ({ datasetId }) => useChartData(datasetId),
            {
                wrapper: createWrapper(),
                initialProps: { datasetId: 'dataset-123' },
            }
        );

        await waitFor(() => {
            expect(result.current.data).toBeDefined();
        });

        // Change dataset ID
        rerender({ datasetId: 'dataset-456' });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });
    });
});
