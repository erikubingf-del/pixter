-- Migration: Create payment_methods table
-- Created: 2025-11-22
-- Description: Stores saved payment methods for clients (cards, etc.)

CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  cliente_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Stripe Reference
  stripe_payment_method_id TEXT UNIQUE NOT NULL,

  -- Payment Method Details (from Stripe)
  tipo TEXT NOT NULL,  -- 'card', 'pix', etc.

  -- Card-specific fields (NULL for non-card methods)
  card_brand TEXT,              -- 'visa', 'mastercard', 'amex', etc.
  card_last4 TEXT,              -- Last 4 digits
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  card_fingerprint TEXT,        -- Unique card identifier

  -- Settings
  is_default BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payment_methods_cliente_id ON payment_methods(cliente_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_stripe_payment_method_id ON payment_methods(stripe_payment_method_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_is_default ON payment_methods(cliente_id, is_default) WHERE is_default = true;

-- Comments
COMMENT ON TABLE payment_methods IS 'Saved payment methods for registered clients';
COMMENT ON COLUMN payment_methods.cliente_id IS 'Client who owns this payment method';
COMMENT ON COLUMN payment_methods.stripe_payment_method_id IS 'Stripe PaymentMethod ID';
COMMENT ON COLUMN payment_methods.tipo IS 'Payment method type (card, pix, etc.)';
COMMENT ON COLUMN payment_methods.is_default IS 'Whether this is the default payment method for the client';

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_payment_methods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_payment_methods_updated_at
  BEFORE UPDATE ON payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_methods_updated_at();

-- Ensure only one default payment method per client
CREATE OR REPLACE FUNCTION ensure_single_default_payment_method()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    -- Unset other default payment methods for this client
    UPDATE payment_methods
    SET is_default = false
    WHERE cliente_id = NEW.cliente_id
      AND id != NEW.id
      AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ensure_single_default_payment_method
  BEFORE INSERT OR UPDATE ON payment_methods
  FOR EACH ROW
  WHEN (NEW.is_default = true)
  EXECUTE FUNCTION ensure_single_default_payment_method();
