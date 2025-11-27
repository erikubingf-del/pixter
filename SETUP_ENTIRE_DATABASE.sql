-- ============================================================================
-- COMPLETE DATABASE SETUP FOR AMOPAGAR
-- ============================================================================
-- This creates ALL tables, triggers, and policies needed
-- Run this ENTIRE script in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. CREATE PROFILES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Basic Info
  nome TEXT,
  email TEXT,
  celular TEXT UNIQUE,
  tipo TEXT NOT NULL DEFAULT 'cliente',
  verified BOOLEAN DEFAULT false,

  -- Personal Info
  cpf TEXT,
  profissao TEXT,
  data_nascimento DATE,

  -- Media
  avatar_url TEXT,
  selfie_url TEXT,

  -- Stripe (Drivers)
  stripe_account_id TEXT UNIQUE,
  stripe_account_status TEXT,
  stripe_account_charges_enabled BOOLEAN,
  stripe_account_details_submitted BOOLEAN,
  stripe_account_payouts_enabled BOOLEAN,

  -- Stripe (Clients)
  stripe_customer_id TEXT UNIQUE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_celular ON profiles(celular);
CREATE INDEX IF NOT EXISTS idx_profiles_tipo ON profiles(tipo);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_account_id ON profiles(stripe_account_id);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_cpf ON profiles(cpf);

-- ============================================================================
-- 2. CREATE TRIGGERS
-- ============================================================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_profiles_updated_at ON profiles;
CREATE TRIGGER trigger_update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_profiles_updated_at();

-- Handle new user trigger (supports both EMAIL and PHONE signups)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
    NEW.email,                                             -- NULL for phone signups
    NEW.phone,                                             -- NULL for email signups
    COALESCE(NEW.raw_user_meta_data->>'tipo', 'motorista'), -- Default to motorista for phone
    CASE
      WHEN NEW.phone IS NOT NULL THEN true                 -- Phone OTP = verified
      WHEN NEW.email_confirmed_at IS NOT NULL THEN true    -- Email confirmed = verified
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
      ELSE profiles.verified
    END,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- 3. ENABLE RLS AND CREATE POLICIES
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies first
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Public can view driver profiles" ON profiles;
DROP POLICY IF EXISTS "Service role full access to profiles" ON profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;

-- Service role: Full access (for triggers and backend operations)
CREATE POLICY "Service role full access to profiles"
  ON profiles FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Users: Can view own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users: Can update own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users: Can insert own profile
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Public: Can view driver profiles (needed for payment pages)
CREATE POLICY "Public can view driver profiles"
  ON profiles FOR SELECT
  USING (tipo = 'motorista');

-- ============================================================================
-- 4. GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION handle_new_user() TO postgres, authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION update_profiles_updated_at() TO postgres, authenticated, anon, service_role;

-- ============================================================================
-- 5. ADD COMMENTS
-- ============================================================================

COMMENT ON TABLE profiles IS 'User profiles for both drivers (motoristas) and clients';
COMMENT ON COLUMN profiles.tipo IS 'User type: motorista or cliente';
COMMENT ON COLUMN profiles.celular IS 'Phone number in E.164 format (+5511999999999)';
COMMENT ON COLUMN profiles.verified IS 'Whether phone/email has been verified';

-- ============================================================================
-- SUCCESS!
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Database setup complete!';
  RAISE NOTICE '✅ Profiles table created';
  RAISE NOTICE '✅ Triggers configured (email + phone support)';
  RAISE NOTICE '✅ RLS policies enabled';
  RAISE NOTICE '✅ Ready for phone OTP authentication!';
END $$;
