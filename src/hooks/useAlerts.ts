import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Alert {
  id: string;
  title: string;
  message: string | null;
  alert_type: string | null;
  seen: boolean | null;
  created_at: string | null;
  is_global: boolean | null;
  user_id: string | null;
}

export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  const fetchAlerts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("alerts")
        .select("*")
        .or(`user_id.eq.${user.id},is_global.eq.true`)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Error fetching alerts:", error);
        return;
      }

      setAlerts(data || []);
      const unread = (data || []).filter(alert => !alert.seen).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error("Error fetching alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsSeen = async (alertId: string) => {
    try {
      // Use RPC function or direct table access if available
      const { error } = await supabase.rpc('mark_alert_seen', { alert_id: alertId });

      if (error) {
        console.error("Error marking alert as seen:", error);
        return;
      }

      // Update local state
      setAlerts(prev => 
        prev.map(alert => 
          alert.id === alertId ? { ...alert, seen: true } : alert
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking alert as seen:", error);
    }
  };

  const markAllAsSeen = async () => {
    if (!user) return;

    try {
      // Use RPC function for marking all as seen
      const { error } = await supabase.rpc('mark_all_alerts_seen');

      if (error) {
        console.error("Error marking all alerts as seen:", error);
        return;
      }

      // Update local state
      setAlerts(prev => prev.map(alert => ({ ...alert, seen: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all alerts as seen:", error);
    }
  };

  useEffect(() => {
    fetchAlerts();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchAlerts, 30000);

    // Set up real-time subscription for new alerts
    const channel = supabase
      .channel('alerts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'alerts'
        },
        () => {
          fetchAlerts();
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    alerts,
    loading,
    unreadCount,
    markAsSeen,
    markAllAsSeen,
    refetch: fetchAlerts
  };
}