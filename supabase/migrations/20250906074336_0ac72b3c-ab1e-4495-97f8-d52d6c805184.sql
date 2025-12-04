-- Enable RLS on alerts table
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for alerts table
CREATE POLICY "Users can view their own alerts and global alerts" 
ON public.alerts 
FOR SELECT 
USING (user_id = auth.uid() OR is_global = true);

CREATE POLICY "System can insert alerts" 
ON public.alerts 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own alerts" 
ON public.alerts 
FOR UPDATE 
USING (user_id = auth.uid() OR is_global = true);