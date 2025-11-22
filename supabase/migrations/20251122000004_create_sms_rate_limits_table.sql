-- Migration: Create sms_rate_limits table
-- Created: 2025-11-22
-- Description: Track SMS sends to prevent abuse and control costs

CREATE TABLE IF NOT EXISTS sms_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Tracking identifiers
  phone TEXT NOT NULL,          -- Phone number receiving SMS
  ip_address TEXT NOT NULL,     -- IP address requesting SMS

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_sms_rate_limits_phone ON sms_rate_limits(phone, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_rate_limits_ip ON sms_rate_limits(ip_address, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_rate_limits_created_at ON sms_rate_limits(created_at);

-- Comments
COMMENT ON TABLE sms_rate_limits IS 'Tracks SMS verification sends for rate limiting';
COMMENT ON COLUMN sms_rate_limits.phone IS 'Phone number that received the SMS';
COMMENT ON COLUMN sms_rate_limits.ip_address IS 'IP address that requested the SMS';
COMMENT ON COLUMN sms_rate_limits.created_at IS 'When the SMS was sent';

-- Function to check if phone number is rate limited
-- Returns true if allowed, false if rate limited
CREATE OR REPLACE FUNCTION check_sms_rate_limit_phone(
  p_phone TEXT,
  p_max_attempts INTEGER DEFAULT 3,
  p_window_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Count SMS sends to this phone in the time window
  SELECT COUNT(*)
  INTO v_count
  FROM sms_rate_limits
  WHERE phone = p_phone
    AND created_at > NOW() - (p_window_minutes || ' minutes')::INTERVAL;

  RETURN v_count < p_max_attempts;
END;
$$ LANGUAGE plpgsql;

-- Function to check if IP address is rate limited
-- Returns true if allowed, false if rate limited
CREATE OR REPLACE FUNCTION check_sms_rate_limit_ip(
  p_ip_address TEXT,
  p_max_attempts INTEGER DEFAULT 10,
  p_window_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Count SMS sends from this IP in the time window
  SELECT COUNT(*)
  INTO v_count
  FROM sms_rate_limits
  WHERE ip_address = p_ip_address
    AND created_at > NOW() - (p_window_minutes || ' minutes')::INTERVAL;

  RETURN v_count < p_max_attempts;
END;
$$ LANGUAGE plpgsql;

-- Function to record SMS send
CREATE OR REPLACE FUNCTION record_sms_send(
  p_phone TEXT,
  p_ip_address TEXT
)
RETURNS void AS $$
BEGIN
  INSERT INTO sms_rate_limits (phone, ip_address)
  VALUES (p_phone, p_ip_address);
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old rate limit records (older than 24 hours)
CREATE OR REPLACE FUNCTION cleanup_old_sms_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM sms_rate_limits
  WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Cron job to clean up old records every 6 hours (requires pg_cron extension)
-- Uncomment if pg_cron is available:
-- SELECT cron.schedule('cleanup-sms-rate-limits', '0 */6 * * *', 'SELECT cleanup_old_sms_rate_limits()');
