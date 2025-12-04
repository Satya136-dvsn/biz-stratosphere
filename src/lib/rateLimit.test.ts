import { describe, it, expect, vi, beforeEach } from 'vitest'
import { checkRateLimit, getRateLimitStatus, type LimitType } from './rateLimit'
import { supabase } from '@/integrations/supabase/client'

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: vi.fn(),
    },
}))

describe('Rate Limiting', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('checkRateLimit', () => {
        it('allows first request and creates new window', async () => {
            // Mock no existing limit
            const mockFrom = vi.fn(() => ({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                gte: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                limit: vi.fn().mockReturnThis(),
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                insert: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({
                    data: {
                        id: '1',
                        user_id: 'test-user',
                        limit_type: 'upload',
                        count: 1,
                        window_end: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                    },
                    error: null,
                }),
            }))

            vi.mocked(supabase.from).mockImplementation(mockFrom as any)

            const result = await checkRateLimit('test-user', 'upload')

            expect(result.allowed).toBe(true)
            expect(result.current).toBe(1)
            expect(result.remaining).toBe(9) // 10 limit - 1 used
        })

        it('increments count for subsequent requests', async () => {
            const existingLimit = {
                id: '1',
                user_id: 'test-user',
                limit_type: 'upload',
                count: 5,
                window_end: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            }

            const mockFrom = vi.fn((table: string) => {
                if (table === 'rate_limits') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        gte: vi.fn().mockReturnThis(),
                        order: vi.fn().mockReturnThis(),
                        limit: vi.fn().mockReturnThis(),
                        maybeSingle: vi.fn().mockResolvedValue({ data: existingLimit, error: null }),
                        update: vi.fn().mockReturnThis(),
                    }
                }
                return {}
            })

            vi.mocked(supabase.from).mockImplementation(mockFrom as any)

            const result = await checkRateLimit('test-user', 'upload')

            expect(result.allowed).toBe(true)
            expect(result.current).toBe(6)
            expect(result.remaining).toBe(4)
        })

        it('denies request when limit exceeded', async () => {
            const existingLimit = {
                id: '1',
                user_id: 'test-user',
                limit_type: 'upload',
                count: 10, // At limit
                window_end: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            }

            const mockFrom = vi.fn(() => ({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                gte: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                limit: vi.fn().mockReturnThis(),
                maybeSingle: vi.fn().mockResolvedValue({ data: existingLimit, error: null }),
            }))

            vi.mocked(supabase.from).mockImplementation(mockFrom as any)

            const result = await checkRateLimit('test-user', 'upload')

            expect(result.allowed).toBe(false)
            expect(result.current).toBe(10)
            expect(result.remaining).toBe(0)
        })

        it('has different limits for different types', async () => {
            const mockFrom = vi.fn(() => ({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                gte: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                limit: vi.fn().mockReturnThis(),
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                insert: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({
                    data: {
                        id: '1',
                        count: 1,
                        window_end: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                    },
                    error: null,
                }),
            }))

            vi.mocked(supabase.from).mockImplementation(mockFrom as any)

            const uploadResult = await checkRateLimit('test-user', 'upload')
            expect(uploadResult.limit).toBe(10)

            const aiResult = await checkRateLimit('test-user', 'ai_query')
            expect(aiResult.limit).toBe(1000)
        })
    })

    describe('getRateLimitStatus', () => {
        it('returns current status without incrementing', async () => {
            const existingLimit = {
                count: 5,
                window_end: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            }

            const mockFrom = vi.fn(() => ({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                gte: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                limit: vi.fn().mockReturnThis(),
                maybeSingle: vi.fn().mockResolvedValue({ data: existingLimit, error: null }),
            }))

            vi.mocked(supabase.from).mockImplementation(mockFrom as any)

            const result = await getRateLimitStatus('test-user', 'upload')

            expect(result.current).toBe(5)
            expect(result.remaining).toBe(5)
        })

        it('returns zero usage when no limit exists', async () => {
            const mockFrom = vi.fn(() => ({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                gte: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                limit: vi.fn().mockReturnThis(),
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            }))

            vi.mocked(supabase.from).mockImplementation(mockFrom as any)

            const result = await getRateLimitStatus('test-user', 'upload')

            expect(result.current).toBe(0)
            expect(result.remaining).toBe(10)
        })
    })
})
