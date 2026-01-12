/**
 * Unit tests for useEmbeddings hook
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useEmbeddings } from '@/hooks/useEmbeddings';
import { createWrapper } from '@/test/utils';
import { mockFetch } from '@/test/mocks';

// Mock fetch globally
global.fetch = mockFetch as any;

describe('useEmbeddings', () => {
    beforeEach(() => {
        mockFetch.mockClear();
        vi.clearAllMocks();
    });

    it('should initialize with correct return structure', () => {
        const { result } = renderHook(() => useEmbeddings(), {
            wrapper: createWrapper(),
        });

        expect(result.current).toHaveProperty('generateDatasetEmbeddings');
        expect(result.current).toHaveProperty('searchSimilar');
        expect(result.current).toHaveProperty('isGenerating');
        expect(result.current).toHaveProperty('embeddingsCount');
    });

    it('should have generator function', () => {
        const { result } = renderHook(() => useEmbeddings(), {
            wrapper: createWrapper(),
        });

        expect(typeof result.current.generateDatasetEmbeddings).toBe('function');
        expect(typeof result.current.searchSimilar).toBe('function');
    });

    it('should track generating state', () => {
        const { result } = renderHook(() => useEmbeddings(), {
            wrapper: createWrapper(),
        });

        expect(result.current.isGenerating).toBe(false);
    });
});
