// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { listModels } from '@/lib/modelExporter';

export interface ModelMetric {
    id: string;
    model_name: string;
    version: string;
    accuracy?: number;
    loss?: number;
    mae?: number;
    r2?: number;
    training_time_ms: number;
    dataset_size: number;
    created_at: string;
}

export function useAdvancedML() {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Fetch version history for a model
    const { data: metrics = [], isLoading: isLoadingMetrics } = useQuery({
        queryKey: ['ml-model-metrics', user?.id],
        queryFn: async () => {
            if (!user) return [];
            const { data, error } = await supabase
                .from('ml_model_metrics')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as ModelMetric[];
        },
        enabled: !!user,
    });

    // Save metrics after training
    const saveMetrics = useMutation({
        mutationFn: async (metric: Omit<ModelMetric, 'id' | 'created_at'>) => {
            if (!user) throw new Error('Not authenticated');
            const { data, error } = await supabase
                .from('ml_model_metrics')
                .insert({
                    ...metric,
                    user_id: user.id
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ml-model-metrics'] });
        },
    });

    // Get the next version string
    const getNextVersion = async (baseName: string): Promise<string> => {
        const models = await listModels();
        const versions = models
            .filter(name => name.startsWith(`${baseName}_v`))
            .map(name => {
                const parts = name.split('_v');
                return parts[parts.length - 1].replace(/_/g, '.');
            })
            .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));

        if (versions.length === 0) return '1.0.0';

        const lastVersion = versions[0];
        const [major, minor, patch] = lastVersion.split('.').map(Number);

        // Default to incrementing patch
        return `${major}.${minor}.${patch + 1}`;
    };

    return {
        metrics,
        isLoadingMetrics,
        saveMetrics: saveMetrics.mutateAsync,
        getNextVersion,
    };
}
