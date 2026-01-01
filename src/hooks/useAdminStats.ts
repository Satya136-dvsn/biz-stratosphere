
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AdminStats {
    total_users: number;
    total_workspaces: number;
    active_users_1h: number;
    api_requests_24h: number;
    predictions_24h: number;
    recent_errors_24h: number;
}

export interface DayCount {
    day: string;
    count: number;
}

export function useAdminStats() {
    const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
        queryKey: ['admin-stats'],
        queryFn: async () => {
            const { data, error } = await supabase.rpc('get_admin_stats');
            if (error) throw error;
            return data as AdminStats;
        },
        // Refetch every minute for dashboard
        refetchInterval: 60000,
    });

    const { data: signups, isLoading: signupsLoading } = useQuery({
        queryKey: ['admin-signups'],
        queryFn: async () => {
            const { data, error } = await supabase.rpc('get_daily_signups', { days_lookback: 30 });
            if (error) throw error;
            return data as DayCount[];
        },
        refetchInterval: 300000, // 5 mins
    });

    return {
        stats,
        signups,
        loading: statsLoading || signupsLoading,
        error: statsError,
    };
}
