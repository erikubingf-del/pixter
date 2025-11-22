-- Make stripe_payment_id optional for Pix payments
-- Pix payments will use a generated PIX-XXXXXX ID in receipt_number instead

ALTER TABLE pagamentos
ALTER COLUMN stripe_payment_id DROP NOT NULL;

-- Update comment
COMMENT ON COLUMN pagamentos.stripe_payment_id IS 'Stripe PaymentIntent ID (NULL for Pix payments)';
