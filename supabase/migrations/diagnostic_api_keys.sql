-- Diagnostic query to check api_keys table structure and test access
-- Run this in Supabase SQL Editor to debug the 400 error

-- 1. Check table exists and structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'api_keys'
ORDER BY ordinal_position;

-- 2. Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'api_keys';

-- 3. List all policies on api_keys
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'api_keys';

-- 4. Test if current user can access (run this while signed in)
SELECT auth.uid() as current_user_id;

-- 5. Try to select with current user (should work if RLS is correct)
SELECT * FROM api_keys WHERE created_by = auth.uid();

-- 6. Check if there's any data
SELECT COUNT(*) as total_rows FROM api_keys;
