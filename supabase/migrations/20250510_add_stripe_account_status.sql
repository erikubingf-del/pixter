-- Add stripe_account_status to profiles table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'profiles'
    ) THEN
        ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_account_status text;
        COMMENT ON COLUMN profiles.stripe_account_status IS 'Status of the Stripe account: pending, verified, restricted, or null if not connected';
    END IF;
END $$;

-- Create an enum type for stripe account status
DO $$ BEGIN
    CREATE TYPE stripe_account_status_enum AS ENUM ('pending', 'verified', 'restricted');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
