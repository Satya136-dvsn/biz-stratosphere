// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.


import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDecisionMemory } from './useDecisionMemory';
import { supabase } from '@/integrations/supabase/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock dependencies
// Mock dependencies
const mockInsert = vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn(() => ({ data: {}, error: null })) })) }));
const mockUpdate = vi.fn(() => ({ eq: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn(() => ({ data: {}, error: null })) })) })) }));
const mockSelect = vi.fn(() => ({ order: vi.fn(() => ({ data: [], error: null })) }));

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: vi.fn(() => ({
            insert: mockInsert,
            update: mockUpdate,
            select: mockSelect,
        })),
    },
}));

vi.mock('./useAuth', () => ({
    useAuth: () => ({
        session: { user: { id: 'test-user-id' } },
    }),
}));

vi.mock('./useWorkspaces', () => ({
    useWorkspaces: () => ({
        currentWorkspace: { id: 'test-workspace-id' },
    }),
}));

vi.mock('@/hooks/use-toast', () => ({
    useToast: () => ({
        toast: vi.fn(),
    }),
}));

describe('useDecisionMemory', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('createDecision calls supabase insert with correct data', async () => {
        const queryClient = new QueryClient();
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        );

        const { result } = renderHook(() => useDecisionMemory(), { wrapper });

        const payload = {
            decision_type: 'ai_chat' as const,
            input_context: { foo: 'bar' },
            expected_outcome: 'success',
            human_action: 'accepted' as const,
            ai_confidence_score: 0.9,
            ai_confidence_level: 'high'
        };

        // @ts-ignore
        await result.current.createDecision.mutateAsync(payload);

        expect(supabase.from).toHaveBeenCalledWith('decision_memory');
        const chain = (supabase.from as any).mock.results[0].value;
        expect(chain.insert).toHaveBeenCalledWith(expect.objectContaining({
            ...payload,
            user_id: 'test-user-id',
            workspace_id: 'test-workspace-id',
            outcome_status: 'pending'
        }));
    });
});
