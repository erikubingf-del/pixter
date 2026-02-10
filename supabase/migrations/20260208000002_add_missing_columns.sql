-- Migration: Add missing columns to profiles table
-- Created: 2026-02-08
-- Description: Add columns that are referenced in the codebase but missing from the schema

DO $$
BEGIN
  -- onboarding_completed: Tracks whether a driver has completed their onboarding flow
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='onboarding_completed') THEN
    ALTER TABLE profiles ADD COLUMN onboarding_completed BOOLEAN DEFAULT false;
  END IF;

  -- company_name: Business/company name for drivers
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='company_name') THEN
    ALTER TABLE profiles ADD COLUMN company_name TEXT;
  END IF;

  -- address: Driver's address
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='address') THEN
    ALTER TABLE profiles ADD COLUMN address TEXT;
  END IF;

  -- default_payment_method: Client's default Stripe payment method ID
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='default_payment_method') THEN
    ALTER TABLE profiles ADD COLUMN default_payment_method TEXT;
  END IF;

  -- city: Already may exist from another migration, add if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='city') THEN
    ALTER TABLE profiles ADD COLUMN city TEXT;
  END IF;
END $$;

-- Comments
COMMENT ON COLUMN profiles.onboarding_completed IS 'Whether the driver has completed their onboarding flow (Stripe Connect, selfie, etc.)';
COMMENT ON COLUMN profiles.company_name IS 'Business name for drivers/vendors';
COMMENT ON COLUMN profiles.address IS 'Address of the driver/vendor';
COMMENT ON COLUMN profiles.default_payment_method IS 'Stripe Payment Method ID for the client default payment method';
