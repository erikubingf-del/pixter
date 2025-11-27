-- ============================================================================
-- DEBUG: Check Current Database State
-- ============================================================================
-- Run this to see what's currently configured in your database
-- This will help identify the exact issue
-- ============================================================================

-- Check all policies on profiles table
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
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Check if handle_new_user function exists and its definition
SELECT
  p.proname as function_name,
  pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'handle_new_user';

-- Check triggers on auth.users
SELECT
  tgname as trigger_name,
  tgenabled as enabled,
  pg_get_triggerdef(oid) as definition
FROM pg_trigger
WHERE tgrelid = 'auth.users'::regclass
  AND tgname = 'on_auth_user_created';

-- Check profiles table structure
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- Check constraints on profiles table
SELECT
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'profiles'::regclass;
