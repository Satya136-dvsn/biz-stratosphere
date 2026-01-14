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

import { useState, useEffect, useCallback } from 'react';

const CURRENT_WORKSPACE_KEY = 'biz-stratosphere-current-workspace';

export function useWorkspaces() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // Current workspace state with localStorage persistence
    const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem(CURRENT_WORKSPACE_KEY);
        }
        return null;
    });

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

    // Auto-select first workspace if none selected
    useEffect(() => {
        if (workspaces.length > 0 && !currentWorkspaceId) {
            const firstWorkspace = workspaces[0];
            setCurrentWorkspaceId(firstWorkspace.id);
            localStorage.setItem(CURRENT_WORKSPACE_KEY, firstWorkspace.id);
        }
    }, [workspaces, currentWorkspaceId]);

    // Current workspace object
    const currentWorkspace = workspaces.find(w => w.id === currentWorkspaceId) || null;

    // Switch workspace function
    const switchWorkspace = useCallback((workspaceId: string) => {
        setCurrentWorkspaceId(workspaceId);
        localStorage.setItem(CURRENT_WORKSPACE_KEY, workspaceId);
        // Invalidate queries that depend on workspace
        queryClient.invalidateQueries({ queryKey: ['datasets'] });
        queryClient.invalidateQueries({ queryKey: ['data-points'] });
        queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
    }, [queryClient]);

    // Clear workspace (for logout)
    const clearCurrentWorkspace = useCallback(() => {
        setCurrentWorkspaceId(null);
        localStorage.removeItem(CURRENT_WORKSPACE_KEY);
    }, []);

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
        onSuccess: (newWorkspace) => {
            queryClient.invalidateQueries({ queryKey: ['workspaces'] });
            // Auto-switch to newly created workspace
            if (newWorkspace) {
                switchWorkspace(newWorkspace.id);
            }
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
        onSuccess: (_, deletedWorkspaceId) => {
            queryClient.invalidateQueries({ queryKey: ['workspaces'] });
            // If deleted workspace was current, switch to first available
            if (deletedWorkspaceId === currentWorkspaceId) {
                const remaining = workspaces.filter(w => w.id !== deletedWorkspaceId);
                if (remaining.length > 0) {
                    switchWorkspace(remaining[0].id);
                } else {
                    clearCurrentWorkspace();
                }
            }
        },
    });

    return {
        workspaces,
        isLoading,
        currentWorkspace,
        currentWorkspaceId,
        switchWorkspace,
        clearCurrentWorkspace,
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
