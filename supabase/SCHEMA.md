# Pixter Database Schema

This document describes the database schema for Pixter based on the codebase analysis.

## Tables

### profiles
Main user profile table for both drivers (vendors) and clients.

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Basic Info
  nome TEXT,
  email TEXT,
  celular TEXT UNIQUE,  -- Phone number in E.164 format (e.g., +5511999999999)
  tipo TEXT NOT NULL,   -- 'motorista' or 'cliente'
  cpf TEXT,
  profissao TEXT,
  data_nascimento DATE,
  verified BOOLEAN DEFAULT false,

  -- Avatar & Selfie
  avatar_url TEXT,      -- Path to selected avatar (e.g., /images/avatars/avatar_1.png)
  selfie_url TEXT,      -- Uploaded selfie URL from storage

  -- Stripe Connect (for drivers only)
  stripe_account_id TEXT UNIQUE,                    -- Stripe Connect Account ID
  stripe_account_status TEXT,                       -- 'pending', 'verified', 'restricted', or NULL
  stripe_account_charges_enabled BOOLEAN,
  stripe_account_details_submitted BOOLEAN,
  stripe_account_payouts_enabled BOOLEAN,

  -- Stripe Customer (for clients only)
  stripe_customer_id TEXT UNIQUE,                   -- Stripe Customer ID

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_profiles_celular ON profiles(celular);
CREATE INDEX idx_profiles_tipo ON profiles(tipo);
CREATE INDEX idx_profiles_stripe_account_id ON profiles(stripe_account_id);
CREATE INDEX idx_profiles_stripe_customer_id ON profiles(stripe_customer_id);
```

### verification_codes
Stores phone verification codes sent via Twilio.

```sql
CREATE TABLE verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,              -- Phone number in E.164 format
  code TEXT NOT NULL,                -- 6-digit verification code
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,

  -- Constraints
  UNIQUE(phone)  -- Only one active code per phone at a time (upsert logic)
);

-- Indexes
CREATE INDEX idx_verification_codes_phone ON verification_codes(phone);
CREATE INDEX idx_verification_codes_expires_at ON verification_codes(expires_at);
```

### pagamentos
Payment transaction history.

```sql
CREATE TABLE pagamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Stripe References
  stripe_payment_id TEXT UNIQUE NOT NULL,           -- Stripe PaymentIntent ID
  stripe_charge_id TEXT,                             -- Stripe Charge ID (if available)

  -- Relationships
  motorista_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES profiles(id) ON DELETE SET NULL,  -- NULL if guest payment

  -- Payment Details
  valor DECIMAL(10, 2) NOT NULL,                    -- Amount in BRL (e.g., 10.50)
  moeda TEXT DEFAULT 'brl',                         -- Currency code
  status TEXT NOT NULL,                              -- 'succeeded', 'pending', 'failed', etc.
  metodo TEXT,                                       -- 'card', 'pix', 'apple_pay', etc.

  -- Application Fee (Pixter's commission)
  application_fee_amount DECIMAL(10, 2),            -- Pixter's commission in BRL
  net_amount DECIMAL(10, 2),                        -- Amount after commission

  -- Additional Info
  descricao TEXT,
  metadata JSONB,                                    -- Additional metadata from Stripe

  -- Receipt
  receipt_url TEXT,                                  -- Stripe receipt URL
  receipt_number TEXT UNIQUE,                        -- Unique receipt number for manual entry

  -- Client categorization (for expense tracking)
  categoria TEXT,                                    -- 'business', 'personal', etc.
  notas TEXT,                                        -- Client notes

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_pagamentos_motorista_id ON pagamentos(motorista_id);
CREATE INDEX idx_pagamentos_cliente_id ON pagamentos(cliente_id);
CREATE INDEX idx_pagamentos_stripe_payment_id ON pagamentos(stripe_payment_id);
CREATE INDEX idx_pagamentos_receipt_number ON pagamentos(receipt_number);
CREATE INDEX idx_pagamentos_created_at ON pagamentos(created_at);
CREATE INDEX idx_pagamentos_status ON pagamentos(status);
```

### payment_methods (for clients)
Stores saved payment methods for registered clients.

```sql
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  cliente_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Stripe Reference
  stripe_payment_method_id TEXT UNIQUE NOT NULL,    -- Stripe PaymentMethod ID

  -- Card Details (from Stripe)
  tipo TEXT,                                         -- 'card', 'pix', etc.
  card_brand TEXT,                                   -- 'visa', 'mastercard', etc.
  card_last4 TEXT,                                   -- Last 4 digits
  card_exp_month INTEGER,
  card_exp_year INTEGER,

  -- Settings
  is_default BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_payment_methods_cliente_id ON payment_methods(cliente_id);
CREATE INDEX idx_payment_methods_stripe_payment_method_id ON payment_methods(stripe_payment_method_id);
```

## Storage Buckets

### selfies
Stores driver selfie verification photos.

- **Path structure**: `public/selfies/{userId}/{filename}.jpg`
- **Access**: Public (read), Authenticated (write - own files only)
- **RLS**: Users can only upload to their own folder

### avatars (if custom uploads are added)
Currently avatars are static files in `/public/images/avatars/`.

## Row Level Security (RLS) Policies

### profiles
```sql
-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Public can read driver profiles (for payment pages)
CREATE POLICY "Public can view driver profiles"
  ON profiles FOR SELECT
  USING (tipo = 'motorista');
```

### pagamentos
```sql
-- Drivers can view their own payments
CREATE POLICY "Drivers can view own payments"
  ON pagamentos FOR SELECT
  USING (motorista_id = auth.uid());

-- Clients can view their own payments
CREATE POLICY "Clients can view own payments"
  ON pagamentos FOR SELECT
  USING (cliente_id = auth.uid());

-- Service role can insert payments (via webhooks)
CREATE POLICY "Service role can insert payments"
  ON pagamentos FOR INSERT
  WITH CHECK (true);
```

### verification_codes
```sql
-- Users can insert/read their own verification codes
CREATE POLICY "Users can manage own verification codes"
  ON verification_codes
  USING (phone = auth.jwt() -> 'phone');
```

### payment_methods
```sql
-- Clients can manage their own payment methods
CREATE POLICY "Clients can manage own payment methods"
  ON payment_methods
  USING (cliente_id = auth.uid());
```

## Database Functions & Triggers

### handle_new_user
Trigger function to create profile when a new user signs up.

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, tipo, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'tipo', 'cliente'),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### update_updated_at_column
Generic trigger to update `updated_at` timestamp.

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pagamentos_updated_at BEFORE UPDATE ON pagamentos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Notes

- All phone numbers are stored in E.164 format: `+5511999999999`
- Amounts are stored in BRL (Brazilian Real) as decimal(10,2)
- Stripe IDs are stored for easy reconciliation
- The system supports both authenticated and guest payments
- Drivers must connect their Stripe account before receiving payments
- Clients can pay without an account, but can create one to save payment methods and view history
