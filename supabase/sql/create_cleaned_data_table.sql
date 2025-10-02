-- Create cleaned_data_points table for storing processed data
CREATE TABLE IF NOT EXISTS public.cleaned_data_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_dataset_id UUID REFERENCES public.datasets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  company_id UUID,

  -- Original data point fields
  metric_name TEXT,
  metric_value NUMERIC,
  metric_type TEXT,
  date_recorded TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Cleaned data fields (bank churn specific)
  customer_id BIGINT,
  credit_score INTEGER,
  country TEXT,
  gender TEXT,
  age INTEGER,
  tenure INTEGER,
  balance NUMERIC,
  products_number INTEGER,
  credit_card INTEGER,
  active_member INTEGER,
  estimated_salary NUMERIC,
  churn INTEGER,

  -- Derived features
  balance_salary_ratio NUMERIC,
  age_tenure_interaction INTEGER,
  gender_male INTEGER,
  country_france INTEGER DEFAULT 0,
  country_germany INTEGER DEFAULT 0,
  country_spain INTEGER DEFAULT 0,

  -- Data quality metrics
  data_quality_score NUMERIC DEFAULT 1.0,
  cleaned_at TIMESTAMPTZ,

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for cleaned_data_points
CREATE INDEX IF NOT EXISTS idx_cleaned_data_points_original_dataset_id ON public.cleaned_data_points(original_dataset_id);
CREATE INDEX IF NOT EXISTS idx_cleaned_data_points_user_id ON public.cleaned_data_points(user_id);
CREATE INDEX IF NOT EXISTS idx_cleaned_data_points_company_id ON public.cleaned_data_points(company_id);
CREATE INDEX IF NOT EXISTS idx_cleaned_data_points_customer_id ON public.cleaned_data_points(customer_id);
CREATE INDEX IF NOT EXISTS idx_cleaned_data_points_churn ON public.cleaned_data_points(churn);

-- Enable Row Level Security
ALTER TABLE public.cleaned_data_points ENABLE ROW LEVEL SECURITY;

-- RLS policies for cleaned_data_points
CREATE POLICY "Cleaned data: select for owner" ON public.cleaned_data_points
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Cleaned data: insert for owner" ON public.cleaned_data_points
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Cleaned data: update for owner" ON public.cleaned_data_points
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Cleaned data: delete for owner" ON public.cleaned_data_points
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Trigger function to update updated_at timestamp
DROP TRIGGER IF EXISTS set_updated_at_cleaned_data_points ON public.cleaned_data_points;
CREATE TRIGGER set_updated_at_cleaned_data_points
BEFORE UPDATE ON public.cleaned_data_points
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Add comments for documentation
COMMENT ON TABLE public.cleaned_data_points IS 'Stores cleaned and processed data points with derived features for ML training';
COMMENT ON COLUMN public.cleaned_data_points.data_quality_score IS 'Quality score from 0-1 indicating data reliability';
COMMENT ON COLUMN public.cleaned_data_points.balance_salary_ratio IS 'Derived feature: balance / (estimated_salary + 1)';
COMMENT ON COLUMN public.cleaned_data_points.age_tenure_interaction IS 'Derived feature: age * tenure';
