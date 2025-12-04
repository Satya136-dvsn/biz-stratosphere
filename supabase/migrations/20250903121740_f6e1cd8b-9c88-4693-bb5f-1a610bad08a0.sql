-- Create churn_data table for training data
CREATE TABLE public.churn_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_id UUID,
  dataset_id UUID,
  tenure INTEGER NOT NULL,
  monthly_charges NUMERIC NOT NULL,
  contract_type TEXT NOT NULL CHECK (contract_type IN ('Month-to-month', 'One year', 'Two year')),
  label BOOLEAN NOT NULL, -- true for churned, false for retained
  customer_id TEXT,
  total_charges NUMERIC,
  internet_service TEXT,
  payment_method TEXT,
  gender TEXT,
  senior_citizen BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create predictions_log table for prediction history
CREATE TABLE public.predictions_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_id UUID,
  customer_id TEXT,
  prediction_type TEXT NOT NULL DEFAULT 'churn',
  predicted_probability NUMERIC NOT NULL CHECK (predicted_probability >= 0 AND predicted_probability <= 1),
  predicted_label BOOLEAN NOT NULL,
  model_version TEXT,
  confidence_score NUMERIC,
  input_features JSONB NOT NULL DEFAULT '{}'::jsonb,
  actual_outcome BOOLEAN, -- for tracking accuracy later
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '6 months')
);

-- Enable RLS on both tables
ALTER TABLE public.churn_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for churn_data
CREATE POLICY "Users can view their own churn data" 
ON public.churn_data 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own churn data" 
ON public.churn_data 
FOR INSERT 
WITH CHECK (auth.uid() = user_id AND company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update their own churn data" 
ON public.churn_data 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own churn data" 
ON public.churn_data 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for predictions_log
CREATE POLICY "Users can view their own predictions" 
ON public.predictions_log 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create predictions" 
ON public.predictions_log 
FOR INSERT 
WITH CHECK (auth.uid() = user_id AND company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update their own predictions" 
ON public.predictions_log 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Add foreign key references
ALTER TABLE public.churn_data 
ADD CONSTRAINT fk_churn_data_dataset 
FOREIGN KEY (dataset_id) REFERENCES public.datasets(id) ON DELETE SET NULL;

ALTER TABLE public.churn_data 
ADD CONSTRAINT fk_churn_data_company 
FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;

ALTER TABLE public.predictions_log 
ADD CONSTRAINT fk_predictions_log_company 
FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX idx_churn_data_user_id ON public.churn_data(user_id);
CREATE INDEX idx_churn_data_dataset_id ON public.churn_data(dataset_id);
CREATE INDEX idx_churn_data_company_id ON public.churn_data(company_id);
CREATE INDEX idx_predictions_log_user_id ON public.predictions_log(user_id);
CREATE INDEX idx_predictions_log_created_at ON public.predictions_log(created_at);

-- Create triggers for updated_at timestamp
CREATE TRIGGER update_churn_data_updated_at
BEFORE UPDATE ON public.churn_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();