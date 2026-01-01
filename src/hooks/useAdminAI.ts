
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type MLModel = {
    id: string;
    name: string;
    version: string;
    type: string;
    is_active: boolean;
    accuracy: number;
    total_predictions: number;
    avg_confidence: number;
    last_used_at: string | null;
};

export function useAdminAI() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: models, isLoading, error } = useQuery({
        queryKey: ['admin-models'],
        queryFn: async () => {
            const { data, error } = await supabase.rpc('get_admin_models');
            if (error) throw error;
            return data as MLModel[];
        },
    });

    const toggleModelMutation = useMutation({
        mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
            const { error } = await supabase.rpc('admin_toggle_model', {
                target_model_id: id,
                active
            });
            if (error) throw error;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries(['admin-models']);
            toast({
                title: variables.active ? 'Model Activated' : 'Model Deactivated',
                description: `Model status has been updated.`
            });
        },
        onError: (err: any) => {
            toast({ title: 'Error', description: err.message, variant: 'destructive' });
        }
    });

    return {
        models: (models || []) as MLModel[],
        isLoading,
        error,
        toggleModel: toggleModelMutation.mutate,
    };
}
