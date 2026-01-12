/**
 * Unit tests for useDataUpload hook
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useDataUpload } from '@/hooks/useDataUpload';
import { createWrapper } from '@/test/utils';

describe('useDataUpload', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should initialize with correct return structure', () => {
        const { result } = renderHook(() => useDataUpload(), {
            wrapper: createWrapper(),
        });

        expect(result.current).toHaveProperty('processFile');
        expect(result.current).toHaveProperty('validateAndTransformData');
        expect(result.current).toHaveProperty('uploadData');
        expect(result.current).toHaveProperty('isUploading');
        expect(result.current).toHaveProperty('progress');
    });

    it('should have upload function', () => {
        const { result } = renderHook(() => useDataUpload(), {
            wrapper: createWrapper(),
        });

        expect(typeof result.current.uploadData).toBe('function');
    });

    it('should track upload state', () => {
        const { result } = renderHook(() => useDataUpload(), {
            wrapper: createWrapper(),
        });

        expect(result.current.isUploading).toBe(false);
    });

    it('should have progress initialized to 0', () => {
        const { result } = renderHook(() => useDataUpload(), {
            wrapper: createWrapper(),
        });

        expect(result.current.progress).toBe(0);
    });
});
