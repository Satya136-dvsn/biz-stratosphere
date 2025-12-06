import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Workspace {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    owner_id: string;
    settings: any;
    created_at: string;
    updated_at: string;
}

export interface WorkspaceMember {
    id: string;
    workspace_id: string;
    user_id: string;
    role: 'owner' | 'admin' | 'member' | 'viewer';
    invited_by: string | null;
    invited_at: string;
    joined_at: string | null;
}

export function useWorkspaces() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // Fetch user's workspaces
    const { data: workspaces = [], isLoading } = useQuery({
        queryKey: ['workspaces', user?.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('workspaces')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as Workspace[];
        },
        enabled: !!user,
    });

    // Create workspace
    const createWorkspace = useMutation({
        mutationFn: async (data: { name: string; description?: string }) => {
            const slug = data.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');

            const { data: workspace, error } = await supabase
                .from('workspaces')
                .insert({
                    name: data.name,
                    slug: `${slug}-${Date.now()}`,
                    description: data.description,
                    owner_id: user!.id,
                })
                .select()
                .single();

            if (error) throw error;
            return workspace;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workspaces'] });
        },
    });

    //Update workspace
    const updateWorkspace = useMutation({
        mutationFn: async (data: { id: string; name?: string; description?: string; settings?: any }) => {
            const { error } = await supabase
                .from('workspaces')
                .update({
                    name: data.name,
                    description: data.description,
                    settings: data.settings,
                })
                .eq('id', data.id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workspaces'] });
        },
    });

    // Delete workspace
    const deleteWorkspace = useMutation({
        mutationFn: async (workspaceId: string) => {
            const { error } = await supabase
                .from('workspaces')
                .delete()
                .eq('id', workspaceId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workspaces'] });
        },
    });

    return {
        workspaces,
        isLoading,
        createWorkspace,
        updateWorkspace,
        deleteWorkspace,
    };
}

export function useWorkspaceMembers(workspaceId: string) {
    const queryClient = useQueryClient();

    const { data: members = [], isLoading } = useQuery({
        queryKey: ['workspace-members', workspaceId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('workspace_members')
                .select('*')
                .eq('workspace_id', workspaceId);

            if (error) throw error;
            return data as WorkspaceMember[];
        },
        enabled: !!workspaceId,
    });

    // Invite member
    const inviteMember = useMutation({
        mutationFn: async (data: { email: string; role: 'admin' | 'member' | 'viewer' }) => {
            const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

            const { error } = await supabase
                .from('workspace_invites')
                .insert({
                    workspace_id: workspaceId,
                    email: data.email,
                    role: data.role,
                    token,
                    expires_at: expiresAt.toISOString(),
                });

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workspace-members', workspaceId] });
        },
    });

    // Remove member
    const removeMember = useMutation({
        mutationFn: async (memberId: string) => {
            const { error } = await supabase
                .from('workspace_members')
                .delete()
                .eq('id', memberId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workspace-members', workspaceId] });
        },
    });

    // Update member role
    const updateMemberRole = useMutation({
        mutationFn: async (data: { memberId: string; role: 'admin' | 'member' | 'viewer' }) => {
            const { error } = await supabase
                .from('workspace_members')
                .update({ role: data.role })
                .eq('id', data.memberId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workspace-members', workspaceId] });
        },
    });

    return {
        members,
        isLoading,
        inviteMember,
        removeMember,
        updateMemberRole,
    };
}
