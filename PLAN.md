# Pixter MVP Implementation Plan

**Target:** Production-ready MVP with core payment features
**Status:** In Progress - Phase 1
**Last Updated:** 2025-11-22

---

## ✅ Phase 1: Critical Bug Fixes (COMPLETED)

### 1.1 Payment System Bugs
- [x] Fix amount conversion bug (was multiplying by 100 twice)
- [x] Fix webhook metadata mismatch (driverId vs driverProfileId)
- [x] Implement 4% application fee
- [x] Enhanced payment recording with net amounts and receipt URLs

### 1.2 Data Validation
- [x] CPF validation library created
- [x] CPF auto-formatting in registration form
- [x] Real-time validation feedback

### 1.3 Documentation
- [x] Database schema documented (SCHEMA.md)
- [x] Implementation status created
- [x] Project overview and business logic documented

---

## 🚧 Phase 2: Database & Infrastructure (IN PROGRESS)

### 2.1 Database Migrations
**Priority:** CRITICAL (Everything depends on this)
**Status:** Pending
**Estimated Time:** 30 minutes

- [ ] Create profiles table migration (if not exists)
- [ ] Create pagamentos table migration
- [ ] Create verification_codes table migration
- [ ] Create payment_methods table migration
- [ ] Create RLS policies for all tables
- [ ] Create database triggers (updated_at, handle_new_user)
- [ ] Create indexes for performance
- [ ] Test migrations in Supabase

**Files to Create:**
- `supabase/migrations/20251122_create_profiles.sql`
- `supabase/migrations/20251122_create_pagamentos.sql`
- `supabase/migrations/20251122_create_verification_codes.sql`
- `supabase/migrations/20251122_create_payment_methods.sql`
- `supabase/migrations/20251122_create_rls_policies.sql`

### 2.2 Stripe Connect Setup Verification
- [ ] Verify Stripe Connect platform account is active
- [ ] Configure webhook endpoint: `/api/stripe/webhook`
- [ ] Add webhook events: `payment_intent.succeeded`, `account.updated`
- [ ] Test webhook delivery with Stripe CLI
- [ ] Verify destination charges are working

---

## 📄 Phase 3: Receipt/Invoice System (NEXT UP)

### 3.1 PDF Receipt Generation
**Priority:** HIGH (Core feature for expense tracking)
**Status:** Pending
**Estimated Time:** 3-4 hours

Based on receipt.pdf provided:
- [ ] Create receipt template matching design
- [ ] Use Puppeteer to generate PDF
- [ ] Include: Receipt number, date, amount, vendor info, payer name
- [ ] Pull vendor address from Stripe Connect account
- [ ] Show payment method (card ending, Apple Pay, Pix)
- [ ] Store PDF in Supabase Storage bucket
- [ ] Generate public URL for download

**Components:**
- [x] Receipt number generation (already in webhook)
- [ ] HTML template for receipt
- [ ] PDF generation endpoint: `/api/receipts/generate`
- [ ] Receipt download endpoint: `/api/receipts/[receiptNumber]`
- [ ] Storage bucket: `receipts/`

**Design Requirements from receipt.pdf:**
- Clean white background with subtle borders
- Pixter logo at top
- Receipt number prominently displayed
- Payment amount in large text
- Vendor info: Name, Address (from Stripe), Phone
- Payer info: Name (or "Guest")
- Payment method: Card ending or "Apple Pay" or "Pix"
- Date and time of payment
- NO taxes, NO trip details
- Footer: "Thank you for your payment"

### 3.2 Receipt API Endpoints
- [ ] `POST /api/receipts/generate` - Generate PDF for payment
- [ ] `GET /api/receipts/[receiptNumber]` - Download PDF
- [ ] `GET /api/receipts/[receiptNumber]/link` - Get shareable link
- [ ] Auto-generate receipt on successful payment (webhook)

---

## 💳 Phase 4: Pix Payment Integration (NEW FEATURE)

### 4.1 Pix API Integration
**Priority:** HIGH (Requested feature, competitive advantage)
**Status:** Pending
**Estimated Time:** 4-5 hours

**Flow:**
1. Client lands on payment page `/{driverPhone}`
2. Sees two buttons: "Pay with Credit Card" | "Pay with Pix"
3. If Pix selected:
   - Client enters amount
   - System calls Stripe Pix API to create payment
   - Displays Pix QR code + copy code button
   - Client copies code → opens bank app → pays
   - Polling mechanism checks payment status every 2s
   - On success → redirect to success page with personalized message

**Components to Build:**
- [ ] Pix payment option UI in `[phoneNumber]/page.tsx`
- [ ] Pix QR code display component
- [ ] Copy-to-clipboard functionality
- [ ] Payment status polling mechanism
- [ ] Backend endpoint: `/api/stripe/create-pix-payment`
- [ ] Backend endpoint: `/api/stripe/check-pix-status/[paymentId]`
- [ ] Update webhook to handle Pix payments

**Stripe Pix Configuration:**
- [ ] Verify Pix is enabled in Stripe account (Brazil only)
- [ ] Configure Pix as payment method in Stripe Connect
- [ ] Test Pix payments in test mode

### 4.2 Enhanced Success Page
**Status:** Pending
**Estimated Time:** 1 hour

- [ ] Personalized success message: "Success, Erik!" (if logged in)
- [ ] Show intimacy: Use first name from profile
- [ ] Receipt download button
- [ ] Account creation prompt (if guest)
- [ ] Payment details summary

---

## 👤 Phase 5: Client Dashboard (Real Data)

### 5.1 Payment History
**Priority:** HIGH
**Status:** Mock data currently
**Estimated Time:** 2-3 hours

- [ ] Fetch payments from `pagamentos` table where `cliente_id = user.id`
- [ ] Display: Date, Amount, Vendor name, Payment method
- [ ] Add receipt download links
- [ ] Pagination (10 per page)
- [ ] Date range filter
- [ ] Search by vendor name
- [ ] Total spent display

**File:** `src/app/cliente/dashboard/page.tsx`

### 5.2 Saved Payment Methods
**Status:** Pending
**Estimated Time:** 2 hours

- [ ] Fetch payment methods from Stripe Customer
- [ ] Display: Card brand, last 4 digits, expiry
- [ ] Add new card functionality
- [ ] Remove card functionality
- [ ] Set default card

### 5.3 Expense Categorization
**Status:** Pending (Nice-to-have for MVP)
**Estimated Time:** 3 hours

- [ ] Add category dropdown to payments (Business, Personal, etc.)
- [ ] Filter by category
- [ ] Export filtered payments to CSV
- [ ] Email filtered receipts

---

## 📱 Phase 6: Post-Payment Account Creation

### 6.1 Guest Payment → Account Prompt
**Priority:** HIGH (User acquisition)
**Status:** Pending
**Estimated Time:** 2-3 hours

**Flow:**
1. Guest pays with Apple Pay/Card
2. Payment succeeds → Success page
3. Show: "Save this receipt? Create account in 30 seconds"
4. Quick signup: Phone + OTP (no password)
5. Link payment to new account
6. Redirect to client dashboard with payment visible

**Components:**
- [ ] Post-payment modal component
- [ ] Quick signup form (phone only)
- [ ] OTP verification
- [ ] Payment linking logic (by PaymentIntent ID or receipt number)
- [ ] Success animation

**Files:**
- [ ] `src/components/PostPaymentSignup.tsx`
- [ ] `src/app/api/auth/link-payment/route.ts`

### 6.2 Manual Invoice Entry
**Priority:** MEDIUM
**Status:** Pending
**Estimated Time:** 2 hours

- [ ] "Add Invoice Manually" button in dashboard
- [ ] Input field for receipt number (from screenshot)
- [ ] Search payment by receipt_number
- [ ] Link to user's account if found
- [ ] Error handling: Invalid number, already claimed, etc.

---

## 🔒 Phase 7: Security & Rate Limiting

### 7.1 SMS Rate Limiting
**Priority:** HIGH (Cost control)
**Status:** Pending
**Estimated Time:** 1-2 hours

**Limits:**
- 3 SMS per phone number per hour
- 10 SMS per IP address per hour
- Track in Supabase table: `sms_rate_limits`

**Implementation:**
- [ ] Create `sms_rate_limits` table
- [ ] Middleware in `/api/auth/send-verification`
- [ ] Check limits before sending SMS
- [ ] Clear old entries (older than 1 hour)
- [ ] Return clear error messages

### 7.2 Payment Intent Rate Limiting
**Priority:** MEDIUM
**Status:** Pending
**Estimated Time:** 1 hour

- [ ] Limit: 10 payment intents per IP per 10 minutes
- [ ] Prevent abuse of payment creation
- [ ] Use same rate limit table

### 7.3 Input Validation Enhancements
- [ ] Amount validation: Min R$1, Max R$10,000
- [ ] Email validation on client signup
- [ ] Phone number format validation (E.164)
- [ ] Sanitize all user inputs

---

## 🧪 Phase 8: Testing & QA

### 8.1 End-to-End Payment Testing
**Priority:** CRITICAL before launch
**Status:** Pending
**Estimated Time:** 3-4 hours

- [ ] Test driver registration flow (phone → selfie → Stripe Connect)
- [ ] Test credit card payment flow (guest)
- [ ] Test Apple Pay payment flow (iOS Safari)
- [ ] Test Pix payment flow
- [ ] Test webhook delivery and payment recording
- [ ] Verify receipt generation
- [ ] Test post-payment account creation
- [ ] Test client dashboard data accuracy
- [ ] Test saved payment methods

### 8.2 Mobile Testing
- [ ] Test on iPhone (Safari) - Apple Pay
- [ ] Test on Android (Chrome) - Google Pay (if enabled)
- [ ] Test camera/selfie capture on mobile
- [ ] Test QR code scanning
- [ ] Responsive design verification

### 8.3 Stripe Connect Edge Cases
- [ ] Driver with pending Stripe account
- [ ] Driver with restricted Stripe account
- [ ] Payment when driver account is suspended
- [ ] Retry logic for temporary Stripe errors
- [ ] Refund handling (future feature)

---

## 🚀 Phase 9: Pre-Launch

### 9.1 Environment Setup
- [ ] Production environment variables set
- [ ] Stripe live mode configured
- [ ] Twilio production number configured
- [ ] Supabase production database
- [ ] Domain configured
- [ ] SSL certificate

### 9.2 Legal & Compliance
- [ ] Create Terms of Service page
- [ ] Create Privacy Policy page (LGPD compliant)
- [ ] Add LGPD consent in signup forms
- [ ] Add cookie notice
- [ ] Fiscal receipt generation (Nota Fiscal) - Phase 2

### 9.3 Monitoring & Logging
- [ ] Set up error tracking (Sentry or similar)
- [ ] Log all payment events
- [ ] Monitor webhook failures
- [ ] Set up uptime monitoring
- [ ] Create admin dashboard for metrics

---

## 📊 Success Metrics (Post-Launch)

### Week 1 Goals:
- [ ] 10 drivers registered
- [ ] 50 payments processed
- [ ] 0 payment failures
- [ ] Average payment amount: R$50+

### Month 1 Goals:
- [ ] 100 drivers registered
- [ ] 1000 payments processed
- [ ] R$50,000 in GMV
- [ ] <1% payment failure rate
- [ ] 20% client account creation rate (from guests)

---

## 🐛 Known Issues & Tech Debt

### Critical (Fix ASAP)
- [ ] Homepage says 3% commission, code uses 4% - UPDATE HOMEPAGE
- [ ] No error handling for Stripe downtime
- [ ] No refund flow
- [ ] No dispute handling

### Medium (Fix in Phase 2)
- [ ] Email receipts to clients
- [ ] SMS notifications to drivers on payment
- [ ] Driver earnings reports (for taxes)
- [ ] Multi-currency support
- [ ] Bulk export for accounting

### Low (Nice to Have)
- [ ] Dark mode
- [ ] Multi-language (English)
- [ ] Driver referral program
- [ ] Client loyalty program

---

## 📦 Deliverables Checklist

### Code
- [x] Bug fixes applied
- [x] CPF validation implemented
- [ ] Database migrations written
- [ ] Receipt generation system
- [ ] Pix payment integration
- [ ] Client dashboard with real data
- [ ] Post-payment signup flow
- [ ] Rate limiting middleware

### Documentation
- [x] SCHEMA.md
- [x] IMPLEMENTATION_STATUS.md
- [x] PLAN.md
- [ ] API documentation
- [ ] Deployment guide
- [ ] User guide (for drivers)

### Testing
- [ ] Unit tests for critical functions
- [ ] Integration tests for payment flow
- [ ] E2E tests for user journeys
- [ ] Load testing (50 concurrent payments)

---

## 🎯 Current Sprint (Next 8 Hours)

### Immediate Tasks (Priority Order):
1. ✅ Create comprehensive plan (this file)
2. 🔄 Write database migration files (30 min)
3. 🔄 Build receipt generation system (3 hours)
4. 🔄 Implement client dashboard real data (2 hours)
5. 🔄 Add Pix payment option UI (2 hours)
6. 🔄 Implement SMS rate limiting (1 hour)

### Tomorrow's Tasks:
7. Complete Pix backend integration
8. Build post-payment signup flow
9. Manual invoice entry feature
10. End-to-end testing

---

## 📞 Questions & Blockers

### Answered:
- ✅ Database exists? Yes
- ✅ Stripe Connect configured? Yes
- ✅ Receipt format? PDF via Puppeteer based on receipt.pdf
- ✅ Pix integration? Yes, requested feature
- ✅ Email receipts? Phase 2

### Pending Clarification:
- [ ] Do you have the Stripe Pix API enabled in your account?
- [ ] Do you want to test in Stripe test mode first or go straight to live?
- [ ] Should we limit payment amounts? (e.g., R$5,000 max per transaction)
- [ ] Do you need multi-vendor support or one vendor per phone number?

---

**Progress Tracking:**
- Total Tasks: 120
- Completed: 18 (15%)
- In Progress: 6 (5%)
- Pending: 96 (80%)

**Estimated Time to MVP:** 24-30 hours of development work

**Next Update:** After database migrations and receipt system are complete
