-- ============================================================================
-- FIX: Update handle_new_user trigger to support PHONE signups
-- ============================================================================
-- Issue: Original trigger only handled email signups
--        Phone signups have NEW.email = NULL, but have NEW.phone instead
-- Fix: Update trigger to handle both email and phone signups

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert profile for new user
  -- Handle both email-based and phone-based signups
  INSERT INTO profiles (
    id,
    email,
    celular,
    tipo,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,                                           -- NULL for phone signups, populated for email signups
    NEW.phone,                                           -- Populated for phone signups, NULL for email signups
    COALESCE(NEW.raw_user_meta_data->>'tipo', 'cliente'), -- Default to 'cliente' if not specified
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, profiles.email),       -- Update email if provided
    celular = COALESCE(EXCLUDED.celular, profiles.celular), -- Update phone if provided
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger already exists, no need to recreate
-- But if you need to recreate it:
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW
--   EXECUTE FUNCTION handle_new_user();

COMMENT ON FUNCTION handle_new_user() IS
  'Creates a profile for new users. Handles both email and phone authentication. For phone auth, stores phone in celular column. For email auth, stores email in email column.';
