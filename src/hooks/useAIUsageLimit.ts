// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface UsageLimit {
    user_id: string;
    daily_messages: number;
    daily_limit: number;
    monthly_messages: number;
    monthly_limit: number;
    last_reset_daily: string;
    last_reset_monthly: string;
    tier: 'free' | 'pro' | 'enterprise';
}

/**
 * Hook for managing AI chat usage limits and rate limiting
 */
export function useAIUsageLimit() {
    const { user } = useAuth();

    // Fetch user's current usage limits
    const { data: usageLimit, isLoading, refetch } = useQuery({
        queryKey: ['ai-usage-limits', user?.id],
        queryFn: async () => {
            if (!user) return null;

            // Check if limit exists
            const { data: existing } = await supabase
                .from('ai_usage_limits')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (existing) {
                // Check if daily reset needed
                const today = new Date().toISOString().split('T')[0];
                if (existing.last_reset_daily !== today) {
                    await supabase
                        .from('ai_usage_limits')
                        .update({
                            daily_messages: 0,
                            last_reset_daily: today
                        })
                        .eq('user_id', user.id);

                    // Refetch after reset
                    const { data: refreshed } = await supabase
                        .from('ai_usage_limits')
                        .select('*')
                        .eq('user_id', user.id)
                        .single();
                    return refreshed as UsageLimit;
                }

                return existing as UsageLimit;
            }

            // Create initial limit record
            const { data: newLimit, error } = await supabase
                .from('ai_usage_limits')
                .insert([{ user_id: user.id }])
                .select()
                .single();

            if (error) throw error;
            return newLimit as UsageLimit;
        },
        enabled: !!user,
        staleTime: 60000, // 1 minute
    });

    // Check if user can send message
    const checkLimit = async (): Promise<{ allowed: boolean; reason?: string }> => {
        if (!usageLimit) {
            return { allowed: false, reason: 'Usage limits not loaded' };
        }

        if (usageLimit.daily_messages >= usageLimit.daily_limit) {
            return {
                allowed: false,
                reason: `Daily limit reached (${usageLimit.daily_limit} messages). Resets tomorrow.`,
            };
        }

        if (usageLimit.monthly_messages >= usageLimit.monthly_limit) {
            return {
                allowed: false,
                reason: `Monthly limit reached (${usageLimit.monthly_limit} messages). Upgrade for more.`,
            };
        }

        return { allowed: true };
    };

    // Increment usage count
    const incrementUsage = useMutation({
        mutationFn: async () => {
            if (!user || !usageLimit) throw new Error('Not ready');

            const { error } = await supabase
                .from('ai_usage_limits')
                .update({
                    daily_messages: usageLimit.daily_messages + 1,
                    monthly_messages: usageLimit.monthly_messages + 1,
                })
                .eq('user_id', user.id);

            if (error) throw error;
        },
        onSuccess: () => {
            refetch();
        },
    });

    // Get usage stats
    const getUsageStats = () => {
        if (!usageLimit) return null;

        return {
            dailyUsed: usageLimit.daily_messages,
            dailyLimit: usageLimit.daily_limit,
            dailyRemaining: usageLimit.daily_limit - usageLimit.daily_messages,
            dailyPercentage: Math.round((usageLimit.daily_messages / usageLimit.daily_limit) * 100),

            monthlyUsed: usageLimit.monthly_messages,
            monthlyLimit: usageLimit.monthly_limit,
            monthlyRemaining: usageLimit.monthly_limit - usageLimit.monthly_messages,
            monthlyPercentage: Math.round((usageLimit.monthly_messages / usageLimit.monthly_limit) * 100),

            tier: usageLimit.tier,
        };
    };

    return {
        usageLimit,
        isLoading,
        checkLimit,
        incrementUsage: incrementUsage.mutateAsync,
        getUsageStats,
        refetch,
    };
}
