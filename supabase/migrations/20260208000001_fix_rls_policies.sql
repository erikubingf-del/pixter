-- Migration: Fix RLS Policies - Restrict verification_codes and sms_rate_limits
-- Created: 2026-02-08
-- Description: Remove public access policies on verification_codes and sms_rate_limits.
--   These tables should only be accessible via the service role key (used by API routes).
--   Also restrict public profile access to safe columns via a database view.

-- ============================================================================
-- VERIFICATION_CODES: Remove public access, keep service_role only
-- ============================================================================

DROP POLICY IF EXISTS "Users can read own verification codes" ON verification_codes;
DROP POLICY IF EXISTS "Anyone can insert verification codes" ON verification_codes;
DROP POLICY IF EXISTS "Anyone can delete verification codes" ON verification_codes;

-- Service role policy already exists from original migration, but ensure it's there
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'verification_codes'
    AND policyname = 'Service role full access to verification codes'
  ) THEN
    CREATE POLICY "Service role full access to verification codes"
      ON verification_codes FOR ALL
      USING (auth.jwt() ->> 'role' = 'service_role');
  END IF;
END $$;

-- ============================================================================
-- SMS_RATE_LIMITS: Remove public access, keep service_role only
-- ============================================================================

DROP POLICY IF EXISTS "Public can read rate limits" ON sms_rate_limits;
DROP POLICY IF EXISTS "Public can insert rate limits" ON sms_rate_limits;

-- Add service_role full access policy for sms_rate_limits
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'sms_rate_limits'
    AND policyname = 'Service role full access to sms_rate_limits'
  ) THEN
    CREATE POLICY "Service role full access to sms_rate_limits"
      ON sms_rate_limits FOR ALL
      USING (auth.jwt() ->> 'role' = 'service_role');
  END IF;
END $$;

-- ============================================================================
-- PROFILES: Create a safe public view for driver info (payment pages)
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles'
      AND column_name = 'city'
  ) THEN
    ALTER TABLE profiles ADD COLUMN city TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles'
      AND column_name = 'company_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN company_name TEXT;
  END IF;
END $$;

-- This view exposes only safe fields for public-facing pages
CREATE OR REPLACE VIEW public_driver_profiles AS
SELECT
  id,
  nome,
  profissao,
  avatar_url,
  city,
  company_name,
  celular,
  stripe_account_charges_enabled
FROM profiles
WHERE tipo = 'motorista';

-- Grant read access on the view to anon and authenticated roles
GRANT SELECT ON public_driver_profiles TO anon;
GRANT SELECT ON public_driver_profiles TO authenticated;

-- ============================================================================
-- RATE_LIMITS: Create general-purpose rate_limits table for API rate limiting
-- ============================================================================

CREATE TABLE IF NOT EXISTS rate_limits (
  id BIGSERIAL PRIMARY KEY,
  key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_key_created ON rate_limits(key, created_at);

ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Only service role can access rate_limits
CREATE POLICY "Service role full access to rate_limits"
  ON rate_limits FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Comments
COMMENT ON TABLE rate_limits IS 'General-purpose API rate limiting table';
COMMENT ON VIEW public_driver_profiles IS 'Safe public view of driver profiles for payment pages (excludes cpf, stripe_account_id, pix_key)';
