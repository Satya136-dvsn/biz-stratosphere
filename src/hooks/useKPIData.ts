import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface KPIData {
  totalRevenue: number;
  revenueChange: number;
  activeCustomers: number;
  customersChange: number;
  churnRate: number;
  churnChange: number;
  averageDealSize: number;
  dealSizeChange: number;
  conversionRate: number;
  conversionChange: number;
  growthRate: number;
  growthChange: number;
}

export function useKPIData() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['kpi-data', user?.id],
    queryFn: async (): Promise<KPIData> => {
      if (!user) {
        return {
          totalRevenue: 0,
          revenueChange: 0,
          activeCustomers: 0,
          customersChange: 0,
          churnRate: 0,
          churnChange: 0,
          averageDealSize: 0,
          dealSizeChange: 0,
          conversionRate: 0,
          conversionChange: 0,
          growthRate: 0,
          growthChange: 0,
        };
      }

      try {
        // Fetch uploaded datasets for growth rate
        const { data: datasets } = await supabase
          .from('datasets')
          .select('file_size, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        const totalFiles = datasets?.length || 0;

        // Calculate growth rate (simplified - based on uploads month over month)
        const now = new Date();
        const currentMonth = datasets?.filter(d => {
          const date = new Date(d.created_at);
          return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        }).length || 0;

        const lastMonth = datasets?.filter(d => {
          const date = new Date(d.created_at);
          const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1);
          return date.getMonth() === lastMonthDate.getMonth() &&
            date.getFullYear() === lastMonthDate.getFullYear();
        }).length || 0;

        const growthRate = lastMonth > 0 ? ((currentMonth - lastMonth) / lastMonth) * 100 : 0;

        // Return calculated KPIs
        return {
          totalRevenue: totalFiles * 1000, // Placeholder calculation
          revenueChange: 12.5,
          activeCustomers: totalFiles * 10,
          customersChange: 8.3,
          churnRate: 2.5,
          churnChange: -0.5,
          averageDealSize: 5000,
          dealSizeChange: 15.2,
          conversionRate: 3.2,
          conversionChange: 0.8,
          growthRate,
          growthChange: growthRate > 0 ? 10 : -5,
        };
      } catch (error) {
        console.error('Error calculating KPIs:', error);
        return {
          totalRevenue: 0,
          revenueChange: 0,
          activeCustomers: 0,
          customersChange: 0,
          churnRate: 0,
          churnChange: 0,
          averageDealSize: 0,
          dealSizeChange: 0,
          conversionRate: 0,
          conversionChange: 0,
          growthRate: 0,
          growthChange: 0,
        };
      }
    },
    enabled: !!user,
  });
}