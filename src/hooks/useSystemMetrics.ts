// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface SystemMetrics {
    activeUsers: number;
    apiResponseTime: number;
    errorRate: number;
    uptime: number;
    totalRequests: number;
    dataSetsCount: number;
    lastDataUpload: string | null;
}

export function useSystemMetrics() {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['system-metrics', user?.id],
        queryFn: async () => {
            if (!user) return null;

            // Get datasets count
            const { count: datasetsCount } = await supabase
                .from('datasets')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id);

            // Get last upload time
            const { data: lastUpload } = await supabase
                .from('datasets')
                .select('created_at')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            // Get total data points (as proxy for requests)
            const { count: dataPointsCount } = await supabase
                .from('data_points')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id);

            // Get error logs count (if we had an error logs table)
            // For now, use a simulated low error rate
            const errorRate = 0.01; // 1% simulated

            // Calculate uptime (simulated as we don't have downtime tracking)
            const uptime = 99.95;

            // Simulate API response time based on recent activity
            const apiResponseTime = 150 + Math.random() * 100; // 150-250ms

            // Active users (for now, just count as 1 since it's single user)
            const activeUsers = 1;

            const metrics: SystemMetrics = {
                activeUsers,
                apiResponseTime: Math.round(apiResponseTime),
                errorRate,
                uptime,
                totalRequests: dataPointsCount || 0,
                dataSetsCount: datasetsCount || 0,
                lastDataUpload: lastUpload?.created_at || null,
            };

            return metrics;
        },
        enabled: !!user,
        refetchInterval: 30000, // Refetch every 30 seconds
    });
}
