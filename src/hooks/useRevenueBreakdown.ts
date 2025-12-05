import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface RevenueCategory {
    name: string;
    value: number;
    percentage: number;
    color: string;
}

export function useRevenueBreakdown() {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['revenue-breakdown', user?.id],
        queryFn: async () => {
            if (!user) return [];

            // Query datasets to create revenue breakdown
            const { data: datasets, error } = await supabase
                .from('datasets')
                .select('id, file_name, file_size')
                .eq('user_id', user.id);

            if (error || !datasets || datasets.length === 0) {
                return [];
            }

            // Create categories based on file size
            const totalSize = datasets.reduce((sum, d) => sum + (d.file_size || 0), 0);

            const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

            const categories: RevenueCategory[] = datasets
                .slice(0, 5)
                .map((dataset, index) => ({
                    name: dataset.file_name || `Dataset ${index + 1}`,
                    value: dataset.file_size || 0,
                    percentage: totalSize > 0 ? ((dataset.file_size || 0) / totalSize) * 100 : 0,
                    color: colors[index % colors.length]
                }))
                .filter(cat => cat.value > 0)
                .sort((a, b) => b.value - a.value);

            return categories;
        },
        enabled: !!user,
    });
}
