import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface ActivityItem {
    id: string;
    type: 'revenue' | 'customer' | 'sale' | 'alert' | 'upload';
    title: string;
    description: string;
    timestamp: string;
    trend?: 'up' | 'down';
    amount?: number;
}

export function useRecentActivity() {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['recent-activity', user?.id],
        queryFn: async () => {
            if (!user) return [];

            // Get recent file uploads as activity
            const { data: uploads, error: uploadsError } = await supabase
                .from('datasets')
                .select('id, file_name, file_size, created_at')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(5);

            if (uploadsError) {
                console.error('Error fetching uploads:', uploadsError);
                return [];
            }

            // Transform uploads into activity items
            const activities: ActivityItem[] = (uploads || []).map((upload) => {
                const timeAgo = getTimeAgo(new Date(upload.created_at));
                const sizeMB = upload.file_size ? (upload.file_size / (1024 * 1024)).toFixed(2) : 'Unknown';

                return {
                    id: upload.id,
                    type: 'upload' as const,
                    title: 'Data Upload',
                    description: `Uploaded ${upload.file_name} (${sizeMB} MB)`,
                    timestamp: timeAgo,
                    trend: 'up'
                };
            });

            return activities;
        },
        enabled: !!user,
    });
}

// Helper function to calculate time ago
function getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
}
