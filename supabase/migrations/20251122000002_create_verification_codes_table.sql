-- Migration: Create verification_codes table
-- Created: 2025-11-22
-- Description: Stores phone verification codes for OTP authentication

CREATE TABLE IF NOT EXISTS verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Phone and Code
  phone TEXT NOT NULL UNIQUE,  -- E.164 format (e.g., +5511999999999)
  code TEXT NOT NULL,          -- 6-digit verification code

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_verification_codes_phone ON verification_codes(phone);
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires_at ON verification_codes(expires_at);

-- Comments
COMMENT ON TABLE verification_codes IS 'Phone verification codes for OTP-based authentication';
COMMENT ON COLUMN verification_codes.phone IS 'Phone number in E.164 format (+5511999999999)';
COMMENT ON COLUMN verification_codes.code IS '6-digit verification code sent via SMS';
COMMENT ON COLUMN verification_codes.expires_at IS 'Expiration timestamp (typically 10 minutes from creation)';

-- Function to clean up expired codes (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_verification_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM verification_codes WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a cron job to clean up expired codes every hour (requires pg_cron extension)
-- Uncomment if pg_cron is available:
-- SELECT cron.schedule('cleanup-verification-codes', '0 * * * *', 'SELECT cleanup_expired_verification_codes()');
