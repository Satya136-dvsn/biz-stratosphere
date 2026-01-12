/**
 * Unit tests for useRAGChat hook
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useRAGChat } from '@/hooks/useRAGChat';
import { createWrapper } from '@/test/utils';
import { mockFetch } from '@/test/mocks';

// Mock fetch globally
global.fetch = mockFetch as any;

describe('useRAGChat', () => {
    beforeEach(() => {
        mockFetch.mockClear();
        vi.clearAllMocks();
    });

    it('should initialize with correct return structure', () => {
        const { result } = renderHook(() => useRAGChat(), {
            wrapper: createWrapper(),
        });

        expect(result.current).toHaveProperty('conversations');
        expect(result.current).toHaveProperty('messages');
        expect(result.current).toHaveProperty('createConversation');
        expect(result.current).toHaveProperty('deleteConversation');
        expect(result.current).toHaveProperty('sendMessage');
        expect(result.current).toHaveProperty('isLoading');
        expect(result.current).toHaveProperty('isSending');
    });

    it('should have conversations as an array', async () => {
        const { result } = renderHook(() => useRAGChat(), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(Array.isArray(result.current.conversations)).toBe(true);
    });

    it('should have mutation functions', () => {
        const { result } = renderHook(() => useRAGChat(), {
            wrapper: createWrapper(),
        });

        expect(typeof result.current.createConversation).toBe('function');
        expect(typeof result.current.deleteConversation).toBe('function');
        expect(typeof result.current.sendMessage).toBe('function');
    });

    it('should track sending state', () => {
        const { result } = renderHook(() => useRAGChat(), {
            wrapper: createWrapper(),
        });

        expect(result.current.isSending).toBe(false);
    });
});
