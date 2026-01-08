import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';

export interface UserUpload {
    id: string;
    user_id: string;
    filename: string;
    original_filename: string;
    file_size_bytes: number;
    file_type: string;
    mime_type?: string;
    storage_path: string;
    upload_source: 'ai_chat' | 'ml_predictions' | 'dashboard' | 'advanced_charts' | 'profile' | 'other';
    upload_context: Record<string, any>;
    status: 'active' | 'processing' | 'archived' | 'failed';
    processing_status: Record<string, any>;
    row_count?: number;
    column_count?: number;
    column_names?: string[];
    preview_data?: any;
    tags: string[];
    description?: string;
    dataset_id?: string;
    last_accessed_at?: string;
    access_count: number;
    deleted_at?: string;
    created_at: string;
    updated_at: string;
}

export interface StorageUsage {
    total_files: number;
    total_size_bytes: number;
    by_source: Record<string, { files: number; size: number }>;
}

export interface UploadFilters {
    source?: string;
    fileType?: string;
    status?: string;
    searchTerm?: string;
    dateRange?: { start: Date; end: Date };
}

export function useUserUploads(filters?: UploadFilters) {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Fetch uploads with filters
    const {
        data: uploads,
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: ['user-uploads', filters],
        queryFn: async () => {
            let query = supabase
                .from('user_uploads')
                .select('*')
                .is('deleted_at', null)
                .order('created_at', { ascending: false });

            // Apply filters
            if (filters?.source) {
                query = query.eq('upload_source', filters.source);
            }
            if (filters?.fileType) {
                query = query.eq('file_type', filters.fileType);
            }
            if (filters?.status) {
                query = query.eq('status', filters.status);
            }
            if (filters?.searchTerm) {
                query = query.or(`filename.ilike.%${filters.searchTerm}%,original_filename.ilike.%${filters.searchTerm}%`);
            }
            if (filters?.dateRange) {
                query = query
                    .gte('created_at', filters.dateRange.start.toISOString())
                    .lte('created_at', filters.dateRange.end.toISOString());
            }

            const { data, error } = await query;

            if (error) throw error;
            return data as UserUpload[];
        },
    });

    // Fetch storage usage
    const { data: storageUsage } = useQuery({
        queryKey: ['storage-usage'],
        queryFn: async () => {
            const { data: userData } = await supabase.auth.getUser();
            if (!userData.user) {
                // Return default empty storage usage if not authenticated
                return { total_files: 0, total_size_bytes: 0, by_source: {} } as StorageUsage;
            }

            try {
                const { data, error } = await supabase.rpc('get_user_storage_usage', {
                    target_user_id: userData.user.id,
                });

                if (error) {
                    console.warn('Storage usage RPC error:', error.message);
                    // Return default values on error
                    return { total_files: 0, total_size_bytes: 0, by_source: {} } as StorageUsage;
                }

                // Handle empty or null data
                if (!data || data.length === 0) {
                    return { total_files: 0, total_size_bytes: 0, by_source: {} } as StorageUsage;
                }

                return data[0] as StorageUsage;
            } catch (err) {
                console.warn('Storage usage fetch failed:', err);
                return { total_files: 0, total_size_bytes: 0, by_source: {} } as StorageUsage;
            }
        },
        // Don't throw errors, just return default values
        retry: false,
    });

    // Log upload mutation
    const logUploadMutation = useMutation({
        mutationFn: async (uploadData: Partial<UserUpload>) => {
            const { data: userData } = await supabase.auth.getUser();
            if (!userData.user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('user_uploads')
                .insert({
                    user_id: userData.user.id,
                    ...uploadData,
                })
                .select()
                .single();

            if (error) throw error;
            return data as UserUpload;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-uploads'] });
            queryClient.invalidateQueries({ queryKey: ['storage-usage'] });
        },
        onError: (error: any) => {
            toast({
                title: 'Upload logging failed',
                description: error.message,
                variant: 'destructive',
            });
        },
    });

    // Delete upload mutation (soft delete)
    const deleteUploadMutation = useMutation({
        mutationFn: async (uploadId: string) => {
            const { error } = await supabase
                .from('user_uploads')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', uploadId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-uploads'] });
            queryClient.invalidateQueries({ queryKey: ['storage-usage'] });
            toast({
                title: 'File deleted',
                description: 'Upload history has been updated',
            });
        },
        onError: (error: any) => {
            toast({
                title: 'Delete failed',
                description: error.message,
                variant: 'destructive',
            });
        },
    });

    // Update upload metadata
    const updateUploadMutation = useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<UserUpload> }) => {
            const { data, error } = await supabase
                .from('user_uploads')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data as UserUpload;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-uploads'] });
            toast({
                title: 'Upload updated',
                description: 'Changes saved successfully',
            });
        },
        onError: (error: any) => {
            toast({
                title: 'Update failed',
                description: error.message,
                variant: 'destructive',
            });
        },
    });

    // Track file access
    const trackAccessMutation = useMutation({
        mutationFn: async (uploadId: string) => {
            const { error } = await supabase.rpc('increment', {
                table_name: 'user_uploads',
                row_id: uploadId,
                column_name: 'access_count',
            });

            // Also update last_accessed_at
            await supabase
                .from('user_uploads')
                .update({ last_accessed_at: new Date().toISOString() })
                .eq('id', uploadId);

            if (error) console.error('Failed to track access:', error);
        },
    });

    // Helper to format file size
    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    };

    // Group uploads by source
    const uploadsBySource = uploads?.reduce((acc, upload) => {
        const source = upload.upload_source;
        if (!acc[source]) acc[source] = [];
        acc[source].push(upload);
        return acc;
    }, {} as Record<string, UserUpload[]>) || {};

    return {
        uploads: uploads || [],
        uploadsBySource,
        storageUsage,
        isLoading,
        error,
        refetch,
        logUpload: logUploadMutation.mutate,
        deleteUpload: deleteUploadMutation.mutate,
        updateUpload: updateUploadMutation.mutate,
        trackAccess: trackAccessMutation.mutate,
        formatFileSize,
    };
}

// Helper function to get source display name
export function getSourceDisplayName(source: string): string {
    const names: Record<string, string> = {
        ai_chat: 'AI Chat (RAG Knowledge Base)',
        ml_predictions: 'ML Predictions',
        dashboard: 'Dashboard',
        advanced_charts: 'Advanced Charts',
        profile: 'Profile',
        other: 'Other',
    };
    return names[source] || source;
}

// Helper function to get source icon
export function getSourceIcon(source: string): string {
    const icons: Record<string, string> = {
        ai_chat: '📊',
        ml_predictions: '🧠',
        dashboard: '📈',
        advanced_charts: '📉',
        profile: '👤',
        other: '📁',
    };
    return icons[source] || '📄';
}
