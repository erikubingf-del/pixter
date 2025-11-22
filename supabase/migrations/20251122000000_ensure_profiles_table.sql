-- Migration: Ensure profiles table exists with all required columns
-- Created: 2025-11-22
-- Description: Creates profiles table if not exists, adds missing columns if exists
-- Run this FIRST before other migrations

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Basic Info
  nome TEXT,
  email TEXT,
  celular TEXT UNIQUE,
  tipo TEXT NOT NULL DEFAULT 'cliente',
  verified BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add columns if they don't exist (safe to re-run)
DO $$
BEGIN
  -- Personal info columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='cpf') THEN
    ALTER TABLE profiles ADD COLUMN cpf TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='profissao') THEN
    ALTER TABLE profiles ADD COLUMN profissao TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='data_nascimento') THEN
    ALTER TABLE profiles ADD COLUMN data_nascimento DATE;
  END IF;

  -- Avatar & Selfie columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='avatar_url') THEN
    ALTER TABLE profiles ADD COLUMN avatar_url TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='selfie_url') THEN
    ALTER TABLE profiles ADD COLUMN selfie_url TEXT;
  END IF;

  -- Stripe Connect columns (for drivers)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='stripe_account_id') THEN
    ALTER TABLE profiles ADD COLUMN stripe_account_id TEXT UNIQUE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='stripe_account_status') THEN
    ALTER TABLE profiles ADD COLUMN stripe_account_status TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='stripe_account_charges_enabled') THEN
    ALTER TABLE profiles ADD COLUMN stripe_account_charges_enabled BOOLEAN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='stripe_account_details_submitted') THEN
    ALTER TABLE profiles ADD COLUMN stripe_account_details_submitted BOOLEAN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='stripe_account_payouts_enabled') THEN
    ALTER TABLE profiles ADD COLUMN stripe_account_payouts_enabled BOOLEAN;
  END IF;

  -- Stripe Customer columns (for clients)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='stripe_customer_id') THEN
    ALTER TABLE profiles ADD COLUMN stripe_customer_id TEXT UNIQUE;
  END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_profiles_celular ON profiles(celular);
CREATE INDEX IF NOT EXISTS idx_profiles_tipo ON profiles(tipo);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_account_id ON profiles(stripe_account_id);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_cpf ON profiles(cpf);

-- Comments
COMMENT ON TABLE profiles IS 'User profiles for both drivers (motoristas) and clients';
COMMENT ON COLUMN profiles.tipo IS 'User type: motorista or cliente';
COMMENT ON COLUMN profiles.celular IS 'Phone number in E.164 format (+5511999999999)';
COMMENT ON COLUMN profiles.stripe_account_id IS 'Stripe Connect Account ID for drivers';
COMMENT ON COLUMN profiles.stripe_customer_id IS 'Stripe Customer ID for clients';
COMMENT ON COLUMN profiles.verified IS 'Whether phone number has been verified';

-- Create or replace update trigger
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

-- Create or replace handle_new_user trigger function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, tipo, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'tipo', 'cliente'),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
