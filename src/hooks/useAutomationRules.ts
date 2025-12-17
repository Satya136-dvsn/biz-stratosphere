import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import type { AutomationRule } from '@/lib/automation';
import { runAutomationRule } from '@/lib/automation';

export function useAutomationRules() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const { toast } = useToast();

    // Fetch all rules
    const { data: rules = [], isLoading } = useQuery({
        queryKey: ['automation-rules', user?.id],
        queryFn: async () => {
            if (!user) return [];

            const { data, error } = await supabase
                .from('automation_rules')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return (data || []) as AutomationRule[];
        },
        enabled: !!user,
    });

    // Create rule
    const createRule = useMutation({
        mutationFn: async (rule: Partial<AutomationRule>) => {
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('automation_rules')
                .insert({
                    user_id: user.id,
                    ...rule,
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
        },
    });

    // Toggle rule
    const toggleRule = useMutation({
        mutationFn: async ({ ruleId, enabled }: { ruleId: string; enabled: boolean }) => {
            const { error } = await supabase
                .from('automation_rules')
                .update({ enabled })
                .eq('id', ruleId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
        },
    });

    // Delete rule
    const deleteRule = useMutation({
        mutationFn: async (ruleId: string) => {
            const { error } = await supabase
                .from('automation_rules')
                .delete()
                .eq('id', ruleId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
        },
    });

    // Run rule manually
    const runRule = useMutation({
        mutationFn: async (ruleId: string) => {
            await runAutomationRule(ruleId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['automation-logs'] });
            toast({
                title: 'Rule Executed',
                description: 'Check the execution logs below to see the result.',
            });
        },
        onError: (error: any) => {
            toast({
                title: 'Execution Failed',
                description: error.message || 'Failed to run rule',
                variant: 'destructive',
            });
        },
    });

    return {
        rules,
        isLoading,
        createRule: createRule.mutate,
        toggleRule: toggleRule.mutate,
        deleteRule: deleteRule.mutate,
        runRule: runRule.mutate,
        isCreating: createRule.isPending,
        isRunning: runRule.isPending,
    };
}

// Hook for automation logs
export function useAutomationLogs(ruleId?: string) {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['automation-logs', user?.id, ruleId],
        queryFn: async () => {
            if (!user) return [];

            let query = supabase
                .from('automation_logs')
                .select('*')
                .eq('user_id', user.id)
                .order('executed_at', { ascending: false })
                .limit(50);

            if (ruleId) {
                query = query.eq('rule_id', ruleId);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        },
        enabled: !!user,
    });
}
