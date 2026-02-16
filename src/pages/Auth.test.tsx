// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

/**
 * Unit tests for Auth page
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mocks = vi.hoisted(() => ({
    mockSupabase: {
        auth: {
            getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
            onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
            signInWithPassword: vi.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
            signUp: vi.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
        },
    },
}));

vi.mock('@/integrations/supabase/client', () => ({
    supabase: mocks.mockSupabase,
}));

vi.mock('@/hooks/useAuth', () => ({
    useAuth: () => ({
        user: null,
        session: null,
        loading: false,
    }),
    AuthProvider: ({ children }: any) => children,
}));

import Auth from '@/pages/Auth';

function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });
    return ({ children }: { children: React.ReactNode }) =>
        React.createElement(
            QueryClientProvider,
            { client: queryClient },
            React.createElement(BrowserRouter, null, children)
        );
}

describe('Auth Page', () => {
    it('should render the auth page', () => {
        const { container } = render(<Auth />, { wrapper: createWrapper() });
        expect(container).toBeTruthy();
    });

    it('should have email input field', () => {
        render(<Auth />, { wrapper: createWrapper() });
        const emailInput = document.querySelector('input[type="email"]');
        expect(emailInput).toBeTruthy();
    });

    it('should have password input field', () => {
        render(<Auth />, { wrapper: createWrapper() });
        const passwordInput = document.querySelector('input[type="password"]');
        expect(passwordInput).toBeTruthy();
    });
});
