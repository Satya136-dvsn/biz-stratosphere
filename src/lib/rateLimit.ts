// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { supabase } from '@/integrations/supabase/client'
import { addDays, isAfter } from 'date-fns'

export type LimitType = 'upload' | 'ai_query'

export interface RateLimitResult {
    allowed: boolean
    limit: number
    current: number
    remaining: number
    resetAt: Date
}

// Rate limit configurations
const RATE_LIMITS = {
    upload: {
        limit: 10,
        windowHours: 24,
    },
    ai_query: {
        limit: 1000,
        windowHours: 24,
    },
} as const

/**
 * Check if user has exceeded their rate limit
 * @param userId - User ID from auth
 * @param limitType - Type of operation being rate limited
 * @returns Result indicating if request is allowed
 */
export async function checkRateLimit(
    userId: string,
    limitType: LimitType
): Promise<RateLimitResult> {
    const config = RATE_LIMITS[limitType]
    const now = new Date()

    try {
        // Get current active rate limit window for this user and type
        const { data: existingLimit, error: fetchError } = await supabase
            .from('rate_limits')
            .select('*')
            .eq('user_id', userId)
            .eq('limit_type', limitType)
            .gte('window_end', now.toISOString())
            .order('window_end', { ascending: false })
            .limit(1)
            .maybeSingle()

        if (fetchError) throw fetchError

        // If no active window exists or window has expired, create new one
        if (!existingLimit || isAfter(now, new Date(existingLimit.window_end))) {
            const windowEnd = addDays(now, 1)

            const { data: newLimit, error: insertError } = await supabase
                .from('rate_limits')
                .insert({
                    user_id: userId,
                    limit_type: limitType,
                    count: 1,
                    window_start: now.toISOString(),
                    window_end: windowEnd.toISOString(),
                })
                .select()
                .single()

            if (insertError) throw insertError

            return {
                allowed: true,
                limit: config.limit,
                current: 1,
                remaining: config.limit - 1,
                resetAt: windowEnd,
            }
        }

        // Check if limit has been exceeded
        const currentCount = existingLimit.count
        const allowed = currentCount < config.limit

        if (allowed) {
            // Increment the counter
            const { error: updateError } = await supabase
                .from('rate_limits')
                .update({
                    count: currentCount + 1,
                    updated_at: now.toISOString(),
                })
                .eq('id', existingLimit.id)

            if (updateError) throw updateError
        }

        return {
            allowed,
            limit: config.limit,
            current: allowed ? currentCount + 1 : currentCount,
            remaining: Math.max(0, config.limit - (allowed ? currentCount + 1 : currentCount)),
            resetAt: new Date(existingLimit.window_end),
        }
    } catch (error) {
        console.error('Rate limit check error:', error)
        // On error, allow the request but log it
        return {
            allowed: true,
            limit: config.limit,
            current: 0,
            remaining: config.limit,
            resetAt: addDays(now, 1),
        }
    }
}

/**
 * Get current rate limit status without incrementing
 * @param userId - User ID from auth
 * @param limitType - Type of operation
 * @returns Current usage stats
 */
export async function getRateLimitStatus(
    userId: string,
    limitType: LimitType
): Promise<RateLimitResult> {
    const config = RATE_LIMITS[limitType]
    const now = new Date()

    try {
        const { data: existingLimit } = await supabase
            .from('rate_limits')
            .select('*')
            .eq('user_id', userId)
            .eq('limit_type', limitType)
            .gte('window_end', now.toISOString())
            .order('window_end', { ascending: false })
            .limit(1)
            .maybeSingle()

        if (!existingLimit) {
            return {
                allowed: true,
                limit: config.limit,
                current: 0,
                remaining: config.limit,
                resetAt: addDays(now, 1),
            }
        }

        return {
            allowed: existingLimit.count < config.limit,
            limit: config.limit,
            current: existingLimit.count,
            remaining: Math.max(0, config.limit - existingLimit.count),
            resetAt: new Date(existingLimit.window_end),
        }
    } catch (error) {
        console.error('Get rate limit status error:', error)
        return {
            allowed: true,
            limit: config.limit,
            current: 0,
            remaining: config.limit,
            resetAt: addDays(now, 1),
        }
    }
}

/**
 * Reset rate limit for a user (admin function)
 * @param userId - User ID
 * @param limitType - Type of limit to reset
 */
export async function resetRateLimit(
    userId: string,
    limitType: LimitType
): Promise<void> {
    await supabase
        .from('rate_limits')
        .delete()
        .eq('user_id', userId)
        .eq('limit_type', limitType)
}
