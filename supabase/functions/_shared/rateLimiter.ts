// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

/**
 * Simple Database-backed Rate Limiter
 * 
 * Rules:
 * - 100 requests per hour per user.
 * 
 * Implementation:
 * - Insert into `request_logs` (or similar) and count.
 * - OR maintain a `rate_limits` table: { user_id, window_start, count }
 */

export async function checkRateLimit(
    supabase: SupabaseClient,
    userId: string,
    endpoint: string,
    limit: number = 100,
    windowSeconds: number = 3600
): Promise<{ allowed: boolean; remaining: number }> {

    const { data, error } = await supabase.rpc('increment_api_usage', {
        p_user_id: userId,
        p_endpoint: endpoint,
        p_window_seconds: windowSeconds,
        p_limit: limit
    });

    if (error) {
        console.error('Rate limit check failed (fail active)', error);
        return { allowed: true, remaining: 1 }; // Fail open
    }

    return {
        allowed: data.allowed,
        remaining: data.remaining
    };
}

/**
 * Token Bucket implementation (In-Memory per Edge Function Isolate - Ephemeral)
 * Not reliable for distributed/cold-start, but good for local burst protection.
 */
const tokens = new Map<string, { count: number, lastRefill: number }>();

export function checkEphemeralRateLimit(ipOrUser: string, limit: number, refillRatePerSecond: number) {
    const now = Date.now();
    let bucket = tokens.get(ipOrUser);

    if (!bucket) {
        bucket = { count: limit, lastRefill: now };
        tokens.set(ipOrUser, bucket);
    }

    const elapsed = (now - bucket.lastRefill) / 1000;
    const refill = Math.floor(elapsed * refillRatePerSecond);

    if (refill > 0) {
        bucket.count = Math.min(limit, bucket.count + refill);
        bucket.lastRefill = now;
    }

    if (bucket.count > 0) {
        bucket.count--;
        return true;
    }

    return false;
}
