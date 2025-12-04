-- Create role enum
CREATE TYPE public.app_role AS ENUM ('super_admin', 'company_admin', 'analyst', 'viewer');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    granted_by UUID REFERENCES auth.users(id),
    UNIQUE (user_id, role, company_id)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.check_user_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user's highest role
CREATE OR REPLACE FUNCTION public.get_user_highest_role(_user_id UUID)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY CASE role
    WHEN 'super_admin' THEN 1
    WHEN 'company_admin' THEN 2
    WHEN 'analyst' THEN 3
    WHEN 'viewer' THEN 4
  END
  LIMIT 1
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Company admins can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('super_admin', 'company_admin')
    AND (ur.company_id = user_roles.company_id OR ur.role = 'super_admin')
  )
);

-- Migrate existing roles from profiles to user_roles
INSERT INTO public.user_roles (user_id, role, company_id, granted_by)
SELECT 
  user_id,
  role::text::app_role,
  company_id,
  user_id
FROM public.profiles
WHERE role IS NOT NULL
ON CONFLICT (user_id, role, company_id) DO NOTHING;

-- Update the handle_new_user function to create user_role instead
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  company_uuid UUID;
  is_first_user BOOLEAN;
  user_role app_role;
BEGIN
  -- Check if this is the first user (super admin)
  SELECT NOT EXISTS(SELECT 1 FROM public.profiles LIMIT 1) INTO is_first_user;
  
  -- Determine role
  IF is_first_user THEN
    user_role := 'super_admin';
  ELSIF NEW.raw_user_meta_data->>'role' IS NOT NULL THEN
    user_role := (NEW.raw_user_meta_data->>'role')::app_role;
  ELSE
    user_role := 'analyst';
  END IF;
  
  -- Create or get company
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

  -- Insert profile (without role column)
  INSERT INTO public.profiles (user_id, display_name, company_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    company_uuid
  );

  -- Insert user role
  INSERT INTO public.user_roles (user_id, role, company_id, granted_by)
  VALUES (NEW.id, user_role, company_uuid, NEW.id);

  -- Grant default permissions for admins
  IF user_role IN ('company_admin', 'super_admin') THEN
    INSERT INTO public.user_permissions (user_id, company_id, resource_type, permission, granted_by)
    VALUES 
      (NEW.id, company_uuid, 'company', 'admin', NEW.id),
      (NEW.id, company_uuid, 'users', 'admin', NEW.id),
      (NEW.id, company_uuid, 'datasets', 'admin', NEW.id),
      (NEW.id, company_uuid, 'insights', 'admin', NEW.id),
      (NEW.id, company_uuid, 'analytics', 'read', NEW.id);
  END IF;

  RETURN NEW;
END;
$$;