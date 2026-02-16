// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

/**
 * Unit tests for useChartData hook
 * 
 * Uses vi.hoisted pattern for proper mock hoisting with Vitest
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { subMonths } from 'date-fns';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create hoisted mocks that will be available to vi.mock factories
const mocks = vi.hoisted(() => {
    // Channel subscription mock with proper chaining
    const createChannelMock = () => {
        const chain: any = {
            on: vi.fn(() => chain),
            subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
        };
        return chain;
    };

    // Supabase query builder mock with proper chaining
    const createQueryBuilderMock = () => {
        const builder: any = {
            select: vi.fn(() => builder),
            eq: vi.fn(() => builder),
            gte: vi.fn(() => builder),
            lte: vi.fn(() => builder),
            order: vi.fn(() => builder),
            then: vi.fn((cb: any) => Promise.resolve(cb?.({ data: [], error: null }))),
        };
        return builder;
    };

    return {
        mockSupabase: {
            from: vi.fn(() => createQueryBuilderMock()),
            channel: vi.fn(() => createChannelMock()),
            removeChannel: vi.fn(),
        },
        mockUser: { id: 'test-user-id', email: 'test@example.com' },
    };
});

// Mock using BOTH paths to ensure coverage
vi.mock('@/integrations/supabase/client', () => ({
    supabase: mocks.mockSupabase,
}));

// Also mock the resolved path
vi.mock('../../src/integrations/supabase/client', () => ({
    supabase: mocks.mockSupabase,
}));

vi.mock('@/hooks/useAuth', () => ({
    useAuth: () => ({
        user: mocks.mockUser,
    }),
}));

// Import hook AFTER mocks
import { useChartData } from '@/hooks/useChartData';

// Create wrapper for React Query
function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false, gcTime: 0 },
            mutations: { retry: false },
        },
    });
    return ({ children }: { children: React.ReactNode }) => (
        React.createElement(QueryClientProvider, { client: queryClient }, children)
    );
}

describe('useChartData', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should initialize with expected properties', async () => {
        const { result } = renderHook(
            () => useChartData({
                startDate: subMonths(new Date(), 6),
                endDate: new Date(),
                period: 'monthly' as const,
            }),
            { wrapper: createWrapper() }
        );

        expect(result.current).toHaveProperty('chartData');
        expect(result.current).toHaveProperty('isLoading');
        expect(result.current).toHaveProperty('isFiltering');
        expect(result.current).toHaveProperty('refreshData');
        expect(typeof result.current.refreshData).toBe('function');
    });

    it('should return chartData as an array', async () => {
        const { result } = renderHook(
            () => useChartData({
                startDate: subMonths(new Date(), 6),
                endDate: new Date(),
                period: 'monthly' as const,
            }),
            { wrapper: createWrapper() }
        );

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(Array.isArray(result.current.chartData)).toBe(true);
    });

    it('should provide refreshData function', () => {
        const { result } = renderHook(
            () => useChartData({
                startDate: subMonths(new Date(), 6),
                endDate: new Date(),
                period: 'monthly' as const,
            }),
            { wrapper: createWrapper() }
        );

        expect(typeof result.current.refreshData).toBe('function');
    });
});
