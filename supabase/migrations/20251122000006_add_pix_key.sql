-- Add pix_key field to profiles table for receiving Pix payments
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS pix_key TEXT;

-- Add comment
COMMENT ON COLUMN profiles.pix_key IS 'Pix key for receiving payments (phone, email, CPF/CNPJ, or random key)';
