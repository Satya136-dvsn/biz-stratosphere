/**
 * Test utilities and helpers
 */
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ReactNode } from 'react';

// Create a test query client with no retries
export const createTestQueryClient = () => new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
            cacheTime: 0,
        },
        mutations: {
            retry: false,
        },
    },
});

// Wrapper for components that need providers
export const createWrapper = (queryClient?: QueryClient) => {
    const client = queryClient || createTestQueryClient();

    return ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client= { client } >
        <BrowserRouter>
        { children }
        </BrowserRouter>
        </QueryClientProvider>
    );
};

// Render with all providers
export const renderWithProviders = (ui: ReactNode, options = {}) => {
    const queryClient = createTestQueryClient();

    return {
        ...render(ui, {
            wrapper: createWrapper(queryClient),
            ...options,
        }),
        queryClient,
    };
};

// Wait for specific time
export const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock console methods to avoid noise in tests
export const mockConsole = () => {
    const originalError = console.error;
    const originalWarn = console.warn;

    beforeAll(() => {
        console.error = vi.fn();
        console.warn = vi.fn();
    });

    afterAll(() => {
        console.error = originalError;
        console.warn = originalWarn;
    });
};

// Helper to test async errors
export const expectAsyncError = async (fn: () => Promise<any>, errorMessage?: string) => {
    try {
        await fn();
        throw new Error('Expected function to throw an error');
    } catch (error: any) {
        if (errorMessage) {
            expect(error.message).toContain(errorMessage);
        }
    }
};

// Helper to trigger file upload
export const createMockFile = (name: string, size: number, type: string): File => {
    const content = 'a'.repeat(size);
    return new File([content], name, { type });
};

// Helper to create CSV file content
export const createCSVContent = (headers: string[], rows: string[][]) => {
    const headerRow = headers.join(',');
    const dataRows = rows.map(row => row.join(',')).join('\n');
    return `${headerRow}\n${dataRows}`;
};

// Mock IntersectionObserver for components that use it
export const mockIntersectionObserver = () => {
    global.IntersectionObserver = class IntersectionObserver {
        constructor() { }
        disconnect() { }
        observe() { }
        takeRecords() { return []; }
        unobserve() { }
    } as any;
};

// Mock ResizeObserver for components that use it
export const mockResizeObserver = () => {
    global.ResizeObserver = class ResizeObserver {
        constructor() { }
        disconnect() { }
        observe() { }
        unobserve() { }
    } as any;
};
