/**
 * Audit Logging Hook
 * Track user actions for security and compliance
 */

import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface AuditLog {
    id: string;
    user_id: string;
    workspace_id?: string;
    action: string;
    resource_type: string;
    resource_id?: string;
    ip_address?: string;
    user_agent?: string;
    metadata?: Record<string, any>;
    created_at: string;
}

export interface CreateAuditLogParams {
    action: string;
    resource_type: string;
    resource_id?: string;
    workspace_id?: string;
    metadata?: Record<string, any>;
}

export function useAuditLogs(workspaceId?: string) {
    const { user } = useAuth();

    // Fetch audit logs
    const { data: auditLogs = [], isLoading } = useQuery({
        queryKey: ['audit-logs', user?.id, workspaceId],
        queryFn: async () => {
            let query = supabase
                .from('audit_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100);

            if (workspaceId) {
                query = query.eq('workspace_id', workspaceId);
            } else {
                query = query.eq('user_id', user?.id);
            }

            const { data, error } = await query;

            if (error) throw error;
            return data as AuditLog[];
        },
        enabled: !!user,
    });

    // Create audit log
    const createAuditLog = useMutation({
        mutationFn: async (params: CreateAuditLogParams) => {
            // Get client info
            const ipAddress = await fetch('https://api.ipify.org?format=json')
                .then(res => res.json())
                .then(data => data.ip)
                .catch(() => 'unknown');

            const { data, error } = await supabase
                .from('audit_logs')
                .insert({
                    user_id: user?.id,
                    workspace_id: params.workspace_id,
                    action: params.action,
                    resource_type: params.resource_type,
                    resource_id: params.resource_id,
                    ip_address: ipAddress,
                    user_agent: navigator.userAgent,
                    metadata: params.metadata || {},
                })
                .select()
                .single();

            if (error) throw error;
            return data as AuditLog;
        },
    });

    // Helper function to log common actions
    const logAction = {
        dataUpload: (datasetId: string, metadata?: Record<string, any>) =>
            createAuditLog.mutate({
                action: 'data_upload',
                resource_type: 'dataset',
                resource_id: datasetId,
                metadata,
            }),

        dataDelete: (datasetId: string) =>
            createAuditLog.mutate({
                action: 'data_delete',
                resource_type: 'dataset',
                resource_id: datasetId,
            }),

        chartCreation: (chartId: string, chartType: string) =>
            createAuditLog.mutate({
                action: 'chart_created',
                resource_type: 'chart',
                resource_id: chartId,
                metadata: { chart_type: chartType },
            }),

        reportGeneration: (reportId: string, reportType: string) =>
            createAuditLog.mutate({
                action: 'report_generated',
                resource_type: 'report',
                resource_id: reportId,
                metadata: { report_type: reportType },
            }),

        apiKeyCreated: (keyId: string) =>
            createAuditLog.mutate({
                action: 'api_key_created',
                resource_type: 'api_key',
                resource_id: keyId,
            }),

        apiKeyRevoked: (keyId: string) =>
            createAuditLog.mutate({
                action: 'api_key_revoked',
                resource_type: 'api_key',
                resource_id: keyId,
            }),

        settingsChanged: (setting: string, oldValue: any, newValue: any) =>
            createAuditLog.mutate({
                action: 'settings_changed',
                resource_type: 'settings',
                metadata: { setting, old_value: oldValue, new_value: newValue },
            }),

        workspaceMemberAdded: (workspaceId: string, memberId: string, role: string) =>
            createAuditLog.mutate({
                action: 'member_added',
                resource_type: 'workspace',
                resource_id: workspaceId,
                workspace_id: workspaceId,
                metadata: { member_id: memberId, role },
            }),

        loginSuccess: () =>
            createAuditLog.mutate({
                action: 'login_success',
                resource_type: 'auth',
            }),

        loginFailure: (reason: string) =>
            createAuditLog.mutate({
                action: 'login_failure',
                resource_type: 'auth',
                metadata: { reason },
            }),

        passwordChanged: () =>
            createAuditLog.mutate({
                action: 'password_changed',
                resource_type: 'auth',
            }),

        twoFactorEnabled: () =>
            createAuditLog.mutate({
                action: '2fa_enabled',
                resource_type: 'auth',
            }),

        twoFactorDisabled: () =>
            createAuditLog.mutate({
                action: '2fa_disabled',
                resource_type: 'auth',
            }),
    };

    return {
        auditLogs,
        isLoading,
        createAuditLog,
        logAction,
    };
}
