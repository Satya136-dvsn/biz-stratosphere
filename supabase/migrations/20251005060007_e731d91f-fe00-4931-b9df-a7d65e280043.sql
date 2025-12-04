-- Create cleaned_data_points table for ETL processed data
CREATE TABLE IF NOT EXISTS public.cleaned_data_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_dataset_id uuid REFERENCES public.datasets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  
  -- Core metrics
  metric_name text NOT NULL,
  metric_value numeric NOT NULL,
  metric_type text NOT NULL DEFAULT 'number',
  date_recorded timestamp with time zone NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  
  -- Bank churn specific fields
  customer_id integer,
  credit_score integer,
  country text,
  gender text,
  age integer,
  tenure integer,
  balance numeric,
  products_number integer,
  credit_card integer,
  active_member integer,
  estimated_salary numeric,
  churn integer,
  
  -- Derived features
  balance_salary_ratio numeric,
  age_tenure_interaction numeric,
  gender_male integer DEFAULT 0,
  country_france integer DEFAULT 0,
  country_germany integer DEFAULT 0,
  country_spain integer DEFAULT 0,
  
  -- Data quality
  data_quality_score numeric DEFAULT 1.0,
  cleaned_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cleaned_data_points_user_id ON public.cleaned_data_points(user_id);
CREATE INDEX IF NOT EXISTS idx_cleaned_data_points_company_id ON public.cleaned_data_points(company_id);
CREATE INDEX IF NOT EXISTS idx_cleaned_data_points_dataset_id ON public.cleaned_data_points(original_dataset_id);
CREATE INDEX IF NOT EXISTS idx_cleaned_data_points_date ON public.cleaned_data_points(date_recorded);

-- Enable RLS
ALTER TABLE public.cleaned_data_points ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own cleaned data"
ON public.cleaned_data_points
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cleaned data"
ON public.cleaned_data_points
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can insert cleaned data"
ON public.cleaned_data_points
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Enable realtime for the table
ALTER PUBLICATION supabase_realtime ADD TABLE public.cleaned_data_points;