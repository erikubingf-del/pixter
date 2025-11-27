-- ============================================================================
-- COMPLETE FIX: All Database Issues for Phone Authentication
-- ============================================================================
-- Run this ENTIRE script in Supabase SQL Editor to fix all issues at once
-- ============================================================================

-- STEP 1: Fix RLS Policies (Add WITH CHECK for INSERT support)
-- ============================================================================

-- Drop and recreate the service role policy with proper INSERT support
DROP POLICY IF EXISTS "Service role full access to profiles" ON profiles;

CREATE POLICY "Service role full access to profiles"
  ON profiles FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

COMMENT ON POLICY "Service role full access to profiles" ON profiles IS
  'Service role has full access. Both USING and WITH CHECK are required for INSERT operations.';

-- Also add explicit INSERT policies as backup
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;

CREATE POLICY "Service role can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- STEP 2: Fix handle_new_user Trigger (Support Phone Authentication)
-- ============================================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert profile for new user
  -- Handles both email and phone authentication
  INSERT INTO profiles (
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
    NEW.email,                                             -- NULL for phone auth
    NEW.phone,                                             -- NULL for email auth
    COALESCE(NEW.raw_user_meta_data->>'tipo', 'motorista'), -- Default to motorista for phone signups
    CASE
      WHEN NEW.phone IS NOT NULL THEN true                 -- Phone signups are verified via OTP
      WHEN NEW.email_confirmed_at IS NOT NULL THEN true    -- Email signups verified when confirmed
      ELSE false
    END,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, profiles.email),
    celular = COALESCE(EXCLUDED.celular, profiles.celular),
    verified = CASE
      WHEN EXCLUDED.celular IS NOT NULL THEN true
      WHEN profiles.email IS NOT NULL AND auth.users.email_confirmed_at IS NOT NULL THEN true
      ELSE profiles.verified
    END,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION handle_new_user() IS
  'Creates/updates profile for new users. Handles both email and phone authentication. Phone signups default to motorista type.';

-- ============================================================================
-- STEP 3: Verify Setup
-- ============================================================================

-- Check that trigger exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    RAISE NOTICE 'Creating trigger on_auth_user_created...';
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION handle_new_user();
  ELSE
    RAISE NOTICE 'Trigger on_auth_user_created already exists';
  END IF;
END $$;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ All fixes applied successfully!';
  RAISE NOTICE '✅ RLS policies updated to support INSERT operations';
  RAISE NOTICE '✅ Trigger updated to handle phone authentication';
  RAISE NOTICE '✅ Ready to test phone OTP login!';
END $$;
