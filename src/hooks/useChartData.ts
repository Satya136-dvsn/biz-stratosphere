import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

interface ChartDataPoint {
  month: string;
  revenue: number;
  target: number;
  customers: number;
  date: Date;
}

interface ChartFilters {
  startDate: Date;
  endDate: Date;
  period: 'monthly' | 'weekly' | 'daily';
}

export function useChartData(filters: ChartFilters) {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchChartData = async () => {
    if (!user) return;

    setIsLoading(true);

    try {
      const { data: dataPoints, error } = await supabase
        .from('data_points')
        .select('*')
        .eq('user_id', user.id)
        .gte('date_recorded', filters.startDate.toISOString())
        .lte('date_recorded', filters.endDate.toISOString())
        .order('date_recorded', { ascending: true });

      if (error) throw error;

      if (!dataPoints || dataPoints.length === 0) {
        setChartData([]);
        return;
      }

      // Group data by time period
      const groupedData = new Map<string, {
        revenue: number[];
        customers: number[];
        date: Date;
      }>();

      dataPoints.forEach(dp => {
        const date = new Date(dp.date_recorded);
        let key: string;

        if (filters.period === 'monthly') {
          key = format(date, 'MMM yyyy');
        } else if (filters.period === 'weekly') {
          key = format(date, 'MMM dd');
        } else {
          key = format(date, 'MMM dd');
        }

        if (!groupedData.has(key)) {
          groupedData.set(key, {
            revenue: [],
            customers: [],
            date: date
          });
        }

        const group = groupedData.get(key)!;

        // Categorize metrics
        const metricName = dp.metric_name.toLowerCase();
        if (metricName.includes('revenue') || metricName.includes('sales') || metricName.includes('income')) {
          group.revenue.push(dp.metric_value);
        } else if (metricName.includes('customer') || metricName.includes('user') || metricName.includes('client')) {
          group.customers.push(dp.metric_value);
        }
      });

      // Convert to chart format
      const chartPoints: ChartDataPoint[] = Array.from(groupedData.entries()).map(([key, groupData]) => {
        const revenue = groupData.revenue.reduce((sum, val) => sum + val, 0);
        const customers = groupData.customers.reduce((sum, val) => sum + val, 0);

        return {
          month: key,
          revenue: revenue,
          target: revenue * 0.9, // Set target as 90% of actual for now
          customers: customers,
          date: groupData.date
        };
      });

      // Sort by date
      chartPoints.sort((a, b) => a.date.getTime() - b.date.getTime());

      setChartData(chartPoints);

    } catch (error) {
      console.error('Error fetching chart data:', error);
      setChartData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChartData();

    // Set up real-time subscription
    const channel = supabase
      .channel('chart-data-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'data_points',
          filter: `user_id=eq.${user?.id}`
        },
        () => {
          fetchChartData();
        }
      )
      .subscribe();

    // Listen for data upload events
    const handleDataUploaded = () => {
      fetchChartData();
    };

    window.addEventListener('dataUploaded', handleDataUploaded);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('dataUploaded', handleDataUploaded);
    };
  }, [user, filters.startDate, filters.endDate, filters.period]);

  return { chartData, isLoading, refreshData: fetchChartData };
}