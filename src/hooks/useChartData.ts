// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, subMonths, subYears } from 'date-fns';

interface ChartDataPoint {
  month: string;
  revenue: number;
  target: number;
  customers: number;
  date: Date;
}

interface ChartFilters {
  startDate?: Date;
  endDate?: Date;
  period: 'monthly' | 'weekly' | 'daily';
  categories?: string[];
}

export function useChartData(filters: ChartFilters) {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const { user } = useAuth();
  const hasInitiallyLoaded = useRef(false);

  const fetchChartData = useCallback(async (isFilterChange = false) => {
    if (!user) return;

    console.log('[useChartData] Fetching data...', {
      isFilterChange,
      startDate: filters.startDate?.toISOString(),
      endDate: filters.endDate?.toISOString(),
      period: filters.period,
      categories: filters.categories
    });

    // Set appropriate loading state
    if (isFilterChange) {
      setIsFiltering(true);
    } else {
      setIsLoading(true);
    }

    try {
      // Handle undefined dates - default to last 5 years for "All time"
      const effectiveStartDate = filters.startDate || subYears(new Date(), 5);
      const effectiveEndDate = filters.endDate || new Date();

      let query = supabase
        .from('data_points')
        .select('*')
        .eq('user_id', user.id)
        .gte('date_recorded', effectiveStartDate.toISOString())
        .lte('date_recorded', effectiveEndDate.toISOString())
        .order('date_recorded', { ascending: true });

      const { data: rawDataPoints, error } = await query;

      if (error) throw error;

      if (!rawDataPoints || rawDataPoints.length === 0) {
        setChartData([]);
        return;
      }

      // Filter by categories if selected
      const dataPoints = filters.categories && filters.categories.length > 0
        ? rawDataPoints.filter(dp => {
          const metricName = dp.metric_name?.toLowerCase() || '';
          // Check if metric name contains any of the selected categories
          return filters.categories!.some(category =>
            metricName.includes(category.toLowerCase()) ||
            (category === 'revenue' && (metricName.includes('income') || metricName.includes('sales'))) ||
            (category === 'customers' && (metricName.includes('user') || metricName.includes('client')))
          );
        })
        : rawDataPoints;

      if (dataPoints.length === 0 && rawDataPoints.length > 0) {
        // If filter results in no data, but we have raw data, show empty state or filtered state
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

        // Categorize metrics based on metric_name patterns
        const metricName = dp.metric_name?.toLowerCase() || '';
        const metricValue = dp.metric_value || 0;

        // Revenue-related patterns
        const isRevenue = metricName.includes('revenue') ||
          metricName.includes('sales') ||
          metricName.includes('income') ||
          metricName.includes('earnings') ||
          metricName.includes('profit') ||
          metricName.includes('amount') ||
          metricName.includes('total') ||
          metricName.includes('gross');

        // Customer-related patterns
        const isCustomer = metricName.includes('customer') ||
          metricName.includes('user') ||
          metricName.includes('client') ||
          metricName.includes('subscriber') ||
          metricName.includes('member') ||
          metricName.includes('count') ||
          metricName.includes('active');

        // Categorize with priority: explicit match > value-based guess
        if (isRevenue && !isCustomer) {
          group.revenue.push(metricValue);
        } else if (isCustomer && !isRevenue) {
          group.customers.push(metricValue);
        } else if (isRevenue && isCustomer) {
          // Both patterns match - use value magnitude to guess
          // Revenue values are typically larger (e.g., in dollars)
          if (metricValue > 10000) {
            group.revenue.push(metricValue);
          } else {
            group.customers.push(metricValue);
          }
        } else {
          // Neither pattern matches - use value-based heuristic
          // Large values (> 10000) are likely revenue, smaller are likely counts
          if (metricValue > 10000) {
            group.revenue.push(metricValue);
          } else {
            group.customers.push(metricValue);
          }
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
      console.log('[useChartData] Chart data filtered and set:', chartPoints.length, 'points');

    } catch (error) {
      console.error('Error fetching chart data:', error);
      setChartData([]);
    } finally {
      setIsLoading(false);
      setIsFiltering(false);
      hasInitiallyLoaded.current = true;
    }
  }, [user, filters.startDate?.getTime(), filters.endDate?.getTime(), filters.period, JSON.stringify(filters.categories)]);

  // Initial fetch when user changes
  useEffect(() => {
    if (user) {
      console.log('[useChartData] Initial load for user');
      fetchChartData(false);
    }
  }, [user?.id]);

  // Filter change detection - refetch with filter flag
  // Use primitive values in dependency array to ensure proper change detection
  const startTimestamp = filters.startDate?.getTime() || 0;
  const endTimestamp = filters.endDate?.getTime() || 0;

  useEffect(() => {
    // Only fetch on filter changes after initial load
    if (hasInitiallyLoaded.current && user) {
      console.log('[useChartData] Filter changed, refetching...');
      fetchChartData(true);
    }
  }, [startTimestamp, endTimestamp, filters.period, JSON.stringify(filters.categories)]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('chart-data-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'data_points',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchChartData(false);
        }
      )
      .subscribe();

    // Listen for data upload events
    const handleDataUploaded = () => {
      fetchChartData(false);
    };

    window.addEventListener('dataUploaded', handleDataUploaded);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('dataUploaded', handleDataUploaded);
    };
  }, [user?.id]);

  return { chartData, isLoading, isFiltering, refreshData: () => fetchChartData(false) };
}