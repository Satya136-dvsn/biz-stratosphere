// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.


import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './useAuth';
import { useWorkspaces } from './useWorkspaces';

export type DecisionType = 'ai_chat' | 'ml_prediction' | 'automation';
export type HumanAction = 'accepted' | 'modified' | 'ignored';
export type OutcomeStatus = 'pending' | 'success' | 'partial' | 'failure';

export interface Decision {
    decision_id: string;
    decision_type: DecisionType;
    user_id: string;
    workspace_id: string;
    input_context: any;
    ai_confidence_score?: number;
    ai_confidence_level?: string;
    human_action: HumanAction;
    expected_outcome: string;
    actual_outcome?: string;
    outcome_status: OutcomeStatus;
    created_at: string;
    evaluated_at?: string;
}

export type CreateDecisionPayload = Omit<Decision, 'decision_id' | 'created_at' | 'evaluated_at' | 'outcome_status' | 'actual_outcome' | 'user_id' | 'workspace_id'>;

export function useDecisionMemory() {
    const { session } = useAuth();
    const { currentWorkspace } = useWorkspaces();
    const queryClient = useQueryClient();

    // Create Decision
    const createDecision = useMutation({
        mutationFn: async (payload: CreateDecisionPayload) => {
            if (!session?.user?.id || !currentWorkspace?.id) {
                throw new Error('User or workspace not active');
            }

            const { data, error } = await supabase
                .from('decision_memory')
                .insert({
                    ...payload,
                    user_id: session.user.id,
                    workspace_id: currentWorkspace.id,
                    outcome_status: 'pending'
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            toast.success('Decision recorded', {
                description: 'This decision has been logged to your Decision Memory™.'
            });
            queryClient.invalidateQueries({ queryKey: ['decisions'] });
        },
        onError: (error) => {
            console.error('Failed to record decision:', error);
            toast.error('Failed to record decision');
        }
    });

    // Update Outcome (Admin or Creator)
    const updateOutcome = useMutation({
        mutationFn: async ({ id, actual_outcome, outcome_status }: { id: string; actual_outcome: string; outcome_status: OutcomeStatus }) => {
            const { data, error } = await supabase
                .from('decision_memory')
                .update({
                    actual_outcome,
                    outcome_status,
                    evaluated_at: new Date().toISOString()
                })
                .eq('decision_id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            toast.success('Outcome updated');
            queryClient.invalidateQueries({ queryKey: ['decisions'] });
        },
        onError: (error) => {
            console.error('Failed to update outcome:', error);
            toast.error('Failed to update decision outcome');
        }
    });

    // Fetch Decisions (with filters)
    const fetchDecisions = (filters?: {
        type?: DecisionType;
        status?: OutcomeStatus;
        confidenceLevel?: string;
    }) => {
        return useQuery({
            queryKey: ['decisions', currentWorkspace?.id, filters],
            queryFn: async () => {
                if (!currentWorkspace?.id) return [];

                let query = supabase
                    .from('decision_memory')
                    .select('*')
                    .order('created_at', { ascending: false });

                // Apply filters
                // Note: RLS handles the workspace filtering, but we can verify
                // or let RLS handle it. The 'Users view workspace decisions' policy 
                // filters by workspace_id IN (subquery), so we don't strictly need .eq('workspace_id')
                // if we trust RLS, but adding it for clarity/performance on server-side 
                // (though Supabase/PostgREST might not use it if RLS is stricter).
                // However, admins might see all, so let's filter by current workspace for now
                // unless it's the Admin Console view which might want to see all?
                // Let's assume the hook respects the current global workspace context.

                // Wait, requirements say "Admins can see all workspace decisions".
                // Does this mean ALL workspaces or all decisions IN the workspace?
                // "Users can see only their workspace decisions".
                // Usually Admin Console allows picking a workspace.

                // Let's rely on currentWorkspace.id if set.
                if (currentWorkspace?.id && !filters) { // Default behavior
                    // query = query.eq('workspace_id', currentWorkspace.id);
                    // Actually, the policy enforces workspace membership check.
                }

                if (filters?.type) {
                    query = query.eq('decision_type', filters.type);
                }
                if (filters?.status) {
                    query = query.eq('outcome_status', filters.status);
                }
                if (filters?.confidenceLevel) {
                    query = query.eq('ai_confidence_level', filters.confidenceLevel);
                }

                const { data, error } = await query;
                if (error) throw error;
                return data as Decision[];
            },
            enabled: !!currentWorkspace?.id
        });
    };

    return {
        createDecision,
        updateOutcome,
        useDecisions: fetchDecisions
    };
}
