// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

/**
 * Unit tests for EnhancedDataUpload component
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mocks = vi.hoisted(() => ({
    mockSupabase: {
        from: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            then: vi.fn((cb: any) => Promise.resolve(cb?.({ data: [], error: null }))),
        }),
    },
}));

vi.mock('@/integrations/supabase/client', () => ({
    supabase: mocks.mockSupabase,
}));

vi.mock('@/hooks/useAuth', () => ({
    useAuth: () => ({
        user: { id: 'test-user-id', email: 'test@example.com' },
    }),
}));

import { EnhancedDataUpload } from '@/components/dashboard/EnhancedDataUpload';

function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });
    return ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('EnhancedDataUpload', () => {
    it('should render correctly', () => {
        const { container } = render(<EnhancedDataUpload />, { wrapper: createWrapper() });
        expect(container).toBeTruthy();
    });
});
