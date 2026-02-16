// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useEffect } from 'react';

export interface Notification {
    id: string;
    user_id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    read: boolean;
    action_url?: string;
    created_at: string;
    updated_at: string;
}

export function useNotifications() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // Fetch notifications
    const { data: notifications = [], isLoading } = useQuery({
        queryKey: ['notifications', user?.id],
        queryFn: async () => {
            if (!user) return [];

            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) {
                console.error('Error fetching notifications:', error);
                return [];
            }

            return (data || []) as Notification[];
        },
        enabled: !!user,
    });

    // Real-time subscription
    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel('notifications-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`,
                },
                () => {
                    // Refetch notifications on any change
                    queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, queryClient]);

    // Mark as read mutation
    const markAsReadMutation = useMutation({
        mutationFn: async (notificationId: string) => {
            const { error } = await supabase
                .from('notifications')
                .update({ read: true, updated_at: new Date().toISOString() })
                .eq('id', notificationId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
        },
    });

    // Mark all as read mutation
    const markAllAsReadMutation = useMutation({
        mutationFn: async () => {
            if (!user) return;

            const { error } = await supabase
                .from('notifications')
                .update({ read: true, updated_at: new Date().toISOString() })
                .eq('user_id', user.id)
                .eq('read', false);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
        },
    });

    // Calculate unread count
    const unreadCount = notifications.filter((n) => !n.read).length;

    return {
        notifications,
        isLoading,
        unreadCount,
        markAsRead: markAsReadMutation.mutate,
        markAllAsRead: markAllAsReadMutation.mutate,
        isMarkingAsRead: markAsReadMutation.isPending || markAllAsReadMutation.isPending,
    };
}
