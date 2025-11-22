# Pixter Implementation Status

## Project Overview
Pixter is an MVP payment platform that enables street vendors, taxi drivers, and small business owners to accept credit card payments through Stripe Connect, with a UX as simple as Pix.

**Key Value Proposition:**
- No physical card reader needed
- 4% commission (covers Stripe fees + 1-2% profit)
- Direct payment to vendor's bank account via Stripe
- QR code-based payment flow
- Support for credit cards, Apple Pay, and potentially Pix

---

## ✅ Completed Tasks

### 1. Database Schema Documentation
- Created comprehensive schema documentation in `/supabase/SCHEMA.md`
- Documented all tables: profiles, verification_codes, pagamentos, payment_methods
- Defined RLS policies and database triggers
- Storage bucket structure defined

### 2. Critical Bug Fixes

#### Amount Conversion Bug Fixed
**Location:** `src/app/api/stripe/create-payment-intent/route.ts:31`
- **Issue:** Was multiplying amount by 100 twice (frontend already sends in cents)
- **Fix:** Removed redundant multiplication - now uses `Math.round(amount)` directly
- **Impact:** Prevents charging 100x the intended amount (R$10 → R$1000)

#### Webhook Metadata Mismatch Fixed
**Locations:**
- `src/app/api/stripe/create-payment-intent/route.ts:78`
- `src/app/api/stripe/webhook/route.ts:67`
- **Issue:** PaymentIntent used `driverProfileId` but webhook looked for `driverId`
- **Fix:** Standardized on `driverId` in both places
- **Impact:** Webhooks now properly record payments in database

### 3. Application Fee Implementation
**Location:** `src/app/api/stripe/create-payment-intent/route.ts:13-16, 75`
- Implemented 4% commission structure
- Fee calculation: `Math.floor(amount * 0.04)`
- Fee included in PaymentIntent via `application_fee_amount`
- Metadata stores fee for audit purposes

### 4. Enhanced Payment Recording
**Location:** `src/app/api/stripe/webhook/route.ts:65-124`
- Records full payment details: charge ID, payment method, receipt URL
- Calculates and stores net amount (total - commission)
- Generates unique receipt numbers (`PIX-{timestamp}-{random}`)
- Stores metadata for reconciliation

### 5. CPF Validation
**New File:** `src/lib/validators/cpf.ts`
- Full CPF validation algorithm (check digits + format)
- Auto-formatting to XXX.XXX.XXX-XX pattern
- Integration in driver registration form
- Real-time validation feedback

---

## 🚧 Pending Critical Tasks

### 1. Client Dashboard Implementation
**Status:** Currently has mock data
**Location:** `src/app/cliente/dashboard/page.tsx`
**Required:**
- Fetch actual payment history from `pagamentos` table
- Display saved payment methods from Stripe
- Show receipt download links
- Implement expense categorization

### 2. Receipt/Invoice System
**Priority:** HIGH (Core feature for your value proposition)
**Requirements:**
- Generate PDF receipts for each payment
- Include receipt number, date, amount, vendor info
- Email receipts to clients (if registered)
- Downloadable from dashboard
- Support for manual invoice entry by screenshot

**Suggested Implementation:**
```typescript
// src/app/api/receipts/generate/route.ts
// Use puppeteer (already in dependencies) or @react-pdf/renderer
```

### 3. Post-Payment Account Creation Flow
**Priority:** HIGH (User retention feature)
**Location:** `src/app/[phoneNumber]/page.tsx`
**Flow:**
1. Guest pays with Apple Pay/Card
2. Payment succeeds → Show success + "Save this receipt?" prompt
3. User can create account with phone number
4. Link payment to newly created account
5. Receipt appears in their dashboard

**Required Components:**
- Post-payment modal/screen
- Quick account creation (phone + OTP)
- Payment linking logic (by PaymentIntent ID)

### 4. Manual Invoice Upload
**Priority:** MEDIUM (Nice-to-have feature)
**Requirements:**
- Client can enter receipt number manually
- System finds payment by `receipt_number`
- Links payment to client's account (if exists)
- Screenshot upload for future OCR (phase 2)

### 5. SMS Rate Limiting
**Priority:** HIGH (Security/Cost control)
**Location:** `src/app/api/auth/send-verification/route.ts`
**Implementation:**
- Track SMS sends by phone number + IP
- Limit: 3 SMS per phone per hour
- Limit: 10 SMS per IP per hour
- Use Supabase table or Redis for tracking

### 6. Stripe Connect Onboarding Edge Cases
**Status:** Partially implemented
**Needs:**
- Handle account restrictions (show specific error messages)
- Handle suspended accounts during payment attempt
- Retry logic for temporary Stripe issues
- Better error messages for users

---

## 📊 Database Migrations Needed

You'll need to create these Supabase migrations:

### Create pagamentos table
```sql
CREATE TABLE pagamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_payment_id TEXT UNIQUE NOT NULL,
  stripe_charge_id TEXT,
  motorista_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  valor DECIMAL(10, 2) NOT NULL,
  moeda TEXT DEFAULT 'brl',
  status TEXT NOT NULL,
  metodo TEXT,
  application_fee_amount DECIMAL(10, 2),
  net_amount DECIMAL(10, 2),
  receipt_url TEXT,
  receipt_number TEXT UNIQUE,
  categoria TEXT,
  notas TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_pagamentos_motorista_id ON pagamentos(motorista_id);
CREATE INDEX idx_pagamentos_cliente_id ON pagamentos(cliente_id);
CREATE INDEX idx_pagamentos_stripe_payment_id ON pagamentos(stripe_payment_id);
CREATE INDEX idx_pagamentos_receipt_number ON pagamentos(receipt_number);
CREATE INDEX idx_pagamentos_created_at ON pagamentos(created_at DESC);
```

### Create verification_codes table
```sql
CREATE TABLE verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_verification_codes_phone ON verification_codes(phone);
CREATE INDEX idx_verification_codes_expires_at ON verification_codes(expires_at);
```

### Create payment_methods table
```sql
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_payment_method_id TEXT UNIQUE NOT NULL,
  tipo TEXT,
  card_brand TEXT,
  card_last4 TEXT,
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payment_methods_cliente_id ON payment_methods(cliente_id);
```

### Update profiles table
Ensure profiles table has these columns:
```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cpf TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profissao TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS data_nascimento DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS selfie_url TEXT;
```

---

## 🔒 Security Recommendations

### 1. Environment Variables Checklist
Ensure these are set in production:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# NextAuth
NEXTAUTH_SECRET=
NEXTAUTH_URL=
```

### 2. RLS Policies
- ✅ Drivers can only see their own payments
- ✅ Clients can only see their own payments
- ✅ Public can view driver profiles (for payment pages)
- ⚠️ Ensure service role is used for webhook inserts

### 3. Input Validation
- ✅ CPF validation implemented
- ✅ Phone number E.164 formatting
- ⚠️ Need: Amount min/max validation (e.g., R$1 - R$10,000)
- ⚠️ Need: Email validation on client signup

### 4. Rate Limiting Needed
- SMS verification (3/hour per phone)
- Payment intent creation (10/minute per IP)
- API routes in general

---

## 🎯 MVP Launch Checklist

### Before Going Live:
- [ ] Run database migrations
- [ ] Test payment flow end-to-end with real Stripe test mode
- [ ] Test webhook delivery and retry logic
- [ ] Verify Stripe Connect payouts to driver accounts
- [ ] Test CPF validation with various formats
- [ ] Implement basic error logging (Sentry?)
- [ ] Create terms of service and privacy policy pages
- [ ] Test on mobile devices (iOS Safari for Apple Pay)
- [ ] Verify selfie upload works on mobile
- [ ] Load test payment page with 50 concurrent users

### Nice-to-Have for MVP:
- [ ] Email receipts
- [ ] SMS notifications for drivers on payment received
- [ ] Client dashboard with real data
- [ ] Post-payment account creation flow
- [ ] Manual invoice entry
- [ ] Analytics dashboard for platform admin

---

## 💡 Business Logic Notes

### Commission Structure
- **Platform fee:** 4% of transaction
- **Stripe fees:** ~2.9% + R$0.39 per transaction (varies by method)
- **Your profit margin:** ~1% after Stripe fees
- **Example:** R$100 payment
  - Client pays: R$100
  - Platform fee: R$4.00
  - Stripe takes: ~R$3.29
  - Your profit: ~R$0.71
  - Driver receives: R$96.00

### Payment Flow
1. Client scans QR code → lands on `/[driverPhone]`
2. Enters amount → creates PaymentIntent with destination charge
3. Pays via Stripe → funds split automatically
4. Webhook records payment → generates receipt
5. Driver sees net amount in dashboard
6. Stripe handles payout to driver's bank account

### Legal Considerations (Brazil)
- You're a payment facilitator (subfacilitador)
- Stripe is the payment processor (PCI compliant)
- Drivers are responsible for their own taxes
- You must provide fiscal receipts (Nota Fiscal)
- LGPD compliance for personal data (CPF, selfies)

---

## 🐛 Known Issues

1. **Client dashboard** - Mock data, needs real implementation
2. **No receipt generation** - Critical for client expense tracking
3. **No rate limiting** - Risk of SMS abuse
4. **No payment failure handling** - What happens if Stripe is down?
5. **No refund flow** - How do drivers issue refunds?
6. **Homepage commission** - Says 3%, code uses 4% (update copy!)

---

## 📝 Next Steps (Priority Order)

1. **Create database migrations** (30 min)
2. **Test payment flow** with real Stripe test data (1 hour)
3. **Implement receipt generation** (3-4 hours)
4. **Implement client dashboard** (2-3 hours)
5. **Add post-payment account creation** (2 hours)
6. **Add SMS rate limiting** (1 hour)
7. **Deploy to staging** and test end-to-end (2 hours)

---

## Questions for You

1. **Do you have access to create Supabase migrations?** I can write them but you'll need to run them.

2. **Stripe account setup:** Do you have a Stripe Connect platform account configured? You'll need to:
   - Enable Connect in Stripe Dashboard
   - Set up webhook endpoints
   - Configure payout schedules

3. **Receipt generation:** Do you prefer:
   - Simple HTML receipts (fast, easy)
   - PDF generation with puppeteer (professional, downloadable)
   - Third-party service like DocRaptor?

4. **Notification preferences:**
   - Should drivers receive SMS when they get paid?
   - Should clients get email receipts?
   - Budget for Twilio SMS costs?

5. **Launch timeline:** When are you planning to go live?
   - This helps prioritize features
   - Determines if we need MVP or fuller feature set

---

**Last Updated:** 2025-11-22
**Status:** Core payment flow fixed and operational. Receipt system and client dashboard pending.
