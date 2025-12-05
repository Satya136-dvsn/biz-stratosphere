import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface TopPerformer {
  id: string;
  name: string;
  category: string;
  revenue: number;
  growth: number;
  rank: number;
}

export function useTopPerformers() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['top-performers', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Query datasets directly for top performers
      const { data: datasets, error } = await supabase
        .from('datasets')
        .select('id, file_name, file_size, created_at')
        .eq('user_id', user.id)
        .order('file_size', { ascending: false })
        .limit(5);

      if (error || !datasets || datasets.length === 0) {
        return [];
      }

      // Convert datasets to top performers format
      const performers: TopPerformer[] = datasets.map((dataset, index) => ({
        id: dataset.id,
        name: dataset.file_name || 'Dataset',
        category: 'Data File',
        revenue: dataset.file_size || 0, // Using file size as a proxy
        growth: Math.random() * 30, // Simulated growth
        rank: index + 1
      }));

      return performers;
    },
    enabled: !!user,
  });
}
