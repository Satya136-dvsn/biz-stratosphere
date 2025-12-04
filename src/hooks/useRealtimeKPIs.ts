import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RealtimeKPI {
  metric_name: string;
  metric_value: number;
  date_recorded: string;
}

export function useRealtimeKPIs() {
  const [realtimeData, setRealtimeData] = useState<RealtimeKPI[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Subscribe to real-time updates on data_points
    const channel = supabase
      .channel('kpi-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'data_points'
        },
        (payload) => {
          const newData = payload.new as RealtimeKPI;
          setRealtimeData(prev => [newData, ...prev].slice(0, 50)); // Keep last 50
          
          toast({
            title: "New Data Point",
            description: `${newData.metric_name}: ${newData.metric_value}`,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'predictions_log'
        },
        () => {
          toast({
            title: "New Prediction",
            description: "A new prediction has been logged",
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  return { realtimeData };
}