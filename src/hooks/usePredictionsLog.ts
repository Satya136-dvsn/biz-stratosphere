// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompany } from './useCompany';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

interface PredictionData {
  id?: string;
  customer_id?: string;
  prediction_type?: string;
  predicted_probability: number;
  predicted_label: boolean;
  model_version?: string;
  confidence_score?: number;
  input_features: Json;
  actual_outcome?: boolean;
  created_at?: string;
  expires_at?: string;
}

interface PredictionFilters {
  startDate?: Date;
  endDate?: Date;
  contractType?: string;
}

export const usePredictionsLog = () => {
  const [predictions, setPredictions] = useState<PredictionData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [contractTypes, setContractTypes] = useState<string[]>([]);
  const { user } = useAuth();
  const { company } = useCompany();

  // Fetch predictions with optional filters
  const fetchPredictions = async (filters?: PredictionFilters) => {
    if (!user) return;

    setIsLoading(true);
    try {
      let query = supabase
        .from('predictions_log')
        .select('*')
        .eq('user_id', user.id);

      // Apply date filters
      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate.toISOString());
      }
      if (filters?.endDate) {
        const endOfDay = new Date(filters.endDate);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.lte('created_at', endOfDay.toISOString());
      }

      // Apply contract type filter (search in input_features JSON)
      if (filters?.contractType) {
        query = query.contains('input_features', { contract_type: filters.contractType });
      }

      query = query.order('created_at', { ascending: false });
      
      const { data, error } = await query;

      if (error) throw error;
      setPredictions(data || []);
    } catch (error) {
      console.error('Error fetching predictions:', error);
      toast.error('Failed to fetch predictions');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch available contract types from input_features
  const fetchContractTypes = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('predictions_log')
        .select('input_features')
        .eq('user_id', user.id);

      if (error) throw error;

      const types = new Set<string>();
      data?.forEach(prediction => {
        const features = prediction.input_features as Record<string, unknown>;
        if (features?.contract_type && typeof features.contract_type === 'string' && features.contract_type.trim()) {
          types.add(features.contract_type.trim());
        }
      });

      setContractTypes(Array.from(types).sort());
    } catch (error) {
      console.error('Error fetching contract types:', error);
    }
  };

  // Create prediction
  const createPrediction = async (predictionData: Omit<PredictionData, 'id' | 'created_at'>) => {
    if (!user) {
      toast.error('Please log in to create predictions');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('predictions_log')
        .insert({
          ...predictionData,
          user_id: user.id,
          company_id: company?.id,
          prediction_type: predictionData.prediction_type || 'churn'
        })
        .select()
        .single();

      if (error) throw error;
      
      // Refresh predictions list
      await fetchPredictions();
      toast.success('Prediction logged successfully');
      return data;
    } catch (error) {
      console.error('Error creating prediction:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create prediction');
      return null;
    }
  };

  // Update prediction with actual outcome
  const updatePredictionOutcome = async (predictionId: string, actualOutcome: boolean) => {
    try {
      const { error } = await supabase
        .from('predictions_log')
        .update({ actual_outcome: actualOutcome })
        .eq('id', predictionId)
        .eq('user_id', user?.id);

      if (error) throw error;
      
      // Refresh predictions list
      await fetchPredictions();
      toast.success('Prediction outcome updated');
    } catch (error) {
      console.error('Error updating prediction outcome:', error);
      toast.error('Failed to update prediction outcome');
    }
  };

  // Delete prediction
  const deletePrediction = async (predictionId: string) => {
    try {
      const { error } = await supabase
        .from('predictions_log')
        .delete()
        .eq('id', predictionId)
        .eq('user_id', user?.id);

      if (error) throw error;
      
      // Refresh predictions list
      await fetchPredictions();
      toast.success('Prediction deleted');
    } catch (error) {
      console.error('Error deleting prediction:', error);
      toast.error('Failed to delete prediction');
    }
  };

  // Get prediction statistics
  const getPredictionStats = () => {
    const totalPredictions = predictions.length;
    const churnPredictions = predictions.filter(p => p.predicted_label === true).length;
    const retainPredictions = predictions.filter(p => p.predicted_label === false).length;
    
    const predictionsWithOutcome = predictions.filter(p => p.actual_outcome !== null && p.actual_outcome !== undefined);
    const correctPredictions = predictionsWithOutcome.filter(p => p.predicted_label === p.actual_outcome).length;
    const accuracy = predictionsWithOutcome.length > 0 ? (correctPredictions / predictionsWithOutcome.length) * 100 : 0;

    const avgConfidence = predictions.length > 0 
      ? predictions.reduce((sum, p) => sum + (p.confidence_score || 0), 0) / predictions.length 
      : 0;

    return {
      totalPredictions,
      churnPredictions,
      retainPredictions,
      accuracy: Math.round(accuracy * 100) / 100,
      avgConfidence: Math.round(avgConfidence * 100) / 100,
      verifiedPredictions: predictionsWithOutcome.length
    };
  };

  useEffect(() => {
    fetchPredictions();
    fetchContractTypes();
  }, [user]);

  return {
    predictions,
    isLoading,
    contractTypes,
    fetchPredictions,
    createPrediction,
    updatePredictionOutcome,
    deletePrediction,
    getPredictionStats
  };
};