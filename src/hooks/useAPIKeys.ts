import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { createHash } from 'crypto';

export interface APIKey {
    id: string;
    workspace_id: string;
    name: string;
    key_prefix: string;
    permissions: string[];
    last_used_at: string | null;
    created_at: string;
    expires_at: string | null;
    is_active: boolean;
}

export function useAPIKeys(workspaceId: string) {
    const queryClient = useQueryClient();

    const { data: apiKeys = [], isLoading } = useQuery({
        queryKey: ['api-keys', workspaceId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('api_keys')
                .select('*')
                .eq('workspace_id', workspaceId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as APIKey[];
        },
        enabled: !!workspaceId,
    });

    const createAPIKey = useMutation({
        mutationFn: async (data: { name: string; permissions: string[]; expiresInDays?: number }) => {
            // Generate API key
            const key = `biz_${Math.random().toString(36).substring(2)}${Date.now().toString(36)}`;
            const keyPrefix = key.substring(0, 12) + '...';

            // Hash the key for storage (in real app, use proper crypto)
            const keyHash = btoa(key); // Simple encoding for demo

            let expiresAt = null;
            if (data.expiresInDays) {
                const expiry = new Date();
                expiry.setDate(expiry.getDate() + data.expiresInDays);
                expiresAt = expiry.toISOString();
            }

            const { data: apiKey, error } = await supabase
                .from('api_keys')
                .insert({
                    workspace_id: workspaceId,
                    name: data.name,
                    key_hash: keyHash,
                    key_prefix: keyPrefix,
                    permissions: data.permissions,
                    expires_at: expiresAt,
                })
                .select()
                .single();

            if (error) throw error;

            return { apiKey, plainKey: key }; // Return plain key once for user to copy
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['api-keys', workspaceId] });
        },
    });

    const revokeAPIKey = useMutation({
        mutationFn: async (keyId: string) => {
            const { error } = await supabase
                .from('api_keys')
                .update({ is_active: false })
                .eq('id', keyId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['api-keys', workspaceId] });
        },
    });

    const deleteAPIKey = useMutation({
        mutationFn: async (keyId: string) => {
            const { error } = await supabase
                .from('api_keys')
                .delete()
                .eq('id', keyId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['api-keys', workspaceId] });
        },
    });

    return {
        apiKeys,
        isLoading,
        createAPIKey,
        revokeAPIKey,
        deleteAPIKey,
    };
}
