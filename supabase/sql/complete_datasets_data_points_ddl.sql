-- Enable pgcrypto extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create datasets table
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

-- Indexes for datasets
CREATE INDEX IF NOT EXISTS idx_datasets_user_id ON public.datasets(user_id);
CREATE INDEX IF NOT EXISTS idx_datasets_company_id ON public.datasets(company_id);

-- Create data_points table
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

-- Indexes for data_points
CREATE INDEX IF NOT EXISTS idx_data_points_dataset_id ON public.data_points(dataset_id);
CREATE INDEX IF NOT EXISTS idx_data_points_user_id ON public.data_points(user_id);
CREATE INDEX IF NOT EXISTS idx_data_points_company_id ON public.data_points(company_id);

-- Enable Row Level Security
ALTER TABLE public.datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_points ENABLE ROW LEVEL SECURITY;

-- Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to datasets and data_points
DROP TRIGGER IF EXISTS set_updated_at_datasets ON public.datasets;
CREATE TRIGGER set_updated_at_datasets
BEFORE UPDATE ON public.datasets
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_data_points ON public.data_points;
CREATE TRIGGER set_updated_at_data_points
BEFORE UPDATE ON public.data_points
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Minimal ownership RLS policies using auth.uid()

-- Datasets policies
DROP POLICY IF EXISTS "Datasets: select for owner" ON public.datasets;
DROP POLICY IF EXISTS "Datasets: insert for owner" ON public.datasets;
DROP POLICY IF EXISTS "Datasets: update for owner" ON public.datasets;
DROP POLICY IF EXISTS "Datasets: delete for owner" ON public.datasets;

CREATE POLICY "Datasets: select for owner" ON public.datasets
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Datasets: insert for owner" ON public.datasets
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Datasets: update for owner" ON public.datasets
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Datasets: delete for owner" ON public.datasets
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Data_points policies
DROP POLICY IF EXISTS "DataPoints: select for owner" ON public.data_points;
DROP POLICY IF EXISTS "DataPoints: insert for owner" ON public.data_points;
DROP POLICY IF EXISTS "DataPoints: update for owner" ON public.data_points;
DROP POLICY IF EXISTS "DataPoints: delete for owner" ON public.data_points;

CREATE POLICY "DataPoints: select for owner" ON public.data_points
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "DataPoints: insert for owner" ON public.data_points
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "DataPoints: update for owner" ON public.data_points
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "DataPoints: delete for owner" ON public.data_points
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Alternative primary key strategy using bigint identity (optional)
-- Uncomment and use if you prefer bigint PKs instead of UUIDs

-- CREATE TABLE IF NOT EXISTS public.datasets_bigint (
--   id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
--   user_id UUID NOT NULL,
--   company_id UUID,
--   name TEXT NOT NULL,
--   file_name TEXT NOT NULL,
--   file_type TEXT,
--   file_size BIGINT,
--   status TEXT,
--   metadata JSONB DEFAULT '{}'::jsonb,
--   created_at TIMESTAMPTZ DEFAULT now(),
--   updated_at TIMESTAMPTZ DEFAULT now()
-- );

-- CREATE TABLE IF NOT EXISTS public.data_points_bigint (
--   id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
--   dataset_id BIGINT REFERENCES public.datasets_bigint(id) ON DELETE CASCADE,
--   user_id UUID NOT NULL,
--   company_id UUID,
--   metric_name TEXT NOT NULL,
--   metric_value NUMERIC NOT NULL,
--   metric_type TEXT,
--   date_recorded TIMESTAMPTZ,
--   metadata JSONB DEFAULT '{}'::jsonb,
--   created_at TIMESTAMPTZ DEFAULT now(),
--   updated_at TIMESTAMPTZ DEFAULT now()
-- );

-- Multi-tenant RLS policies using JWT claims (example)
-- Replace 'tenant_id' with your JWT claim name for company/tenant

-- CREATE POLICY "Datasets: select for tenant" ON public.datasets
--   FOR SELECT TO authenticated
--   USING (company_id = current_setting('jwt.claims.tenant_id')::uuid);

-- CREATE POLICY "Datasets: insert for tenant" ON public.datasets
--   FOR INSERT TO authenticated
--   WITH CHECK (company_id = current_setting('jwt.claims.tenant_id')::uuid);

-- CREATE POLICY "DataPoints: select for tenant" ON public.data_points
--   FOR SELECT TO authenticated
--   USING (company_id = current_setting('jwt.claims.tenant_id')::uuid);

-- CREATE POLICY "DataPoints: insert for tenant" ON public.data_points
--   FOR INSERT TO authenticated
--   WITH CHECK (company_id = current_setting('jwt.claims.tenant_id')::uuid);
