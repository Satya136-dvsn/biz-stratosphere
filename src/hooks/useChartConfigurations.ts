// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { ChartType } from '@/components/dashboard/ChartTypeSelector';
import { ChartCustomization } from '@/components/charts/ChartCustomizer';
import { ChartFiltersState } from '@/components/charts/ChartFilters';

export interface ChartConfiguration {
    id: string;
    user_id: string;
    name: string;
    chart_type: ChartType;
    dataset_id?: string;
    x_column?: string;
    y_column?: string;
    filters: ChartFiltersState;
    customization: ChartCustomization;
    created_at: string;
    updated_at: string;
}

export function useChartConfigurations() {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Fetch all saved configurations
    const { data: configurations = [], isLoading } = useQuery({
        queryKey: ['chart-configurations', user?.id],
        queryFn: async () => {
            if (!user) return [];

            const { data, error } = await supabase
                .from('chart_configurations')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as ChartConfiguration[];
        },
        enabled: !!user,
    });

    // Save new configuration
    const saveConfiguration = useMutation({
        mutationFn: async (config: Omit<ChartConfiguration, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('chart_configurations')
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
            queryClient.invalidateQueries({ queryKey: ['chart-configurations'] });
            toast({
                title: 'Success',
                description: 'Chart configuration saved successfully',
            });
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: `Failed to save configuration: ${error.message}`,
                variant: 'destructive',
            });
        },
    });

    // Update existing configuration
    const updateConfiguration = useMutation({
        mutationFn: async ({ id, ...updates }: Partial<ChartConfiguration> & { id: string }) => {
            const { data, error } = await supabase
                .from('chart_configurations')
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
            queryClient.invalidateQueries({ queryKey: ['chart-configurations'] });
            toast({
                title: 'Success',
                description: 'Chart configuration updated successfully',
            });
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: `Failed to update configuration: ${error.message}`,
                variant: 'destructive',
            });
        },
    });

    // Delete configuration
    const deleteConfiguration = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('chart_configurations')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['chart-configurations'] });
            toast({
                title: 'Success',
                description: 'Chart configuration deleted successfully',
            });
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: `Failed to delete configuration: ${error.message}`,
                variant: 'destructive',
            });
        },
    });

    return {
        configurations,
        isLoading,
        saveConfiguration: saveConfiguration.mutate,
        updateConfiguration: updateConfiguration.mutate,
        deleteConfiguration: deleteConfiguration.mutate,
        isSaving: saveConfiguration.isPending,
        isUpdating: updateConfiguration.isPending,
        isDeleting: deleteConfiguration.isPending,
    };
}

// Export chart utilities
export async function exportChartAsImage(chartElement: HTMLElement, filename: string) {
    try {
        const { default: html2canvas } = await import('html2canvas');
        const canvas = await html2canvas(chartElement);
        const image = canvas.toDataURL('image/png');

        const link = document.createElement('a');
        link.download = `${filename}.png`;
        link.href = image;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error('Error exporting chart:', error);
        throw error;
    }
}

export function exportDataAsCSV(data: any[], filename: string) {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => JSON.stringify(row[header] ?? '')).join(','))
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
