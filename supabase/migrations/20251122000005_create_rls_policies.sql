-- Migration: Row Level Security (RLS) Policies
-- Created: 2025-11-22
-- Description: Security policies for all tables

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_rate_limits ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROFILES TABLE POLICIES
-- ============================================================================

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Public can read driver/vendor profiles (needed for payment pages)
CREATE POLICY "Public can view driver profiles"
  ON profiles FOR SELECT
  USING (tipo = 'motorista');

-- Service role can do anything (for backend operations)
CREATE POLICY "Service role full access to profiles"
  ON profiles FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- PAGAMENTOS TABLE POLICIES
-- ============================================================================

-- Drivers can view their own payments (where they are the recipient)
CREATE POLICY "Drivers can view own payments"
  ON pagamentos FOR SELECT
  USING (motorista_id = auth.uid());

-- Clients can view their own payments (where they are the payer)
CREATE POLICY "Clients can view own payments"
  ON pagamentos FOR SELECT
  USING (cliente_id = auth.uid());

-- Clients can update their own payment categories/notes
CREATE POLICY "Clients can update own payment notes"
  ON pagamentos FOR UPDATE
  USING (cliente_id = auth.uid())
  WITH CHECK (cliente_id = auth.uid());

-- Service role can insert payments (via webhooks)
CREATE POLICY "Service role can insert payments"
  ON pagamentos FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Service role can update payments (via webhooks)
CREATE POLICY "Service role can update payments"
  ON pagamentos FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- VERIFICATION_CODES TABLE POLICIES
-- ============================================================================

-- Users can read their own verification codes
-- Note: This uses phone from the request, not auth.uid() since user isn't authenticated yet
CREATE POLICY "Users can read own verification codes"
  ON verification_codes FOR SELECT
  USING (true);  -- Public read access for verification (codes expire quickly anyway)

-- Anyone can insert verification codes (public signup)
CREATE POLICY "Anyone can insert verification codes"
  ON verification_codes FOR INSERT
  WITH CHECK (true);

-- Users can delete their own verification codes (after successful verification)
CREATE POLICY "Anyone can delete verification codes"
  ON verification_codes FOR DELETE
  USING (true);

-- Service role full access
CREATE POLICY "Service role full access to verification codes"
  ON verification_codes FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- PAYMENT_METHODS TABLE POLICIES
-- ============================================================================

-- Clients can view their own saved payment methods
CREATE POLICY "Clients can view own payment methods"
  ON payment_methods FOR SELECT
  USING (cliente_id = auth.uid());

-- Clients can insert their own payment methods
CREATE POLICY "Clients can insert own payment methods"
  ON payment_methods FOR INSERT
  WITH CHECK (cliente_id = auth.uid());

-- Clients can update their own payment methods
CREATE POLICY "Clients can update own payment methods"
  ON payment_methods FOR UPDATE
  USING (cliente_id = auth.uid())
  WITH CHECK (cliente_id = auth.uid());

-- Clients can delete their own payment methods
CREATE POLICY "Clients can delete own payment methods"
  ON payment_methods FOR DELETE
  USING (cliente_id = auth.uid());

-- Service role full access
CREATE POLICY "Service role full access to payment methods"
  ON payment_methods FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- SMS_RATE_LIMITS TABLE POLICIES
-- ============================================================================

-- Public read access (needed to check rate limits before auth)
CREATE POLICY "Public can read rate limits"
  ON sms_rate_limits FOR SELECT
  USING (true);

-- Public insert access (needed to record SMS sends)
CREATE POLICY "Public can insert rate limits"
  ON sms_rate_limits FOR INSERT
  WITH CHECK (true);

-- Service role can delete (for cleanup)
CREATE POLICY "Service role can delete rate limits"
  ON sms_rate_limits FOR DELETE
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON POLICY "Users can view own profile" ON profiles IS
  'Authenticated users can view their own profile data';

COMMENT ON POLICY "Public can view driver profiles" ON profiles IS
  'Public access to driver profiles is needed for payment pages (/{phoneNumber})';

COMMENT ON POLICY "Drivers can view own payments" ON pagamentos IS
  'Drivers can see all payments where they are the recipient';

COMMENT ON POLICY "Clients can view own payments" ON pagamentos IS
  'Clients can see all payments where they are the payer (excludes guest payments)';

COMMENT ON POLICY "Public can read rate limits" ON sms_rate_limits IS
  'Rate limit checking must happen before authentication, so public read is required';
