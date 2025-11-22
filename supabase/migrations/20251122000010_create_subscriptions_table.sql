-- Create subscriptions table for premium features
-- Prepares for future monetization without complexity now

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User reference
  motorista_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Subscription details
  plan TEXT NOT NULL, -- 'free', 'premium', 'enterprise'
  status TEXT NOT NULL, -- 'active', 'cancelled', 'expired', 'trial'

  -- Pricing
  monthly_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'brl',

  -- Features (JSON for flexibility)
  features JSONB DEFAULT '{
    "fast_payouts_per_month": 0,
    "instant_payout_discount": 0,
    "advanced_analytics": false,
    "invoice_generation": false,
    "priority_support": false,
    "whatsapp_notifications": false
  }'::jsonb,

  -- Billing
  billing_cycle_start DATE,
  billing_cycle_end DATE,
  next_billing_date DATE,

  -- Payment tracking
  stripe_subscription_id TEXT UNIQUE,
  last_payment_date TIMESTAMP WITH TIME ZONE,
  last_payment_amount DECIMAL(10, 2),

  -- Usage tracking (for tiered features)
  usage_metadata JSONB DEFAULT '{
    "fast_payouts_used": 0,
    "instant_payouts_used": 0,
    "invoices_generated": 0
  }'::jsonb,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  trial_ends_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_motorista_id ON subscriptions(motorista_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan ON subscriptions(plan);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_billing ON subscriptions(next_billing_date);

-- Auto-update timestamp
CREATE TRIGGER trigger_update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_pagamentos_updated_at(); -- Reuse existing function

-- Comments
COMMENT ON TABLE subscriptions IS 'Premium subscriptions for drivers (future monetization)';
COMMENT ON COLUMN subscriptions.plan IS 'Subscription tier: free, premium, enterprise';
COMMENT ON COLUMN subscriptions.status IS 'Current status: active, cancelled, expired, trial';
COMMENT ON COLUMN subscriptions.features IS 'JSON object with enabled features for this plan';
COMMENT ON COLUMN subscriptions.usage_metadata IS 'Track usage of tiered features (fast payouts, etc.)';

-- Insert default free subscription for all existing drivers
INSERT INTO subscriptions (motorista_id, plan, status, monthly_price)
SELECT
  id,
  'free',
  'active',
  0
FROM profiles
WHERE tipo = 'motorista'
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (motorista_id IN (
    SELECT id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update own subscription"
  ON subscriptions FOR UPDATE
  USING (motorista_id IN (
    SELECT id FROM profiles WHERE id = auth.uid()
  ));
