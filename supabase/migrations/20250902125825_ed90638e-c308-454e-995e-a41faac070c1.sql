-- Enable pg_cron extension for scheduled Power BI refreshes
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a cron job to refresh Power BI datasets every hour
-- This will call the powerbi-scheduled-refresh edge function
SELECT cron.schedule(
  'powerbi-hourly-refresh',
  '0 * * * *', -- At minute 0 past every hour
  $$
  SELECT
    net.http_post(
        url:='https://kfkllxfwyvocmnkowbyw.supabase.co/functions/v1/powerbi-scheduled-refresh',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtma2xseGZ3eXZvY21ua293Ynl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzOTg4NTUsImV4cCI6MjA3MTk3NDg1NX0.5X7Ak-3XfiNTzI2oQ58O3vJnwabN6KVyi3aLcBoDqVg", "x-scheduled": "true"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);

-- Create a table to track Power BI refresh history
CREATE TABLE IF NOT EXISTS public.powerbi_refresh_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  refresh_type TEXT NOT NULL DEFAULT 'scheduled',
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on the refresh log table
ALTER TABLE public.powerbi_refresh_log ENABLE ROW LEVEL SECURITY;

-- Create policies for the refresh log table
CREATE POLICY "Users can view their company's refresh logs" 
ON public.powerbi_refresh_log 
FOR SELECT 
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "System can insert refresh logs" 
ON public.powerbi_refresh_log 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Company admins can manage refresh logs" 
ON public.powerbi_refresh_log 
FOR ALL 
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND has_permission(auth.uid(), 'company'::text, 'admin'::permission_type)
);