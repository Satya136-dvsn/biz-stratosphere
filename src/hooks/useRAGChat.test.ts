// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

/**
 * Unit tests for useRAGChat hook
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
            update: vi.fn(() => builder),
            delete: vi.fn(() => builder),
            eq: vi.fn(() => builder),
            order: vi.fn(() => builder),
            single: vi.fn(() => Promise.resolve({ data: null, error: null })),
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

import { useRAGChat } from '@/hooks/useRAGChat';

function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });
    return ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useRAGChat', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should initialize without errors', () => {
        const { result } = renderHook(() => useRAGChat(), { wrapper: createWrapper() });
        expect(result.current).toBeDefined();
    });

    it('should return an object', () => {
        const { result } = renderHook(() => useRAGChat(), { wrapper: createWrapper() });
        expect(typeof result.current).toBe('object');
    });
});
