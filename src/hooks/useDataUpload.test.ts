// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

/**
 * Unit tests for useDataUpload hook
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
            upsert: vi.fn(() => builder),
            eq: vi.fn(() => builder),
            then: vi.fn((cb: any) => Promise.resolve(cb?.({ data: [], error: null }))),
        };
        return builder;
    };

    return {
        mockSupabase: {
            from: vi.fn(() => createQueryBuilderMock()),
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

import { useDataUpload } from '@/hooks/useDataUpload';

function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });
    return ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useDataUpload', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should initialize without errors', () => {
        const { result } = renderHook(() => useDataUpload(), { wrapper: createWrapper() });

        // Just verify the hook returns something
        expect(result.current).toBeDefined();
    });

    it('should return an object', () => {
        const { result } = renderHook(() => useDataUpload(), { wrapper: createWrapper() });

        expect(typeof result.current).toBe('object');
    });
});
