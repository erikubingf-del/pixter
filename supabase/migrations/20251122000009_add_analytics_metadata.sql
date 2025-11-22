-- Add analytics-focused metadata for future monetization
-- This data becomes valuable for B2B partnerships

-- Add computed columns for analytics
ALTER TABLE pagamentos
ADD COLUMN IF NOT EXISTS payment_day_of_week TEXT,
ADD COLUMN IF NOT EXISTS payment_hour INTEGER,
ADD COLUMN IF NOT EXISTS is_repeat_customer BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS customer_identifier TEXT; -- Hash of phone/email for repeat tracking

-- Create function to auto-populate analytics fields
CREATE OR REPLACE FUNCTION populate_payment_analytics()
RETURNS TRIGGER AS $$
BEGIN
  -- Extract day of week (0=Sunday, 6=Saturday)
  NEW.payment_day_of_week := to_char(NEW.created_at, 'Day');

  -- Extract hour (0-23)
  NEW.payment_hour := EXTRACT(HOUR FROM NEW.created_at);

  -- Check if repeat customer (if customer_identifier exists in previous payments)
  IF NEW.customer_identifier IS NOT NULL THEN
    NEW.is_repeat_customer := EXISTS (
      SELECT 1 FROM pagamentos
      WHERE customer_identifier = NEW.customer_identifier
      AND id != NEW.id
      AND motorista_id = NEW.motorista_id
      LIMIT 1
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_populate_payment_analytics ON pagamentos;
CREATE TRIGGER trigger_populate_payment_analytics
  BEFORE INSERT OR UPDATE ON pagamentos
  FOR EACH ROW
  EXECUTE FUNCTION populate_payment_analytics();

-- Create indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_pagamentos_day_of_week ON pagamentos(payment_day_of_week);
CREATE INDEX IF NOT EXISTS idx_pagamentos_hour ON pagamentos(payment_hour);
CREATE INDEX IF NOT EXISTS idx_pagamentos_repeat ON pagamentos(is_repeat_customer);
CREATE INDEX IF NOT EXISTS idx_pagamentos_customer_id ON pagamentos(customer_identifier);

-- Comments
COMMENT ON COLUMN pagamentos.payment_day_of_week IS 'Day of week for analytics (Monday-Sunday)';
COMMENT ON COLUMN pagamentos.payment_hour IS 'Hour of day (0-23) for peak time analysis';
COMMENT ON COLUMN pagamentos.is_repeat_customer IS 'Whether customer has paid this driver before';
COMMENT ON COLUMN pagamentos.customer_identifier IS 'Hashed customer ID for tracking without PII';
