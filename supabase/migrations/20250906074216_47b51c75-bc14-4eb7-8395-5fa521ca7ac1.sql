-- Create RPC functions for alert management
CREATE OR REPLACE FUNCTION public.mark_alert_seen(alert_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  UPDATE public.alerts 
  SET seen = true 
  WHERE id = alert_id 
  AND (user_id = auth.uid() OR is_global = true);
$$;

CREATE OR REPLACE FUNCTION public.mark_all_alerts_seen()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  UPDATE public.alerts 
  SET seen = true 
  WHERE user_id = auth.uid() OR is_global = true;
$$;