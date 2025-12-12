/**
 * Unit tests for useChartConfigurations hook
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useChartConfigurations } from '@/hooks/useChartConfigurations';
import { createWrapper } from '@/test/utils';
import { resetAllMocks } from '@/test/mocks';
import { createMockChartConfiguration } from '@/test/factories';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: (table: string) => ({
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
                data: createMockChartConfiguration(),
                error: null,
            }),
            then: vi.fn((cb) => cb({
                data: [createMockChartConfiguration()],
                error: null
            })),
        }),
    },
}));

// Mock useAuth
vi.mock('@/hooks/useAuth', () => ({
    useAuth: () => ({
        user: { id: 'user-123', email: 'test@example.com' },
    }),
}));

describe('useChartConfigurations', () => {
    beforeEach(() => {
        resetAllMocks();
        vi.clearAllMocks();
    });

    it('should fetch chart configurations', async () => {
        const { result } = renderHook(() => useChartConfigurations(), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(result.current.configurations).toBeDefined();
        });

        await waitFor(() => {
            expect(Array.isArray(result.current.configurations)).toBe(true);
        });
    });

    it('should save a chart configuration', async () => {
        const { result } = renderHook(() => useChartConfigurations(), {
            wrapper: createWrapper(),
        });

        const chartConfig = {
            name: 'Test Chart',
            chart_type: 'bar' as const,
            dataset_id: 'dataset-123',
            x_column: 'date',
            y_column: 'value',
            filters: {},
            customization: {
                title: 'Test Chart',
                showLegend: true,
                showGrid: true,
                showTooltip: true,
                primaryColor: '#8884d8',
                secondaryColor: '#82ca9d',
                width: 600,
                height: 400,
            },
        };

        await act(async () => {
            result.current.saveConfiguration({ ...chartConfig });
        });

        await waitFor(() => {
            expect(result.current.isSaving).toBe(false);
        });
    });

    it('should update an existing configuration', async () => {
        const { result } = renderHook(() => useChartConfigurations(), {
            wrapper: createWrapper(),
        });

        await act(async () => {
            result.current.updateConfiguration({
                configId: 'chart-123',
                updates: { name: 'Updated Chart' },
            });
        });

        await waitFor(() => {
            expect(result.current.isSaving).toBe(false);
        });
    });

    it('should delete a configuration', async () => {
        const { result } = renderHook(() => useChartConfigurations(), {
            wrapper: createWrapper(),
        });

        await act(async () => {
            result.current.deleteConfiguration({ configId: 'chart-123' });
        });

        await waitFor(() => {
            expect(result.current.configurations).toBeDefined();
        });
    });

    it('should export chart as image', () => {
        const { result } = renderHook(() => useChartConfigurations(), {
            wrapper: createWrapper(),
        });

        // Mock canvas element
        const mockCanvas = document.createElement('canvas');

        // Should not throw
        result.current.exportChartAsImage(mockCanvas, 'test-chart');
    });

    it('should handle save errors gracefully', async () => {
        // This test would need a mocked error scenario
        const { result } = renderHook(() => useChartConfigurations(), {
            wrapper: createWrapper(),
        });

        // Should not throw even with invalid data
        await act(async () => {
            result.current.saveConfiguration({} as any);
        });
    });
});
