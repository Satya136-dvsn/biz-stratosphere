// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.


import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type AuditLogEntry = {
    id: string;
    created_at: string;
    action: string;
    resource_type: string;
    resource_id: string;
    ip_address: string | null;
    metadata: any;
    actor_email: string | null;
    actor_id: string;
};

export function useAdminAudit(page = 1, actionFilter = '', userFilter = '') {
    const { data: logs, isLoading, error } = useQuery({
        queryKey: ['admin-audit', page, actionFilter, userFilter],
        queryFn: async () => {
            const { data, error } = await supabase.rpc('get_admin_audit_logs', {
                page,
                page_size: 50,
                action_filter: actionFilter || null,
                user_filter: userFilter || null
            });
            if (error) throw error;
            return data as AuditLogEntry[];
        },
        keepPreviousData: true,
    });

    return {
        logs: (logs || []) as AuditLogEntry[],
        isLoading,
        error,
    };
}
