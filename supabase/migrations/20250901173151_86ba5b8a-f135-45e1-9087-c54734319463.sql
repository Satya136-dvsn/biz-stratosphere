-- Create security definer functions for permission checking
CREATE OR REPLACE FUNCTION public.get_user_company_id(user_uuid UUID)
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE user_id = user_uuid;
$$;

CREATE OR REPLACE FUNCTION public.has_permission(user_uuid UUID, resource_type TEXT, permission_type permission_type, resource_uuid UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_permissions up
    JOIN public.profiles p ON up.user_id = p.user_id
    WHERE up.user_id = user_uuid
    AND up.resource_type = resource_type
    AND up.permission = permission_type
    AND (up.resource_id IS NULL OR up.resource_id = resource_uuid)
    AND up.company_id = p.company_id
  ) OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = user_uuid 
    AND role IN ('super_admin', 'company_admin')
  );
$$;

-- Create RLS policies for companies
CREATE POLICY "Users can view their own company"
ON public.companies FOR SELECT
USING (id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Company admins can update their company"
ON public.companies FOR UPDATE
USING (
  id = public.get_user_company_id(auth.uid()) 
  AND public.has_permission(auth.uid(), 'company', 'admin'::permission_type)
);

CREATE POLICY "Super admins can create companies"
ON public.companies FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

-- Create RLS policies for user_permissions
CREATE POLICY "Users can view permissions in their company"
ON public.user_permissions FOR SELECT
USING (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Company admins can manage permissions"
ON public.user_permissions FOR ALL
USING (
  company_id = public.get_user_company_id(auth.uid())
  AND public.has_permission(auth.uid(), 'users', 'admin'::permission_type)
);

-- Create RLS policies for API usage
CREATE POLICY "Users can view their own API usage"
ON public.api_usage FOR SELECT
USING (
  user_id = auth.uid()
  OR (company_id = public.get_user_company_id(auth.uid())
      AND public.has_permission(auth.uid(), 'analytics', 'read'::permission_type))
);

CREATE POLICY "System can insert API usage"
ON public.api_usage FOR INSERT
WITH CHECK (true);

-- Create RLS policies for rate_limits
CREATE POLICY "Users can view their company rate limits"
ON public.rate_limits FOR SELECT
USING (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Company admins can manage rate limits"
ON public.rate_limits FOR ALL
USING (
  company_id = public.get_user_company_id(auth.uid())
  AND public.has_permission(auth.uid(), 'company', 'admin'::permission_type)
);

-- Update existing policies for multi-tenancy
DROP POLICY IF EXISTS "Users can view their own datasets" ON public.datasets;
DROP POLICY IF EXISTS "Users can create their own datasets" ON public.datasets;
DROP POLICY IF EXISTS "Users can update their own datasets" ON public.datasets;
DROP POLICY IF EXISTS "Users can delete their own datasets" ON public.datasets;

CREATE POLICY "Users can view datasets in their company"
ON public.datasets FOR SELECT
USING (
  company_id = public.get_user_company_id(auth.uid())
  AND (user_id = auth.uid() OR public.has_permission(auth.uid(), 'datasets', 'read'::permission_type))
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
  AND (user_id = auth.uid() OR public.has_permission(auth.uid(), 'datasets', 'write'::permission_type, id))
);

CREATE POLICY "Users can delete datasets with permission"
ON public.datasets FOR DELETE
USING (
  company_id = public.get_user_company_id(auth.uid())
  AND (user_id = auth.uid() OR public.has_permission(auth.uid(), 'datasets', 'delete'::permission_type, id))
);

-- Update the handle_new_user function to create default company
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  company_uuid UUID;
  is_first_user BOOLEAN;
BEGIN
  -- Check if this is the first user (super admin)
  SELECT NOT EXISTS(SELECT 1 FROM public.profiles LIMIT 1) INTO is_first_user;
  
  -- Create a default company for new users if they don't have one
  IF NEW.raw_user_meta_data->>'company_id' IS NULL THEN
    INSERT INTO public.companies (name, subdomain)
    VALUES (
      COALESCE(NEW.raw_user_meta_data->>'company_name', 'Default Company'),
      LOWER(REPLACE(COALESCE(NEW.raw_user_meta_data->>'company_name', 'default-' || substring(NEW.id::text, 1, 8)), ' ', '-'))
    )
    RETURNING id INTO company_uuid;
  ELSE
    company_uuid := (NEW.raw_user_meta_data->>'company_id')::UUID;
  END IF;

  -- Insert the user profile
  INSERT INTO public.profiles (user_id, display_name, role, company_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    CASE 
      WHEN is_first_user THEN 'super_admin'::user_role
      ELSE COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'analyst'::user_role)
    END,
    company_uuid
  );

  -- Grant default permissions for admins
  IF (NEW.raw_user_meta_data->>'role')::user_role = 'company_admin' OR is_first_user THEN
    INSERT INTO public.user_permissions (user_id, company_id, resource_type, permission, granted_by)
    VALUES 
      (NEW.id, company_uuid, 'company', 'admin', NEW.id),
      (NEW.id, company_uuid, 'users', 'admin', NEW.id),
      (NEW.id, company_uuid, 'datasets', 'admin', NEW.id),
      (NEW.id, company_uuid, 'insights', 'admin', NEW.id),
      (NEW.id, company_uuid, 'analytics', 'read', NEW.id);
  END IF;

  -- Insert default rate limits
  INSERT INTO public.rate_limits (company_id, endpoint_pattern, max_requests, time_window_minutes, subscription_tier)
  VALUES 
    (company_uuid, '/functions/v1/ai-chat', 50, 60, 'basic'),
    (company_uuid, '/functions/v1/trend-analysis', 20, 60, 'basic'),
    (company_uuid, '/functions/v1/forecasting', 15, 60, 'basic'),
    (company_uuid, '/functions/v1/churn-prediction', 10, 60, 'basic'),
    (company_uuid, '/functions/v1/sales-forecasting', 10, 60, 'basic'),
    (company_uuid, '/functions/v1/anomaly-detection', 25, 60, 'basic')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;