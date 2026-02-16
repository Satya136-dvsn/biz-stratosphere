// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

/**
 * API mocks for testing
 */
import { vi } from 'vitest';

// Mock Gemini API
export const mockGeminiAPI = {
    embedContent: vi.fn().mockResolvedValue({
        embedding: {
            values: new Array(768).fill(0.1),
        },
    }),

    generateContent: vi.fn().mockResolvedValue({
        candidates: [{
            content: {
                parts: [{
                    text: 'This is a mock AI response from Gemini.',
                }],
            },
        }],
    }),
};

// Mock ML Service API
export const mockMLService = {
    predict: vi.fn().mockResolvedValue({
        prediction: 0,
        probability: 0.23,
        confidence: 0.77,
        model: 'churn_model',
    }),

    explain: vi.fn().mockResolvedValue({
        shap_values: {
            usage_frequency: 0.15,
            support_tickets: -0.08,
            tenure_months: 0.12,
        },
        base_value: 0.3,
        feature_names: ['usage_frequency', 'support_tickets', 'tenure_months'],
        top_features: ['usage_frequency', 'tenure_months'],
        prediction: 0,
    }),

    listModels: vi.fn().mockResolvedValue({
        models: [
            { name: 'churn_model', source: 'local' },
            { name: 'revenue_model', source: 'local' },
        ],
        count: 2,
    }),
};

// Mock Supabase client
export const createMockSupabase = () => ({
    from: vi.fn((table: string) => ({
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        then: vi.fn((cb) => cb({ data: [], error: null })),
    })),

    auth: {
        getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-123', email: 'test@example.com' } },
            error: null,
        }),
        signIn: vi.fn().mockResolvedValue({ data: {}, error: null }),
        signOut: vi.fn().mockResolvedValue({ error: null }),
    },

    storage: {
        from: vi.fn(() => ({
            upload: vi.fn().mockResolvedValue({ data: {}, error: null }),
            download: vi.fn().mockResolvedValue({ data: new Blob(), error: null }),
            remove: vi.fn().mockResolvedValue({ data: {}, error: null }),
        })),
    },

    rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
});

// Mock fetch for API calls
export const mockFetch = vi.fn((url: string, options?: any) => {
    // Gemini API
    if (url.includes('generativelanguage.googleapis.com')) {
        if (url.includes('embedContent')) {
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve({
                    embedding: { values: new Array(768).fill(0.1) },
                }),
            });
        }
        if (url.includes('generateContent')) {
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve({
                    candidates: [{
                        content: { parts: [{ text: 'Mock response' }] },
                    }],
                }),
            });
        }
    }

    // ML Service API
    if (url.includes('localhost:8000/ml')) {
        if (url.includes('/predict')) {
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve(mockMLService.predict()),
            });
        }
        if (url.includes('/explain')) {
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve(mockMLService.explain()),
            });
        }
        if (url.includes('/models')) {
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve(mockMLService.listModels()),
            });
        }
    }

    // Default mock response
    return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
    });
});

// Reset all mocks
export const resetAllMocks = () => {
    mockGeminiAPI.embedContent.mockClear();
    mockGeminiAPI.generateContent.mockClear();
    mockMLService.predict.mockClear();
    mockMLService.explain.mockClear();
    mockMLService.listModels.mockClear();
    mockFetch.mockClear();
};
