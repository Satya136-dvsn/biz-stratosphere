
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type AdminUser = {
    id: string;
    email: string;
    full_name: string;
    role: 'admin' | 'user' | 'super_admin';
    suspended: boolean;
    created_at: string;
    last_sign_in: string | null;
};

export function useAdminUsers(page = 1, search = '') {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: users, isLoading, error } = useQuery({
        queryKey: ['admin-users', page, search],
        queryFn: async () => {
            const { data, error } = await supabase.rpc('get_admin_users', {
                page,
                page_size: 20,
                search_query: search
            });
            if (error) throw error;
            return data as AdminUser[];
        },
        keepPreviousData: true,
    });

    const updateRoleMutation = useMutation({
        mutationFn: async ({ id, role }: { id: string; role: string }) => {
            const { error } = await supabase.rpc('admin_update_role', {
                target_user_id: id,
                new_role: role
            });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-users']);
            toast({ title: 'Role Updated', description: 'User role changed successfully.' });
        },
        onError: (err: any) => {
            toast({ title: 'Error', description: err.message, variant: 'destructive' });
        }
    });

    const toggleSuspendMutation = useMutation({
        mutationFn: async ({ id, suspend }: { id: string; suspend: boolean }) => {
            const { error } = await supabase.rpc('admin_toggle_suspend', {
                target_user_id: id,
                suspend
            });
            if (error) throw error;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries(['admin-users']);
            toast({
                title: variables.suspend ? 'User Suspended' : 'User Restored',
                description: `User access has been ${variables.suspend ? 'revoked' : 'restored'}.`
            });
        },
        onError: (err: any) => {
            toast({ title: 'Error', description: err.message, variant: 'destructive' });
        }
    });

    return {
        users: (users || []) as AdminUser[],
        isLoading,
        error,
        updateRole: updateRoleMutation.mutate,
        toggleSuspend: toggleSuspendMutation.mutate,
    };
}
