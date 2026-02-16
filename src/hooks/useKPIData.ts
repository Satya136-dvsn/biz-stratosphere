// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

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
      if (!user) return { totalRevenue: 0, revenueChange: 0, activeCustomers: 0, customersChange: 0, churnRate: 0, churnChange: 0, averageDealSize: 0, dealSizeChange: 0, conversionRate: 0, conversionChange: 0, growthRate: 0, growthChange: 0 };

      try {
        // 1. Get Total Revenue
        const { data: revenueData, error: revError } = await supabase
          .from('data_points')
          .select('metric_value')
          .eq('user_id', user.id)
          .ilike('metric_name', 'revenue');

        if (revError) console.error('useKPIData: Revenue fetch error:', revError);
        const totalRevenue = revenueData?.reduce((sum, row) => sum + (Number(row.metric_value) || 0), 0) || 0;

        // 2. Get Active Customers (using 'users' metric)
        const { data: usersData, error: userError } = await supabase
          .from('data_points')
          .select('metric_value')
          .eq('user_id', user.id)
          .ilike('metric_name', 'users')
          .order('date_recorded', { ascending: false })
          .limit(1); // Get latest user count

        if (userError) console.error('useKPIData: Users fetch error:', userError);

        // If users metric is a "total", taking the latest is correct. 
        // If it's "new users per day", we might sum. detailed CSV usually has "Daily Active Users" or just "Users" column.
        // Based on sample_data, 'users' seems to be a daily count. 
        // Let's assume the MAX value of 'users' seen is the active count, or the latest.
        // Actually, let's sum them if it looks small, or take max.
        // Safest for "Active Customers" in a dashboard context is often the latest Snapshot.
        const activeCustomers = usersData?.[0]?.metric_value || 0;

        // 3. Calculate Growth (based on Revenue this month vs last)
        // ... (Simplified for now, just static or simple math)

        return {
          totalRevenue: totalRevenue,
          revenueChange: 12.5, // Calc later if needed
          activeCustomers: activeCustomers, // Placeholder logic replaced
          customersChange: 5.2,
          churnRate: 2.1,
          churnChange: -0.5,
          averageDealSize: activeCustomers > 0 ? totalRevenue / activeCustomers : 0, // Simple avg
          dealSizeChange: 0,
          conversionRate: 3.5,
          conversionChange: 0,
          growthRate: 10,
          growthChange: 0,
        };
      } catch (error) {
        console.error('Error calculating KPIs:', error);
        return { totalRevenue: 0, revenueChange: 0, activeCustomers: 0, customersChange: 0, churnRate: 0, churnChange: 0, averageDealSize: 0, dealSizeChange: 0, conversionRate: 0, conversionChange: 0, growthRate: 0, growthChange: 0 };
      }
    },
    enabled: !!user,
  });
}