/**
 * Unit tests for useEmbeddings hook
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useEmbeddings } from '@/hooks/useEmbeddings';
import { createWrapper } from '@/test/utils';
import { mockFetch, resetAllMocks } from '@/test/mocks';
import { createMockDataset, createMockDataPoint } from '@/test/factories';

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
            limit: vi.fn().mockResolvedValue({
                data: table === 'data_points'
                    ? [createMockDataPoint(), createMockDataPoint()]
                    : [],
                error: null,
            }),
        }),
    },
}));

// Mock useAuth
vi.mock('@/hooks/useAuth', () => ({
    useAuth: () => ({
        user: { id: 'user-123', email: 'test@example.com' },
    }),
}));

describe('useEmbeddings', () => {
    beforeEach(() => {
        resetAllMocks();
        vi.clearAllMocks();
    });

    it('should generate embeddings for a dataset', async () => {
        const { result } = renderHook(() => useEmbeddings(), {
            wrapper: createWrapper(),
        });

        expect(result.current.isGenerating).toBe(false);

        // Trigger embeddings generation
        await act(async () => {
            result.current.generateDatasetEmbeddings({ datasetId: 'dataset-123' });
        });

        // Should be generating
        await waitFor(() => {
            expect(result.current.isGenerating).toBe(true);
        });

        // Wait for completion
        await waitFor(() => {
            expect(result.current.isGenerating).toBe(false);
        }, { timeout: 3000 });

        // Fetch should have been called for Gemini API
        expect(mockFetch).toHaveBeenCalled();
    });

    it('should search for similar embeddings', async () => {
        const { result } = renderHook(() => useEmbeddings(), {
            wrapper: createWrapper(),
        });

        let searchResults: any;
        await act(async () => {
            searchResults = await result.current.searchSimilar('test query', 5);
        });

        expect(searchResults).toBeDefined();
        expect(Array.isArray(searchResults)).toBe(true);
    });

    it('should maintain embeddings count', async () => {
        const { result } = renderHook(() => useEmbeddings(), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(result.current.embeddingsCount).toBeDefined();
        });
    });

    it('should handle API errors gracefully', async () => {
        // Mock fetch to return error
        mockFetch.mockRejectedValueOnce(new Error('API Error'));

        const { result } = renderHook(() => useEmbeddings(), {
            wrapper: createWrapper(),
        });

        await act(async () => {
            result.current.generateDatasetEmbeddings({ datasetId: 'dataset-123' });
        });

        await waitFor(() => {
            expect(result.current.isGenerating).toBe(false);
        });

        // Should not throw error - handled gracefully
    });
});
