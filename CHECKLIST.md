# Pixter MVP Checklist

**Print this or keep it open!** ✅

---

## 🗓️ TODAY - Database Migrations (30 min)

**Location:** Supabase Dashboard → SQL Editor

- [ ] 1. Run `20251122000000_ensure_profiles_table.sql`
- [ ] 2. Run `20251122000001_create_pagamentos_table.sql`
- [ ] 3. Run `20251122000002_create_verification_codes_table.sql`
- [ ] 4. Run `20251122000003_create_payment_methods_table.sql`
- [ ] 5. Run `20251122000004_create_sms_rate_limits_table.sql`
- [ ] 6. Run `20251122000005_create_rls_policies.sql`
- [ ] 7. Create storage bucket: `receipts` (public)
- [ ] 8. Create storage bucket: `selfies` (public)
- [ ] 9. Test payment flow end-to-end

**See:** `supabase/RUN_MIGRATIONS.md` for step-by-step

---

## 📅 THIS WEEK - 5 Core Features

### Feature 1: Pix Payment Integration (4-5 hours)
- [ ] Add Pix button to payment page
- [ ] Pix QR code component
- [ ] Payment status polling
- [ ] Backend: create-pix-payment endpoint
- [ ] Backend: check-pix-status endpoint
- [ ] Update webhook for Pix
- [ ] Success page personalization

### Feature 2: Client Dashboard Real Data (2-3 hours)
- [ ] Fetch payments from database
- [ ] Show payment history
- [ ] Receipt download links
- [ ] Date filters
- [ ] Search functionality

### Feature 3: Post-Payment Account Creation (2-3 hours)
- [ ] Post-payment signup modal
- [ ] Quick phone signup
- [ ] OTP verification
- [ ] Link payment to account
- [ ] Redirect to dashboard

### Feature 4: Manual Invoice Entry (2 hours)
- [ ] "Add Invoice" button
- [ ] Receipt number input
- [ ] Search and link payment
- [ ] Error handling
- [ ] Success confirmation

### Feature 5: SMS Rate Limiting (1-2 hours)
- [ ] Add IP extraction
- [ ] Check rate limits
- [ ] Return 429 if exceeded
- [ ] Record SMS sends
- [ ] Clear error messages

---

## 🧪 TESTING - Before Launch

### Payment Flow
- [ ] Driver registration works
- [ ] Stripe Connect onboarding
- [ ] Test payment R$10.00
- [ ] Payment records in database
- [ ] Net amount = 96% of total
- [ ] Receipt PDF generates
- [ ] Download receipt works

### Pix Flow
- [ ] Pix QR code appears
- [ ] Copy to clipboard works
- [ ] Payment polling works
- [ ] Success page shows

### Client Features
- [ ] Dashboard shows real payments
- [ ] Receipt downloads work
- [ ] Manual invoice entry works
- [ ] Post-payment signup converts

### Security
- [ ] SMS rate limiting active
- [ ] CPF validation working
- [ ] RLS policies enforced
- [ ] No unauthorized access

---

## 🚀 LAUNCH - Production Checklist

### Environment
- [ ] Production .env variables set
- [ ] Stripe live mode configured
- [ ] Webhook URL updated
- [ ] Domain configured
- [ ] SSL certificate active

### Legal
- [ ] Terms of Service page
- [ ] Privacy Policy page
- [ ] LGPD compliance
- [ ] Cookie notice

### Monitoring
- [ ] Error tracking setup (Sentry?)
- [ ] Payment logging
- [ ] Webhook monitoring
- [ ] Uptime alerts

### First Test
- [ ] Real R$1 payment test
- [ ] Verify payout to driver
- [ ] Check all receipts
- [ ] Monitor for 24 hours

---

## 📊 Success Metrics

### Week 1
- [ ] 10 drivers registered
- [ ] 50 payments processed
- [ ] 0 critical errors
- [ ] All receipts generated

### Month 1
- [ ] 100 drivers
- [ ] 1,000 payments
- [ ] R$50,000 GMV
- [ ] 20% client signup rate

---

**Current Status:** Database migrations ready ✅
**Next Step:** Run migrations (30 min)
**After That:** Test payment flow (1 hour)
**Then:** Build Pix integration (5 hours)

---

**Keep this checklist updated as you progress!**
**Total Remaining Time:** ~16-20 hours to MVP launch
