-- Migration: Create pagamentos (payments) table
-- Created: 2025-11-22
-- Description: Stores all payment transactions for drivers and clients

CREATE TABLE IF NOT EXISTS pagamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Stripe References
  stripe_payment_id TEXT UNIQUE NOT NULL,
  stripe_charge_id TEXT,

  -- Relationships
  motorista_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES profiles(id) ON DELETE SET NULL,  -- NULL if guest payment

  -- Payment Details
  valor DECIMAL(10, 2) NOT NULL CHECK (valor > 0),
  moeda TEXT DEFAULT 'brl' NOT NULL,
  status TEXT NOT NULL,
  metodo TEXT,  -- 'card', 'pix', 'apple_pay', 'google_pay'

  -- Application Fee (Pixter's commission)
  application_fee_amount DECIMAL(10, 2),
  net_amount DECIMAL(10, 2),  -- Amount after commission

  -- Receipt & Invoice
  receipt_url TEXT,
  receipt_number TEXT UNIQUE,
  receipt_pdf_url TEXT,  -- URL to generated PDF receipt

  -- Client categorization (for expense tracking)
  categoria TEXT,  -- 'business', 'personal', 'transport', 'food', etc.
  notas TEXT,      -- Client notes

  -- Additional Info
  descricao TEXT,
  metadata JSONB,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_pagamentos_motorista_id ON pagamentos(motorista_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_cliente_id ON pagamentos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_stripe_payment_id ON pagamentos(stripe_payment_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_stripe_charge_id ON pagamentos(stripe_charge_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_receipt_number ON pagamentos(receipt_number);
CREATE INDEX IF NOT EXISTS idx_pagamentos_created_at ON pagamentos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pagamentos_status ON pagamentos(status);
CREATE INDEX IF NOT EXISTS idx_pagamentos_metodo ON pagamentos(metodo);

-- Comments for documentation
COMMENT ON TABLE pagamentos IS 'Payment transaction history for all drivers and clients';
COMMENT ON COLUMN pagamentos.stripe_payment_id IS 'Stripe PaymentIntent ID';
COMMENT ON COLUMN pagamentos.stripe_charge_id IS 'Stripe Charge ID (if available)';
COMMENT ON COLUMN pagamentos.motorista_id IS 'Driver/vendor who received the payment';
COMMENT ON COLUMN pagamentos.cliente_id IS 'Client who made the payment (NULL for guest payments)';
COMMENT ON COLUMN pagamentos.valor IS 'Total payment amount in BRL';
COMMENT ON COLUMN pagamentos.application_fee_amount IS 'Pixter commission amount (4%)';
COMMENT ON COLUMN pagamentos.net_amount IS 'Net amount received by driver after commission';
COMMENT ON COLUMN pagamentos.receipt_number IS 'Unique receipt identifier for manual entry (e.g., PIX-1234567890-ABC123)';
COMMENT ON COLUMN pagamentos.receipt_pdf_url IS 'URL to downloadable PDF receipt';
COMMENT ON COLUMN pagamentos.categoria IS 'Expense category for client accounting';
COMMENT ON COLUMN pagamentos.metadata IS 'Additional data from Stripe (phone numbers, etc.)';

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_pagamentos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_pagamentos_updated_at
  BEFORE UPDATE ON pagamentos
  FOR EACH ROW
  EXECUTE FUNCTION update_pagamentos_updated_at();
