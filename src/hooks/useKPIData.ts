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

      const { data: datasets } = await supabase
        .from('datasets')
        .select('file_size, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const totalFiles = datasets?.length || 0;
      const totalSize = datasets?.reduce((sum, d) => sum + (d.file_size || 0), 0) || 0;
      const avgSize = totalFiles > 0 ? totalSize / totalFiles : 0;

      // Calculate month-over-month metrics
      const now = new Date();
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

    } catch(error) {
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