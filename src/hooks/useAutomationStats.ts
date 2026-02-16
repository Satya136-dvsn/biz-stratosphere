// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface RuleStats {
    rule_id: string;
    rule_name: string;
    schedule_type: string;
    enabled: boolean;
    last_run_at: string | null;
    next_run_at: string | null;
    total_executions: number;
    successful_executions: number;
    failed_executions: number;
    skipped_executions: number;
    last_execution_time: string | null;
    total_notifications: number;
    sent_notifications: number;
    failed_notifications: number;
}

/**
 * Hook to get automation rule statistics
 */
export function useAutomationStats(ruleId?: string) {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['automation-stats', user?.id, ruleId],
        queryFn: async () => {
            if (!user) return [];

            let query = supabase
                .from('automation_rule_stats')
                .select('*');

            if (ruleId) {
                query = query.eq('rule_id', ruleId);
            }

            const { data, error } = await query;
            if (error) throw error;
            return (data || []) as RuleStats[];
        },
        enabled: !!user,
    });
}

/**
 * Calculate success rate for a rule
 */
export function calculateSuccessRate(stats: RuleStats): number {
    if (stats.total_executions === 0) return 0;
    return Math.round((stats.successful_executions / stats.total_executions) * 100);
}

/**
 * Get next run time in human-readable format
 */
export function getNextRunDisplay(nextRunAt: string | null): string {
    if (!nextRunAt) return 'Not scheduled';

    const next = new Date(nextRunAt);
    const now = new Date();
    const diff = next.getTime() - now.getTime();

    if (diff < 0) return 'Overdue';

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `In ${days} day${days > 1 ? 's' : ''}`;
    if (hours > 0) return `In ${hours} hour${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `In ${minutes} minute${minutes > 1 ? 's' : ''}`;
    return 'Very soon';
}
