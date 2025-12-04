-- Create table datasets if not exists
CREATE TABLE IF NOT EXISTS public.datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  company_id UUID,
  name TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  status TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create table data_points if not exists
CREATE TABLE IF NOT EXISTS public.data_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID REFERENCES public.datasets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  company_id UUID,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  metric_type TEXT,
  date_recorded TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_points ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's company_id
CREATE OR REPLACE FUNCTION public.get_user_company_id(user_uuid UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT company_id FROM public.profiles WHERE user_id = user_uuid;
$$;

-- RLS policies for datasets
DROP POLICY IF EXISTS "Users can view their own datasets" ON public.datasets;
DROP POLICY IF EXISTS "Users can create their own datasets" ON public.datasets;
DROP POLICY IF EXISTS "Users can update their own datasets" ON public.datasets;
DROP POLICY IF EXISTS "Users can delete their own datasets" ON public.datasets;

CREATE POLICY "Users can view datasets in their company"
ON public.datasets FOR SELECT
USING (
  company_id = public.get_user_company_id(auth.uid())
  AND (user_id = auth.uid())
);

CREATE POLICY "Users can create datasets in their company"
ON public.datasets FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND company_id = public.get_user_company_id(auth.uid())
);

CREATE POLICY "Users can update datasets with permission"
ON public.datasets FOR UPDATE
USING (
  company_id = public.get_user_company_id(auth.uid())
  AND user_id = auth.uid()
);

CREATE POLICY "Users can delete datasets with permission"
ON public.datasets FOR DELETE
USING (
  company_id = public.get_user_company_id(auth.uid())
  AND user_id = auth.uid()
);

-- RLS policies for data_points
DROP POLICY IF EXISTS "Users can view their own data_points" ON public.data_points;
DROP POLICY IF EXISTS "Users can create their own data_points" ON public.data_points;
DROP POLICY IF EXISTS "Users can update their own data_points" ON public.data_points;
DROP POLICY IF EXISTS "Users can delete their own data_points" ON public.data_points;

CREATE POLICY "Users can view data_points in their company"
ON public.data_points FOR SELECT
USING (
  company_id = public.get_user_company_id(auth.uid())
  AND (user_id = auth.uid())
);

CREATE POLICY "Users can create data_points in their company"
ON public.data_points FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND company_id = public.get_user_company_id(auth.uid())
);

CREATE POLICY "Users can update data_points with permission"
ON public.data_points FOR UPDATE
USING (
  company_id = public.get_user_company_id(auth.uid())
  AND user_id = auth.uid()
);

CREATE POLICY "Users can delete data_points with permission"
ON public.data_points FOR DELETE
USING (
  company_id = public.get_user_company_id(auth.uid())
  AND user_id = auth.uid()
);
