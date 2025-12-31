
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAIConversation } from '../useAIConversation';

// Mock Orchestrator
vi.mock('@/lib/ai/orchestrator', () => ({
    aiOrchestrator: {
        generateResponse: vi.fn(),
        searchSimilarContent: vi.fn() // if needed
    }
}));

// Mock Supabase
const mockSupabase = {
    auth: { getUser: () => Promise.resolve({ data: { user: { id: 'test-user' } } }) },
    from: () => ({
        select: () => ({ order: () => ({ limit: () => Promise.resolve({ data: [] }) }) }),
        insert: () => Promise.resolve({ error: null })
    })
};
vi.mock('@/integrations/supabase/client', () => ({ supabase: mockSupabase }));

// Import mocked module to manipulate it
import { aiOrchestrator } from '@/lib/ai/orchestrator';

describe('useAIConversation Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should add user message and call orchestrator', async () => {
        (aiOrchestrator.generateResponse as any).mockResolvedValue({
            role: 'assistant',
            content: 'AI Reply'
        });

        const { result } = renderHook(() => useAIConversation());

        await act(async () => {
            await result.current.sendMessage.mutateAsync({ content: 'Hello AI', role: 'user' });
        });

        // Check optimistic update or final state
        // Since mutation is async, we expect messages to update
        expect(aiOrchestrator.generateResponse).toHaveBeenCalled();
        expect(result.current.messages).toHaveLength(2); // User + AI
        expect(result.current.messages[1].content).toBe('AI Reply');
    });

    it('should handle errors gracefully', async () => {
        (aiOrchestrator.generateResponse as any).mockRejectedValue(new Error('AI Error'));

        const { result } = renderHook(() => useAIConversation());

        await act(async () => {
            try {
                await result.current.sendMessage.mutateAsync({ content: 'Fail me', role: 'user' });
            } catch (e) {
                // error caught
            }
        });

        // Should ideally show error state or toast (not testing UI here, just logic)
        expect(aiOrchestrator.generateResponse).toHaveBeenCalled();
    });
});
