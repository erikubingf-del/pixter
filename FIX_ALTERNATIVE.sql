-- ============================================================================
-- ALTERNATIVE FIX: Bypass RLS for Trigger
-- ============================================================================
-- The issue is that triggers with SECURITY DEFINER may not have proper
-- auth.jwt() context when RLS policies check for service_role.
--
-- Solution: Make the trigger function a SECURITY DEFINER that explicitly
-- bypasses RLS by setting the session to the definer's role.
-- ============================================================================

-- Option 1: Update the function to use SET ROLE
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Explicitly insert without RLS checks (function is SECURITY DEFINER)
  INSERT INTO public.profiles (
    id,
    email,
    celular,
    tipo,
    verified,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.phone,
    COALESCE(NEW.raw_user_meta_data->>'tipo', 'motorista'),
    CASE WHEN NEW.phone IS NOT NULL THEN true ELSE false END,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, profiles.email),
    celular = COALESCE(EXCLUDED.celular, profiles.celular),
    verified = CASE WHEN EXCLUDED.celular IS NOT NULL THEN true ELSE profiles.verified END,
    updated_at = NOW();

  RETURN NEW;
END;
$$;

-- Grant execute permission to authenticated and anon roles
GRANT EXECUTE ON FUNCTION handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION handle_new_user() TO anon;
GRANT EXECUTE ON FUNCTION handle_new_user() TO service_role;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Option 2: Temporarily disable RLS on profiles (NOT RECOMMENDED for production)
-- Only use this for testing to confirm it's an RLS issue
-- ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- If you want to test without RLS to confirm that's the issue,
-- uncomment the line above, test, then re-enable with:
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
