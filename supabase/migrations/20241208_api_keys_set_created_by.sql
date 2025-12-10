-- Additional fix for api_keys - Set created_by field automatically
-- Migration: 20241208_api_keys_set_created_by
-- Description: Adds trigger to auto-set created_by field for RLS to work

-- Create function to set created_by on insert
CREATE OR REPLACE FUNCTION set_api_key_created_by()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.created_by IS NULL THEN
        NEW.created_by = auth.uid();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS set_api_key_created_by_trigger ON public.api_keys;
CREATE TRIGGER set_api_key_created_by_trigger
    BEFORE INSERT ON public.api_keys
    FOR EACH ROW
    EXECUTE FUNCTION set_api_key_created_by();
