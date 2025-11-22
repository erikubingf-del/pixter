# TODO - What's Left to Build

**Status:** Migrations Ready | Testing Next | 5 Core Features Remaining

---

## ✅ COMPLETED (Today's Session)

- [x] Fixed payment amount bug (100x multiplication)
- [x] Fixed webhook metadata mismatch
- [x] Implemented 4% commission
- [x] Created database migrations (6 files)
- [x] Built PDF receipt generation system
- [x] Added CPF validation
- [x] Updated homepage commission text
- [x] Created comprehensive documentation

---

## 🚧 IN PROGRESS - Database Setup

### Current Step: Run Migrations
**Time Estimate:** 20-30 minutes
**Priority:** CRITICAL (blocks everything else)

**Action Items:**
1. [ ] Open Supabase Dashboard → SQL Editor
2. [ ] Run migration: `20251122000000_ensure_profiles_table.sql`
3. [ ] Run migration: `20251122000001_create_pagamentos_table.sql`
4. [ ] Run migration: `20251122000002_create_verification_codes_table.sql`
5. [ ] Run migration: `20251122000003_create_payment_methods_table.sql`
6. [ ] Run migration: `20251122000004_create_sms_rate_limits_table.sql`
7. [ ] Run migration: `20251122000005_create_rls_policies.sql`
8. [ ] Create storage bucket: `receipts` (public)
9. [ ] Create storage bucket: `selfies` (public)
10. [ ] Verify all tables created successfully

**See:** `supabase/RUN_MIGRATIONS.md` for detailed step-by-step guide

---

## 🎯 NEXT UP - Core Features (Priority Order)

### 1. Pix Payment Integration ⚡
**Priority:** HIGH (Requested feature, competitive advantage)
**Time Estimate:** 4-5 hours
**Status:** Not started

**What needs to be built:**
- [ ] Add Pix button to payment page (`src/app/[phoneNumber]/page.tsx`)
- [ ] Pix QR code generation component
- [ ] Copy-to-clipboard functionality
- [ ] Payment status polling (check every 2 seconds)
- [ ] Backend: `/api/stripe/create-pix-payment` endpoint
- [ ] Backend: `/api/stripe/check-pix-status/[paymentId]` endpoint
- [ ] Update webhook to handle Pix payment confirmations
- [ ] Enhanced success page with "Success, {Name}!" personalization

**User Flow:**
```
Client → Payment page → Sees "Pay with Card" | "Pay with Pix"
      → Selects Pix → Enters amount → QR code appears
      → Copies Pix code → Opens bank app → Pays
      → Returns to Pixter → Auto-detects payment → Success page
      → Shows "Success, Erik!" (if logged in) or prompt to create account
```

**Files to Create:**
- `src/components/PixPayment.tsx`
- `src/app/api/stripe/create-pix-payment/route.ts`
- `src/app/api/stripe/check-pix-status/[paymentId]/route.ts`

**Files to Modify:**
- `src/app/[phoneNumber]/page.tsx` (add Pix option)
- `src/app/pagamento/sucesso/page.tsx` (personalize message)

---

### 2. Client Dashboard with Real Data 📊
**Priority:** HIGH (Currently showing mock data)
**Time Estimate:** 2-3 hours
**Status:** Not started

**What needs to be built:**
- [ ] Fetch real payments from database (`pagamentos` table)
- [ ] Display payment history with pagination
- [ ] Show saved payment methods from Stripe
- [ ] Receipt download links for each payment
- [ ] Date range filter
- [ ] Search by vendor name
- [ ] Total spent display

**Current State:**
- File: `src/app/cliente/dashboard/page.tsx`
- Has hardcoded mock data:
  ```typescript
  const pagamentos = [
    { data: '22/04/2025', valor: 'R$ 32,50', motorista: 'João', metodo: 'Pix' },
    // ... fake data
  ]
  ```

**Needs to become:**
```typescript
const { data: pagamentos } = await supabase
  .from('pagamentos')
  .select('*, motorista:profiles!motorista_id(nome)')
  .eq('cliente_id', user.id)
  .order('created_at', { ascending: false });
```

**Files to Modify:**
- `src/app/cliente/dashboard/page.tsx` (replace mock data)
- `src/app/cliente/dashboard/historico/page.tsx` (if exists)

---

### 3. Post-Payment Account Creation 👤
**Priority:** HIGH (User retention & receipt saving)
**Time Estimate:** 2-3 hours
**Status:** Not started

**What needs to be built:**
- [ ] Post-payment modal/screen component
- [ ] Quick signup form (phone number only, no password)
- [ ] OTP verification flow
- [ ] Payment linking logic (link by PaymentIntent ID)
- [ ] Redirect to dashboard after signup
- [ ] Show payment in dashboard immediately

**User Flow:**
```
Guest pays with Apple Pay/Card
   → Payment succeeds
   → Success page shows: "Save this receipt? Create account in 30 seconds"
   → User clicks "Create Account"
   → Enters phone number → Gets OTP → Verifies
   → Account created → Payment automatically linked
   → Redirected to dashboard → Payment visible
```

**Files to Create:**
- `src/components/PostPaymentSignup.tsx`
- `src/app/api/auth/link-payment/route.ts`

**Files to Modify:**
- `src/app/pagamento/sucesso/page.tsx` (add signup prompt)

---

### 4. Manual Invoice Entry 🔢
**Priority:** MEDIUM (Nice-to-have for screenshot uploads)
**Time Estimate:** 2 hours
**Status:** Not started

**What needs to be built:**
- [ ] "Add Invoice Manually" button in client dashboard
- [ ] Modal/form to enter receipt number
- [ ] Search payment by `receipt_number` in database
- [ ] Link payment to user's account if found
- [ ] Error handling: invalid number, already claimed, not found
- [ ] Success message + refresh dashboard

**User Flow:**
```
Client paid as guest (has screenshot of receipt)
   → Logs in later
   → Dashboard → "Add Invoice Manually"
   → Enters receipt number from screenshot (e.g., PIX-1234567890-ABC123)
   → System finds payment in database
   → Links `cliente_id` to user's account
   → Payment now appears in their history
```

**Files to Create:**
- `src/components/ManualInvoiceEntry.tsx`
- `src/app/api/client/link-invoice/route.ts`

**Files to Modify:**
- `src/app/cliente/dashboard/page.tsx` (add button)

---

### 5. SMS Rate Limiting Middleware 🛡️
**Priority:** HIGH (Cost control & security)
**Time Estimate:** 1-2 hours
**Status:** Infrastructure ready, needs integration

**What needs to be built:**
- [ ] Middleware to check rate limits before sending SMS
- [ ] Extract client IP address from request
- [ ] Call database functions to check limits
- [ ] Return error if rate limited
- [ ] Record SMS send in database
- [ ] Clear error messages for users

**Rate Limits:**
- 3 SMS per phone number per hour
- 10 SMS per IP address per hour

**Files to Modify:**
- `src/app/api/auth/send-verification/route.ts`

**Code to Add:**
```typescript
// Check rate limits
const clientIP = request.headers.get('x-forwarded-for') || '127.0.0.1';

const { data: phoneAllowed } = await supabaseServer.rpc(
  'check_sms_rate_limit_phone',
  { p_phone: formattedPhone, p_max_attempts: 3, p_window_minutes: 60 }
);

const { data: ipAllowed } = await supabaseServer.rpc(
  'check_sms_rate_limit_ip',
  { p_ip_address: clientIP, p_max_attempts: 10, p_window_minutes: 60 }
);

if (!phoneAllowed || !ipAllowed) {
  return NextResponse.json(
    { error: 'Too many SMS requests. Please try again later.' },
    { status: 429 }
  );
}

// ... send SMS ...

// Record the send
await supabaseServer.rpc('record_sms_send', {
  p_phone: formattedPhone,
  p_ip_address: clientIP
});
```

---

## 📋 Testing Checklist

**After migrations are done:**
- [ ] Register as driver
- [ ] Connect Stripe account (test mode)
- [ ] Make test payment (R$10 with 4242... card)
- [ ] Verify payment in database
- [ ] Download receipt PDF
- [ ] Check net amount calculation (96% of total)

**After Pix integration:**
- [ ] Test Pix payment flow
- [ ] Verify QR code generates
- [ ] Test payment status polling
- [ ] Check Pix payments record correctly

**After client dashboard:**
- [ ] View payment history as client
- [ ] Download multiple receipts
- [ ] Test date filters
- [ ] Verify pagination works

**After post-payment signup:**
- [ ] Pay as guest
- [ ] Create account after payment
- [ ] Verify payment appears in dashboard
- [ ] Test with multiple payments

**After manual entry:**
- [ ] Enter valid receipt number
- [ ] Try invalid receipt number
- [ ] Try already-claimed receipt
- [ ] Verify error messages

---

## 🎯 Success Metrics

**Phase 1 (Migrations):**
- All tables created ✅
- RLS policies active ✅
- Storage buckets ready ✅

**Phase 2 (Core Features):**
- Pix payments working ⏳
- Client dashboard functional ⏳
- Post-payment signup converts 20%+ ⏳
- Manual entry working ⏳
- SMS abuse prevented ⏳

**Phase 3 (Launch):**
- 10 drivers registered
- 50 payments processed
- 0 payment failures
- All receipts generating successfully

---

## 📚 Reference Documents

1. **QUICKSTART.md** - Immediate action plan
2. **PLAN.md** - Full 120-task roadmap
3. **RUN_MIGRATIONS.md** - Step-by-step migration guide
4. **COMPLETED_TODAY.md** - What we built today
5. **IMPLEMENTATION_STATUS.md** - Current state & business logic
6. **TODO_REMAINING.md** - This file!

---

## ⏱️ Time Estimates

- **Database Setup:** 30 min (in progress)
- **Pix Integration:** 4-5 hours
- **Client Dashboard:** 2-3 hours
- **Post-Payment Signup:** 2-3 hours
- **Manual Invoice Entry:** 2 hours
- **SMS Rate Limiting:** 1-2 hours
- **Testing & Debugging:** 3-4 hours

**Total Remaining:** ~16-20 hours to production-ready MVP

---

## 🚀 Current Priority

**RIGHT NOW:** Run database migrations (see RUN_MIGRATIONS.md)

**NEXT:** Test payment flow end-to-end

**THEN:** Build Pix integration (highest user value)

**FINALLY:** Client dashboard + post-payment signup

---

**Last Updated:** 2025-11-22
**Progress:** 21/120 tasks complete (18%)
**Status:** Database migrations ready to run!
