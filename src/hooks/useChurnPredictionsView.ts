import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ChurnPredictionViewData {
  customer_id: string;
  tenure: number;
  monthly_charges: number;
  contract_type: string;
  actual_churn: string;
  predicted_churn: string;
  predicted_probability: number;
  prediction_time: string;
}

export interface ChurnPredictionFilters {
  contractType?: string;
  startDate?: Date;
  endDate?: Date;
}

export const useChurnPredictionsView = () => {
  const [data, setData] = useState<ChurnPredictionViewData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [contractTypes, setContractTypes] = useState<string[]>([]);

  // Memoized fetchData
  const fetchData = useCallback(async (filters?: ChurnPredictionFilters) => {
    setIsLoading(true);
    try {
      const { data: result, error } = await supabase
          .from('predictions_log')
          .select(`
            customer_id,
            input_features,
            predicted_label,
            predicted_probability,
            prediction_time,
            created_at
          `)
          .order('prediction_time', { ascending: false });

        if (error) {
          console.error('Error fetching churn predictions:', error);
          setData([]);
          return;
        }

        // Transform result
        type PredictionLogRow = {
          customer_id: string;
          input_features?: {
            tenure?: number;
            monthly_charges?: number;
            contract_type?: string;
          };
          predicted_label: boolean;
          predicted_probability: number;
          prediction_time: string;
          created_at: string;
        };

        const transformedData: ChurnPredictionViewData[] = (result as PredictionLogRow[] || []).map((item) => ({
          customer_id: item.customer_id || 'N/A',
          tenure: item.input_features?.tenure ?? 0,
          monthly_charges: item.input_features?.monthly_charges ?? 0,
          contract_type: item.input_features?.contract_type ?? 'Unknown',
          actual_churn: 'Unknown',
          predicted_churn: item.predicted_label ? 'Churn' : 'Retain',
          predicted_probability: item.predicted_probability ?? 0,
          prediction_time: item.prediction_time || item.created_at
        }));

        let filteredData = transformedData;
        if (filters?.contractType && filters.contractType !== 'all') {
          filteredData = filteredData.filter(p => p.contract_type === filters.contractType);
        }
        if (filters?.startDate) {
          filteredData = filteredData.filter(p => new Date(p.prediction_time) >= filters.startDate!);
        }
        if (filters?.endDate) {
          filteredData = filteredData.filter(p => new Date(p.prediction_time) <= filters.endDate!);
        }

        setData(filteredData);
      } catch (err) {
        console.error('Error fetching churn predictions:', err);
        setData([]);
      } finally {
        setIsLoading(false);
      }
    }, []); // useCallback ensures stability

// ...existing code...

  const fetchContractTypes = async () => {
    try {
      // Get contract types from predictions_log input_features
      const { data: result, error } = await supabase
        .from('predictions_log')
        .select('input_features');

      if (error) {
        console.error('Error fetching contract types:', error);
        // Fallback contract types
        setContractTypes(['Month-to-month', 'One year', 'Two year']);
        return;
      }

      type InputFeaturesItem = { input_features?: { contract_type?: string } };
      const types = Array.from(new Set(
        (result as InputFeaturesItem[] || [])
          .map((item) => item.input_features?.contract_type)
          .filter((type): type is string => !!type && type.trim() !== '')
      ));
      setContractTypes(types.length > 0 ? types : ['Month-to-month', 'One year', 'Two year']);
    } catch (error) {
      console.error('Error fetching contract types:', error);
      setContractTypes(['Month-to-month', 'One year', 'Two year']);
    }
  };

  useEffect(() => {
    fetchData();
    fetchContractTypes();
  }, [fetchData]);

  return {
    data,
    isLoading,
    contractTypes,
    fetchData,
    refetch: () => fetchData()
  };
};