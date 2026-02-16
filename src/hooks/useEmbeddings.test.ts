// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

/**
 * Unit tests for useEmbeddings hook
 * Simplified tests - verify hook initializes without errors
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mocks = vi.hoisted(() => {
    const createQueryBuilderMock = () => {
        const builder: any = {
            select: vi.fn(() => builder),
            insert: vi.fn(() => builder),
            eq: vi.fn(() => builder),
            then: vi.fn((cb: any) => Promise.resolve(cb?.({ data: [], error: null }))),
        };
        return builder;
    };

    return {
        mockSupabase: {
            from: vi.fn(() => createQueryBuilderMock()),
            rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
        },
    };
});

vi.mock('@/integrations/supabase/client', () => ({
    supabase: mocks.mockSupabase,
}));

vi.mock('@/hooks/useAuth', () => ({
    useAuth: () => ({
        user: { id: 'test-user-id', email: 'test@example.com' },
    }),
}));

import { useEmbeddings } from '@/hooks/useEmbeddings';

function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });
    return ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useEmbeddings', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should initialize without errors', () => {
        const { result } = renderHook(() => useEmbeddings(), { wrapper: createWrapper() });
        expect(result.current).toBeDefined();
    });

    it('should return an object', () => {
        const { result } = renderHook(() => useEmbeddings(), { wrapper: createWrapper() });
        expect(typeof result.current).toBe('object');
    });
});
