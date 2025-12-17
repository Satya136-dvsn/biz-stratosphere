import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface CacheMetric {
    date: string;
    total_embeddings: number;
    total_accesses: number;
    avg_access_count: number;
    cache_hits: number;
    cache_entries: number;
    cache_hit_rate_percent: number;
    workspace_id?: string;
}

export interface UsageMetric {
    tier: string;
    user_count: number;
    avg_daily_messages: number;
    avg_monthly_messages: number;
    max_daily_usage: number;
    max_monthly_usage: number;
    total_daily_messages: number;
    total_monthly_messages: number;
    users_at_daily_limit: number;
    users_at_monthly_limit: number;
}

export interface ConversationMetric {
    date: string;
    total_conversations: number;
    total_messages: number;
    avg_context_window: number;
    avg_temperature: number;
    avg_max_tokens: number;
    unique_users: number;
}

export interface MessageMetric {
    date: string;
    role: string;
    message_count: number;
    avg_message_length: number;
    max_message_length: number;
}

export interface AnalyticsSummary {
    metric_name: string;
    metric_value: number;
    metric_unit: string;
}

/**
 * Hook for AI Chat analytics and monitoring
 */
export function useAIAnalytics(days: number = 30) {
    const { user } = useAuth();

    // Refresh analytics views
    const refreshAnalytics = async () => {
        const { error } = await supabase.rpc('refresh_ai_analytics');
        if (error) console.warn('Analytics refresh failed:', error);
    };

    // Cache metrics
    const { data: cacheMetrics, isLoading: cacheLoading, refetch: refetchCache } = useQuery({
        queryKey: ['ai-cache-metrics', days],
        queryFn: async () => {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);

            const { data, error } = await supabase
                .from('ai_cache_analytics')
                .select('*')
                .gte('date', cutoffDate.toISOString().split('T')[0])
                .order('date', { ascending: true });

            if (error) throw error;
            return data as CacheMetric[];
        },
        enabled: !!user,
    });

    // Usage metrics
    const { data: usageMetrics, isLoading: usageLoading, refetch: refetchUsage } = useQuery({
        queryKey: ['ai-usage-metrics'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('ai_usage_analytics')
                .select('*');

            if (error) throw error;
            return data as UsageMetric[];
        },
        enabled: !!user,
    });

    // Conversation metrics
    const { data: conversationMetrics, isLoading: conversationLoading, refetch: refetchConversations } = useQuery({
        queryKey: ['ai-conversation-metrics', days],
        queryFn: async () => {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);

            const { data, error } = await supabase
                .from('conversation_analytics')
                .select('*')
                .gte('date', cutoffDate.toISOString().split('T')[0])
                .order('date', { ascending: true });

            if (error) throw error;
            return data as ConversationMetric[];
        },
        enabled: !!user,
    });

    // Message metrics
    const { data: messageMetrics, isLoading: messageLoading, refetch: refetchMessages } = useQuery({
        queryKey: ['ai-message-metrics', days],
        queryFn: async () => {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);

            const { data, error } = await supabase
                .from('message_analytics')
                .select('*')
                .gte('date', cutoffDate.toISOString().split('T')[0])
                .order('date', { ascending: true });

            if (error) throw error;
            return data as MessageMetric[];
        },
        enabled: !!user,
    });

    // Summary metrics
    const { data: summary, isLoading: summaryLoading, refetch: refetchSummary } = useQuery({
        queryKey: ['ai-analytics-summary'],
        queryFn: async () => {
            const { data, error } = await supabase.rpc('get_ai_analytics_summary');
            if (error) throw error;
            return data as AnalyticsSummary[];
        },
        enabled: !!user,
    });

    // Calculated totals
    const totals = {
        totalCacheHits: cacheMetrics?.reduce((sum, m) => sum + m.cache_hits, 0) || 0,
        totalCacheEntries: cacheMetrics?.reduce((sum, m) => sum + m.cache_entries, 0) || 0,
        avgCacheHitRate: cacheMetrics?.length
            ? cacheMetrics.reduce((sum, m) => sum + m.cache_hit_rate_percent, 0) / cacheMetrics.length
            : 0,
        totalConversations: conversationMetrics?.reduce((sum, m) => sum + m.total_conversations, 0) || 0,
        totalMessages: conversationMetrics?.reduce((sum, m) => sum + m.total_messages, 0) || 0,
        totalUsers: usageMetrics?.reduce((sum, m) => sum + m.user_count, 0) || 0,
    };

    // Refresh all analytics
    const refreshAll = async () => {
        await refreshAnalytics();
        await Promise.all([
            refetchCache(),
            refetchUsage(),
            refetchConversations(),
            refetchMessages(),
            refetchSummary(),
        ]);
    };

    return {
        cacheMetrics,
        usageMetrics,
        conversationMetrics,
        messageMetrics,
        summary,
        totals,
        isLoading: cacheLoading || usageLoading || conversationLoading || messageLoading || summaryLoading,
        refreshAll,
    };
}
