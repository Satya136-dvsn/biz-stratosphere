/**
 * Unit tests for useReports hook
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useReports } from '@/hooks/useReports';
import { createWrapper } from '@/test/utils';

describe('useReports', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should initialize with correct return structure', () => {
        const { result } = renderHook(() => useReports(), {
            wrapper: createWrapper(),
        });

        expect(result.current).toHaveProperty('savedReports');
        expect(result.current).toHaveProperty('isLoading');
        expect(result.current).toHaveProperty('generateReport');
        expect(result.current).toHaveProperty('saveReport');
        expect(result.current).toHaveProperty('updateReport');
        expect(result.current).toHaveProperty('deleteReport');
        expect(result.current).toHaveProperty('isSaving');
        expect(result.current).toHaveProperty('isUpdating');
        expect(result.current).toHaveProperty('isDeleting');
    });

    it('should have savedReports as an array', async () => {
        const { result } = renderHook(() => useReports(), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(Array.isArray(result.current.savedReports)).toBe(true);
    });

    it('should have mutation functions', () => {
        const { result } = renderHook(() => useReports(), {
            wrapper: createWrapper(),
        });

        expect(typeof result.current.generateReport).toBe('function');
        expect(typeof result.current.saveReport).toBe('function');
        expect(typeof result.current.updateReport).toBe('function');
        expect(typeof result.current.deleteReport).toBe('function');
    });

    it('should track mutation states', () => {
        const { result } = renderHook(() => useReports(), {
            wrapper: createWrapper(),
        });

        expect(result.current.isSaving).toBe(false);
        expect(result.current.isUpdating).toBe(false);
        expect(result.current.isDeleting).toBe(false);
    });
});
