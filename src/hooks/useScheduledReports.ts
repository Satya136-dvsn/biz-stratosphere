// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export interface ScheduledReport {
    id: string;
    user_id: string;
    name: string;
    description: string | null;
    report_type: 'kpi_summary' | 'trend_analysis' | 'custom';
    schedule: 'daily' | 'weekly' | 'monthly';
    recipients: string[];
    enabled: boolean;
    last_run: string | null;
    next_run: string | null;
    created_at: string;
    updated_at: string;
}

export function useScheduledReports() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const { toast } = useToast();

    // Fetch all reports
    const { data: reports = [], isLoading } = useQuery({
        queryKey: ['scheduled-reports', user?.id],
        queryFn: async () => {
            if (!user) return [];

            const { data, error } = await supabase
                .from('scheduled_reports')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return (data || []) as ScheduledReport[];
        },
        enabled: !!user,
    });

    // Create report
    const createReport = useMutation({
        mutationFn: async (report: Partial<ScheduledReport>) => {
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('scheduled_reports')
                .insert({
                    user_id: user.id,
                    ...report,
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['scheduled-reports'] });
            toast({
                title: 'Report Created',
                description: 'Your scheduled report has been created successfully.',
            });
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to create report',
                variant: 'destructive',
            });
        },
    });

    // Update report
    const updateReport = useMutation({
        mutationFn: async ({ reportId, updates }: { reportId: string; updates: Partial<ScheduledReport> }) => {
            const { error } = await supabase
                .from('scheduled_reports')
                .update(updates)
                .eq('id', reportId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['scheduled-reports'] });
            toast({
                title: 'Report Updated',
                description: 'Your scheduled report has been updated.',
            });
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to update report',
                variant: 'destructive',
            });
        },
    });

    // Toggle report
    const toggleReport = useMutation({
        mutationFn: async ({ reportId, enabled }: { reportId: string; enabled: boolean }) => {
            const { error } = await supabase
                .from('scheduled_reports')
                .update({ enabled })
                .eq('id', reportId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['scheduled-reports'] });
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to toggle report',
                variant: 'destructive',
            });
        },
    });

    // Delete report
    const deleteReport = useMutation({
        mutationFn: async (reportId: string) => {
            const { error } = await supabase
                .from('scheduled_reports')
                .delete()
                .eq('id', reportId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['scheduled-reports'] });
            toast({
                title: 'Report Deleted',
                description: 'The scheduled report has been deleted.',
            });
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to delete report',
                variant: 'destructive',
            });
        },
    });

    // Run report now (manual trigger)
    const runReportNow = useMutation({
        mutationFn: async (reportId: string) => {
            const { data, error } = await supabase.functions.invoke('scheduled-reports', {
                body: { reportId }
            });

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            toast({
                title: 'Report Generated',
                description: 'Your report has been generated and will be sent shortly.',
            });
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to run report',
                variant: 'destructive',
            });
        },
    });

    return {
        reports,
        isLoading,
        createReport: createReport.mutate,
        updateReport: updateReport.mutate,
        toggleReport: toggleReport.mutate,
        deleteReport: deleteReport.mutate,
        runReportNow: runReportNow.mutate,
        isCreating: createReport.isPending,
        isUpdating: updateReport.isPending,
        isDeleting: deleteReport.isPending,
        isRunning: runReportNow.isPending,
    };
}
