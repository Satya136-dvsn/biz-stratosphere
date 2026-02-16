// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface ReportConfig {
    id?: string;
    user_id?: string;
    name: string;
    report_type: 'kpi_summary' | 'sales_report' | 'custom';
    date_range_start?: string;
    date_range_end?: string;
    selected_metrics: string[];
    selected_dimensions: string[];
    filters: Record<string, any>;
    dataset_id?: string;
    created_at?: string;
    updated_at?: string;
    last_generated_at?: string;
}

export interface GeneratedReport {
    config: ReportConfig;
    data: any[];
    summary: {
        total_records: number;
        date_range: string;
        generated_at: string;
    };
}

export function useReports() {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Fetch saved report configurations
    const { data: savedReports = [], isLoading } = useQuery({
        queryKey: ['report-configurations', user?.id],
        queryFn: async () => {
            if (!user) return [];

            const { data, error } = await supabase
                .from('report_configurations')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as ReportConfig[];
        },
        enabled: !!user,
    });

    // Generate report data
    const generateReport = async (config: ReportConfig): Promise<GeneratedReport> => {
        if (!user) throw new Error('Not authenticated');

        // Fetch data based on configuration
        let query = supabase
            .from('data_points')
            .select('*')
            .eq('user_id', user.id);

        // Apply dataset filter if specified
        if (config.dataset_id) {
            query = query.eq('dataset_id', config.dataset_id);
        }

        // Apply date range
        if (config.date_range_start) {
            query = query.gte('date_recorded', config.date_range_start);
        }
        if (config.date_range_end) {
            query = query.lte('date_recorded', config.date_range_end);
        }

        const { data, error } = await query.limit(1000);
        if (error) throw error;

        let processedData = data || [];

        // Apply metric filters
        if (config.selected_metrics.length > 0) {
            processedData = processedData.filter(point =>
                config.selected_metrics.includes(point.metric_name)
            );
        }

        // Apply custom filters
        Object.entries(config.filters).forEach(([key, value]) => {
            if (value) {
                processedData = processedData.filter(point => point[key] === value);
            }
        });

        return {
            config,
            data: processedData,
            summary: {
                total_records: processedData.length,
                date_range: `${config.date_range_start || 'All'} to ${config.date_range_end || 'Now'}`,
                generated_at: new Date().toISOString(),
            },
        };
    };

    // Save report configuration
    const saveReport = useMutation({
        mutationFn: async (config: ReportConfig) => {
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('report_configurations')
                .insert([{
                    ...config,
                    user_id: user.id,
                }])
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['report-configurations'] });
            toast({
                title: 'Success',
                description: 'Report configuration saved',
            });
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: `Failed to save: ${error.message}`,
                variant: 'destructive',
            });
        },
    });

    // Update saved report
    const updateReport = useMutation({
        mutationFn: async ({ id, ...updates }: Partial<ReportConfig> & { id: string }) => {
            const { data, error } = await supabase
                .from('report_configurations')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['report-configurations'] });
            toast({
                title: 'Success',
                description: 'Report configuration updated',
            });
        },
    });

    // Delete saved report
    const deleteReport = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('report_configurations')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['report-configurations'] });
            toast({
                title: 'Success',
                description: 'Report configuration deleted',
            });
        },
    });

    return {
        savedReports,
        isLoading,
        generateReport,
        saveReport: saveReport.mutate,
        updateReport: updateReport.mutate,
        deleteReport: deleteReport.mutate,
        isSaving: saveReport.isPending,
        isUpdating: updateReport.isPending,
        isDeleting: deleteReport.isPending,
    };
}

// Export utilities
export function exportReportAsCSV(data: any[], filename: string) {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `${filename}.csv`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

export function exportReportAsJSON(report: GeneratedReport, filename: string) {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `${filename}.json`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
