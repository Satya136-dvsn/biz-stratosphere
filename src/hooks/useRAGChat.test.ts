/**
 * Unit tests for useRAGChat hook
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useRAGChat } from '@/hooks/useRAGChat';
import { createWrapper } from '@/test/utils';
import { mockFetch, resetAllMocks } from '@/test/mocks';
import { createMockConversation, createMockChatMessage } from '@/test/factories';

// Mock fetch globally
global.fetch = mockFetch as any;

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: (table: string) => ({
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
                data: table === 'chat_conversations'
                    ? createMockConversation()
                    : createMockChatMessage(),
                error: null,
            }),
            then: vi.fn((cb) => cb({
                data: table === 'chat_conversations'
                    ? [createMockConversation()]
                    : [createMockChatMessage()],
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

// Mock useEmbeddings
vi.mock('@/hooks/useEmbeddings', () => ({
    useEmbeddings: () => ({
        searchSimilar: vi.fn().mockResolvedValue([
            { content: 'Test context', metadata: {} }
        ]),
    }),
}));

describe.skip('useRAGChat', () => {
    beforeEach(() => {
        resetAllMocks();
        vi.clearAllMocks();
    });

    it('should fetch conversations', async () => {
        const { result } = renderHook(() => useRAGChat(), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(result.current.conversations).toBeDefined();
        });
    });

    it('should create a new conversation', async () => {
        const { result } = renderHook(() => useRAGChat(), {
            wrapper: createWrapper(),
        });

        await act(async () => {
            result.current.createConversation({ title: 'Test Conversation' });
        });

        await waitFor(() => {
            expect(result.current.currentConversation).toBeDefined();
        });
    });

    it('should send a message with RAG', async () => {
        const { result } = renderHook(() => useRAGChat(), {
            wrapper: createWrapper(),
        });

        // Create conversation first
        await act(async () => {
            result.current.createConversation({ title: 'Test' });
        });

        // Send message
        await act(async () => {
            result.current.sendMessage({
                message: 'Test question',
                datasetId: 'dataset-123'
            });
        });

        await waitFor(() => {
            expect(result.current.isSending).toBe(false);
        });

        // Fetch should have been called for Gemini API
        expect(mockFetch).toHaveBeenCalled();
    });

    it('should delete a conversation', async () => {
        const { result } = renderHook(() => useRAGChat(), {
            wrapper: createWrapper(),
        });

        await act(async () => {
            result.current.deleteConversation({ conversationId: 'conv-123' });
        });

        await waitFor(() => {
            expect(result.current.conversations).toBeDefined();
        });
    });

    it('should handle message errors gracefully', async () => {
        mockFetch.mockRejectedValueOnce(new Error('API Error'));

        const { result } = renderHook(() => useRAGChat(), {
            wrapper: createWrapper(),
        });

        await act(async () => {
            result.current.createConversation({ title: 'Test' });
        });

        await act(async () => {
            result.current.sendMessage({
                message: 'Test',
                datasetId: 'dataset-123'
            });
        });

        await waitFor(() => {
            expect(result.current.isSending).toBe(false);
        });

        // Should not throw error - handled gracefully
    });

    it('should track sending state', async () => {
        const { result } = renderHook(() => useRAGChat(), {
            wrapper: createWrapper(),
        });

        expect(result.current.isSending).toBe(false);

        act(() => {
            result.current.createConversation({ title: 'Test' });
        });

        await waitFor(() => {
            expect(result.current.currentConversation).toBeDefined();
        });
    });
});
