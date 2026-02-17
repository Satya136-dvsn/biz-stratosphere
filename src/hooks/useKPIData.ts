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

import { DEMO_KPI_DATA } from '@/data/demoDataset';

export function useKPIData() {
  const { user } = useAuth();
  const FORCE_DEMO = true;

  return useQuery({
    queryKey: ['kpi-data', user?.id],
    initialData: FORCE_DEMO ? DEMO_KPI_DATA : undefined, // Provide initial data!
    queryFn: async (): Promise<KPIData> => {
      // If no user, return zeros (or demo data if we want public demo)
      if (!user || FORCE_DEMO) return DEMO_KPI_DATA;

      try {
        // 1. Get Total Revenue
        const { data: revenueData, error: revError } = await supabase
          .from('data_points')
          .select('metric_value')
          .eq('user_id', user.id)
          .ilike('metric_name', 'revenue');

        if (revError) console.error('useKPIData: Revenue fetch error:', revError);
        const totalRevenue = revenueData?.reduce((sum, row) => sum + (Number(row.metric_value) || 0), 0) || 0;

        // 2. Get Active Customers
        const { data: usersData, error: userError } = await supabase
          .from('data_points')
          .select('metric_value')
          .eq('user_id', user.id)
          .ilike('metric_name', 'users')
          .order('date_recorded', { ascending: false })
          .limit(1);

        const activeCustomers = usersData?.[0]?.metric_value || 0;

        // Fallback to Demo Data if DB is empty (First Run Experience)
        if (totalRevenue === 0 && activeCustomers === 0) {
          console.log('useKPIData: No data found, using Demo Data');
          return DEMO_KPI_DATA;
        }

        return {
          totalRevenue: totalRevenue,
          revenueChange: 12.5,
          activeCustomers: activeCustomers,
          customersChange: 5.2,
          churnRate: 2.1,
          churnChange: -0.5,
          averageDealSize: activeCustomers > 0 ? totalRevenue / activeCustomers : 0,
          dealSizeChange: 0,
          conversionRate: 3.5,
          conversionChange: 0,
          growthRate: 10,
          growthChange: 0,
        };
      } catch (error) {
        console.error('Error calculating KPIs:', error);
        return DEMO_KPI_DATA; // Fallback on error too
      }
    },
    enabled: true, // Always enable to show something
  });
}