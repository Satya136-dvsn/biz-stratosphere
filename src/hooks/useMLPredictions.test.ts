// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

/**
 * Unit tests for useMLPredictions hook
 * Simplified tests - verify hook initializes without errors
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock fetch for ML API calls
global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ models: [] }),
});

vi.mock('@/hooks/useAuth', () => ({
    useAuth: () => ({
        user: { id: 'test-user-id', email: 'test@example.com' },
    }),
}));

import { useMLPredictions } from '@/hooks/useMLPredictions';

function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });
    return ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useMLPredictions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should initialize without errors', () => {
        const { result } = renderHook(() => useMLPredictions(), { wrapper: createWrapper() });
        expect(result.current).toBeDefined();
    });

    it('should return an object', () => {
        const { result } = renderHook(() => useMLPredictions(), { wrapper: createWrapper() });
        expect(typeof result.current).toBe('object');
    });
});
