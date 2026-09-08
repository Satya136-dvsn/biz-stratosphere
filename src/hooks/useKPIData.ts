// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();
  const FORCE_DEMO = false;

  useEffect(() => {
    const handleDataUploaded = () => {
      queryClient.invalidateQueries({ queryKey: ['kpi-data'] });
    };
    window.addEventListener('dataUploaded', handleDataUploaded);
    return () => {
      window.removeEventListener('dataUploaded', handleDataUploaded);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ['kpi-data', user?.id],
    initialData: FORCE_DEMO ? DEMO_KPI_DATA : undefined, // Provide initial data!
    queryFn: async (): Promise<KPIData> => {
      // If no user, return zeros (or demo data if we want public demo)
      if (!user || FORCE_DEMO) return DEMO_KPI_DATA;

      try {
        // 1. Fetch ALL relevant data points for the user to calculate trends
        let { data: allData, error: dataError } = await supabase
          .from('data_points')
          .select('metric_name, metric_value, date_recorded')
          .eq('user_id', user.id)
          .order('date_recorded', { ascending: false });

        if (dataError) throw dataError;

        // If no user-specific data points found, fallback to seed dataset points
        // so dashboard displays metrics matching the preloaded files in Recent Activity
        if (!allData || allData.length === 0) {
          const { data: seedData } = await supabase
            .from('data_points')
            .select('metric_name, metric_value, date_recorded')
            .order('date_recorded', { ascending: false });
          allData = seedData || [];
        }

        if (!allData || allData.length === 0) {
          return DEMO_KPI_DATA;
        }

        // 2. Process data by category
        const revenueValues: { val: number; date: string }[] = [];
        const customerValues: { val: number; date: string }[] = [];
        const churnValues: { val: number; date: string }[] = [];

        allData.forEach(dp => {
          const name = dp.metric_name.toLowerCase();
          const val = Number(dp.metric_value) || 0;
          const date = dp.date_recorded;

          // Revenue aliases (Sync with useChartData logic)
          if (name.includes('revenue') || name.includes('sales') || name.includes('income') || 
              name.includes('earnings') || name.includes('profit') || name.includes('total')) {
            revenueValues.push({ val, date });
          } 
          // Customer aliases
          else if (name.includes('customer') || name.includes('user') || name.includes('client') || 
                   name.includes('count') || name.includes('active')) {
            customerValues.push({ val, date });
          }
          // Churn aliases
          else if (name.includes('churn')) {
            churnValues.push({ val, date });
          }
        });

        // 3. Calculate Current Totals and Latest Snapshots
        const totalRevenue = revenueValues.reduce((sum, item) => sum + item.val, 0);
        const activeCustomers = customerValues[0]?.val || 0;
        const churnRate = churnValues[0]?.val || 0;

        // 4. Calculate Growth Rates (Simplified: Current vs Previous Entry)
        const calculateChange = (values: { val: number; date: string }[]) => {
          if (values.length < 2) return 0;
          const current = values[0].val;
          const previous = values[1].val;
          if (previous === 0) return 0;
          return Number(((current - previous) / previous * 100).toFixed(1));
        };

        const revenueChange = calculateChange(revenueValues);
        const customersChange = calculateChange(customerValues);
        const churnChange = calculateChange(churnValues);

        return {
          totalRevenue: totalRevenue,
          revenueChange: revenueChange,
          activeCustomers: activeCustomers,
          customersChange: customersChange,
          churnRate: churnRate,
          churnChange: churnChange,
          averageDealSize: activeCustomers > 0 ? totalRevenue / activeCustomers : 0,
          dealSizeChange: 0,
          conversionRate: 3.5, // Keep as placeholder for now unless conversion metric found
          conversionChange: 0,
          growthRate: revenueChange, // Use revenue change as proxy for growth rate
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