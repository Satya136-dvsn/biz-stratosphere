import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface KPIData {
  totalRevenue: number;
  activeCustomers: number;
  churnRate: number;
  averageDealSize: number;
  revenueChange: number;
  customersChange: number;
  churnChange: number;
  dealSizeChange: number;
}

export function useKPIData() {
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const calculateKPIs = async () => {
    if (!user) return;

    setIsLoading(true);
    
    try {
      const { data: dataPoints, error } = await supabase
        .from('data_points')
        .select('*')
        .eq('user_id', user.id)
        .order('date_recorded', { ascending: false });

      if (error) throw error;

      if (!dataPoints || dataPoints.length === 0) {
        // Return default values if no data
        setKpiData({
          totalRevenue: 0,
          activeCustomers: 0,
          churnRate: 0,
          averageDealSize: 0,
          revenueChange: 0,
          customersChange: 0,
          churnChange: 0,
          dealSizeChange: 0,
        });
        return;
      }

      // Calculate current month and previous month data
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      const currentMonthData = dataPoints.filter(dp => 
        new Date(dp.date_recorded) >= currentMonthStart
      );
      
      const previousMonthData = dataPoints.filter(dp => {
        const date = new Date(dp.date_recorded);
        return date >= previousMonthStart && date <= previousMonthEnd;
      });

      // Calculate metrics
      const calculateMetrics = (data: typeof dataPoints) => {
        const revenueMetrics = data.filter(dp => 
          dp.metric_name.toLowerCase().includes('revenue') || 
          dp.metric_name.toLowerCase().includes('sales') ||
          dp.metric_name.toLowerCase().includes('income')
        );
        
        const customerMetrics = data.filter(dp => 
          dp.metric_name.toLowerCase().includes('customer') || 
          dp.metric_name.toLowerCase().includes('user') ||
          dp.metric_name.toLowerCase().includes('client')
        );
        
        const churnMetrics = data.filter(dp => 
          dp.metric_name.toLowerCase().includes('churn') || 
          dp.metric_name.toLowerCase().includes('cancel') ||
          dp.metric_name.toLowerCase().includes('leave')
        );

        const dealMetrics = data.filter(dp => 
          dp.metric_name.toLowerCase().includes('deal') || 
          dp.metric_name.toLowerCase().includes('contract') ||
          dp.metric_name.toLowerCase().includes('order')
        );

        return {
          revenue: revenueMetrics.reduce((sum, dp) => sum + dp.metric_value, 0),
          customers: customerMetrics.reduce((sum, dp) => sum + dp.metric_value, 0),
          churn: churnMetrics.length > 0 ? 
            churnMetrics.reduce((sum, dp) => sum + dp.metric_value, 0) / churnMetrics.length : 0,
          deals: dealMetrics.length > 0 ? 
            dealMetrics.reduce((sum, dp) => sum + dp.metric_value, 0) / dealMetrics.length : 0
        };
      };

      const currentMetrics = calculateMetrics(currentMonthData);
      const previousMetrics = calculateMetrics(previousMonthData);

      // Calculate percentage changes
      const calculateChange = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
      };

      setKpiData({
        totalRevenue: currentMetrics.revenue,
        activeCustomers: currentMetrics.customers,
        churnRate: currentMetrics.churn,
        averageDealSize: currentMetrics.deals,
        revenueChange: calculateChange(currentMetrics.revenue, previousMetrics.revenue),
        customersChange: calculateChange(currentMetrics.customers, previousMetrics.customers),
        churnChange: calculateChange(currentMetrics.churn, previousMetrics.churn),
        dealSizeChange: calculateChange(currentMetrics.deals, previousMetrics.deals),
      });

    } catch (error) {
      console.error('Error calculating KPIs:', error);
      // Fallback to default values
      setKpiData({
        totalRevenue: 0,
        activeCustomers: 0,
        churnRate: 0,
        averageDealSize: 0,
        revenueChange: 0,
        customersChange: 0,
        churnChange: 0,
        dealSizeChange: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    calculateKPIs();
    
    // Listen for data upload events to refresh KPIs
    const handleDataUploaded = () => {
      calculateKPIs();
    };
    
    window.addEventListener('dataUploaded', handleDataUploaded);
    
    return () => {
      window.removeEventListener('dataUploaded', handleDataUploaded);
    };
  }, [user]);

  return { kpiData, isLoading, refreshKPIs: calculateKPIs };
}