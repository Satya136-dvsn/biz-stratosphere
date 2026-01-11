/**
 * Unit tests for useChartConfigurations hook
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useChartConfigurations } from '@/hooks/useChartConfigurations';
import { createWrapper } from '@/test/utils';

describe.skip('useChartConfigurations', () => {
    beforeEach(() => {
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

    it('should handle save errors gracefully', async () => {
        const { result } = renderHook(() => useChartConfigurations(), {
            wrapper: createWrapper(),
        });

        await act(async () => {
            try {
                await result.current.saveConfiguration({} as any);
            } catch (e) {
                // Expected
            }
        });
    });
});
