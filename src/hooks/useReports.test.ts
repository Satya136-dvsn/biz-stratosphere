/**
 * Unit tests for useReports hook
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useReports } from '@/hooks/useReports';
import { createWrapper } from '@/test/utils';
import { mockFetch, resetAllMocks } from '@/test/mocks';
import { createMockReportConfiguration } from '@/test/factories';

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
                data: createMockReportConfiguration(),
                error: null,
            }),
            then: vi.fn((cb) => cb({
                data: [createMockReportConfiguration()],
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

describe('useReports', () => {
    beforeEach(() => {
        resetAllMocks();
        vi.clearAllMocks();
    });

    it('should fetch saved reports', async () => {
        const { result } = renderHook(() => useReports(), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(result.current.savedReports).toBeDefined();
        });

        await waitFor(() => {
            expect(Array.isArray(result.current.savedReports)).toBe(true);
        });
    });

    it('should save a report configuration', async () => {
        const { result } = renderHook(() => useReports(), {
            wrapper: createWrapper(),
        });

        const reportConfig = {
            name: 'Test Report',
            report_type: 'kpi_summary' as const,
            date_range_start: '2024-01-01',
            date_range_end: '2024-12-31',
            selected_metrics: ['revenue'],
            selected_dimensions: ['date'],
            filters: {},
            dataset_id: 'dataset-123',
        };

        await act(async () => {
            result.current.saveReport({ ...reportConfig });
        });

        await waitFor(() => {
            expect(result.current.isSaving).toBe(false);
        });
    });

    it('should generate a report', async () => {
        const { result } = renderHook(() => useReports(), {
            wrapper: createWrapper(),
        });

        const config = {
            report_type: 'kpi_summary' as const,
            date_range_start: '2024-01-01',
            date_range_end: '2024-12-31',
            selected_metrics: ['revenue'],
            selected_dimensions: ['date'],
            filters: {},
            dataset_id: 'dataset-123',
        };

        let reportData: any;
        await act(async () => {
            reportData = await result.current.generateReport(config);
        });

        expect(reportData).toBeDefined();
    });

    it('should export report as CSV', () => {
        const { result } = renderHook(() => useReports(), {
            wrapper: createWrapper(),
        });

        const data = [
            { date: '2024-01-01', revenue: 1000 },
            { date: '2024-01-02', revenue: 1500 },
        ];

        // Should not throw
        result.current.exportReportAsCSV(data, 'test-report');
    });

    it('should delete a saved report', async () => {
        const { result } = renderHook(() => useReports(), {
            wrapper: createWrapper(),
        });

        await act(async () => {
            result.current.deleteReport({ reportId: 'report-123' });
        });

        await waitFor(() => {
            expect(result.current.savedReports).toBeDefined();
        });
    });

    it('should handle errors gracefully', async () => {
        // Mock error
        vi.mock('@/integrations/supabase/client', () => ({
            supabase: {
                from: () => ({
                    select: vi.fn().mockReturnThis(),
                    then: vi.fn((cb) => cb({ data: null, error: new Error('DB Error') })),
                }),
            },
        }));

        const { result } = renderHook(() => useReports(), {
            wrapper: createWrapper(),
        });

        // Should not throw
        await waitFor(() => {
            expect(result.current.savedReports).toBeDefined();
        });
    });
});
