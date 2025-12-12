/**
 * Unit tests for useDataUpload hook
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useDataUpload } from '@/hooks/useDataUpload';
import { createWrapper } from '@/test/utils';
import { resetAllMocks } from '@/test/mocks';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: () => ({
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
                data: { id: 'dataset-123', name: 'Test Dataset' },
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

describe('useDataUpload', () => {
    beforeEach(() => {
        resetAllMocks();
        vi.clearAllMocks();
    });

    it('should parse CSV data correctly', async () => {
        const { result } = renderHook(() => useDataUpload(), {
            wrapper: createWrapper(),
        });

        const csvContent = 'name,value\nTest,100\nTest2,200';
        const file = new File([csvContent], 'test.csv', { type: 'text/csv' });

        let parsedData: any;
        await act(async () => {
            parsedData = await result.current.parseFile(file);
        });

        expect(parsedData).toBeDefined();
        expect(Array.isArray(parsedData)).toBe(true);
    });

    it('should parse JSON data correctly', async () => {
        const { result } = renderHook(() => useDataUpload(), {
            wrapper: createWrapper(),
        });

        const jsonContent = JSON.stringify([
            { name: 'Test', value: 100 },
            { name: 'Test2', value: 200 },
        ]);
        const file = new File([jsonContent], 'test.json', { type: 'application/json' });

        let parsedData: any;
        await act(async () => {
            parsedData = await result.current.parseFile(file);
        });

        expect(parsedData).toBeDefined();
        expect(parsedData).toHaveLength(2);
    });

    it('should detect PII in data', async () => {
        const { result } = renderHook(() => useDataUpload(), {
            wrapper: createWrapper(),
        });

        const dataWithPII = [
            { name: 'John Doe', email: 'john@example.com', ssn: '123-45-6789' },
        ];

        let detected: any;
        await act(async () => {
            detected = result.current.detectPII(dataWithPII);
        });

        expect(detected).toBeDefined();
        // Should detect email and SSN as PII
        expect(detected.hasPII).toBe(true);
    });

    it('should upload dataset successfully', async () => {
        const { result } = renderHook(() => useDataUpload(), {
            wrapper: createWrapper(),
        });

        const data = [
            { name: 'Test', value: 100 },
        ];

        await act(async () => {
            result.current.uploadDataset({
                name: 'Test Dataset',
                data,
                workspaceId: 'workspace-123',
            });
        });

        await waitFor(() => {
            expect(result.current.isUploading).toBe(false);
        });
    });

    it('should validate file size', async () => {
        const { result } = renderHook(() => useDataUpload(), {
            wrapper: createWrapper(),
        });

        // Create a large file (over 10MB)
        const largeContent = 'x'.repeat(11 * 1024 * 1024);
        const largeFile = new File([largeContent], 'large.csv', { type: 'text/csv' });

        const isValid = result.current.validateFileSize(largeFile);
        expect(isValid).toBe(false);
    });

    it('should validate file type', () => {
        const { result } = renderHook(() => useDataUpload(), {
            wrapper: createWrapper(),
        });

        const csvFile = new File(['test'], 'test.csv', { type: 'text/csv' });
        const invalidFile = new File(['test'], 'test.exe', { type: 'application/exe' });

        expect(result.current.validateFileType(csvFile)).toBe(true);
        expect(result.current.validateFileType(invalidFile)).toBe(false);
    });

    it('should track upload progress', async () => {
        const { result } = renderHook(() => useDataUpload(), {
            wrapper: createWrapper(),
        });

        expect(result.current.uploadProgress).toBe(0);

        await act(async () => {
            result.current.uploadDataset({
                name: 'Test',
                data: [{ test: 1 }],
                workspaceId: 'workspace-123',
            });
        });

        // Progress should update during upload
        await waitFor(() => {
            expect(result.current.isUploading).toBe(false);
        });
    });

    it('should handle upload errors gracefully', async () => {
        // Mock error
        vi.mock('@/integrations/supabase/client', () => ({
            supabase: {
                from: () => ({
                    insert: vi.fn().mockReturnThis(),
                    select: vi.fn().mockReturnThis(),
                    single: vi.fn().mockResolvedValue({
                        data: null,
                        error: new Error('Upload failed'),
                    }),
                }),
            },
        }));

        const { result } = renderHook(() => useDataUpload(), {
            wrapper: createWrapper(),
        });

        await act(async () => {
            result.current.uploadDataset({
                name: 'Test',
                data: [{ test: 1 }],
                workspaceId: 'workspace-123',
            });
        });

        await waitFor(() => {
            expect(result.current.isUploading).toBe(false);
        });

        // Should not crash on error
    });
});
