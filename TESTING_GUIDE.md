# AmoPagar Testing Guide

## Pre-Testing Setup

### 1. Environment Variables
Ensure all required variables are set in `.env.local`:

```bash
# Check if variables are loaded
node -e "console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ Set' : '✗ Missing')"
```

### 2. Database Setup
Verify Supabase tables exist:
- `profiles`
- `verification_codes`
- `pagamentos`

### 3. Start Development Server
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

---

## Test Suite 1: Driver Authentication

### Test 1.1: New Driver Signup via OTP
**Goal**: Verify complete flow from OTP to dashboard

**Steps**:
1. Navigate to `http://localhost:3000/motorista/login`
2. Ensure "Telefone" tab is selected
3. Enter a valid Brazilian phone: `(11) 99999-9999`
4. Click "Enviar código"
5. **Expected**: Success message appears, countdown starts
6. Check phone for 6-digit code
7. Enter code in OTP field
8. **Expected**: Redirects to `/motorista/cadastro`
9. Fill out onboarding form:
   - Nome: Test Driver
   - CPF: Valid CPF (e.g., `123.456.789-09`)
   - Data Nascimento: `01/01/1990`
   - Profissão: Motorista de táxi
10. Click "Finalizar Cadastro"
11. **Expected**: Redirects to `/motorista/stripe-onboarding`
12. Click "Skip for now" or complete Stripe setup
13. **Expected**: Redirects to `/motorista/dashboard`

**Verification**:
- [ ] Profile created in `profiles` table
- [ ] `tipo = 'motorista'`
- [ ] `onboarding_completed = true`
- [ ] `celular` formatted as `+5511999999999`
- [ ] Session created with correct user type

**Potential Issues**:
- OTP not received → Check Supabase SMS provider settings
- "env variables required" → Check NEXT_PUBLIC vars are set
- Redirect loop → Check middleware logic
- Rate limit error → Wait 1 hour or clear `verification_codes`

---

### Test 1.2: Existing Driver Login via OTP
**Goal**: Verify returning driver can login

**Prerequisites**: Complete Test 1.1 first

**Steps**:
1. Logout if logged in
2. Navigate to `/motorista/login`
3. Enter same phone number used in Test 1.1
4. Click "Enviar código"
5. Enter OTP code
6. **Expected**: Redirects directly to `/motorista/dashboard` (skip onboarding)

**Verification**:
- [ ] No redirect to onboarding
- [ ] Dashboard shows correct driver data
- [ ] Session maintains driver type

---

### Test 1.3: Driver Login via Email/Password
**Goal**: Verify email login for drivers who completed onboarding

**Prerequisites**: Complete Test 1.1 and ensure email was provided during onboarding

**Steps**:
1. Navigate to `/motorista/login`
2. Click "Email" tab
3. Enter email and password
4. Click "Entrar"
5. **Expected**: Redirects to `/motorista/dashboard`

**Verification**:
- [ ] Login succeeds without OTP
- [ ] Dashboard loads correctly
- [ ] Session type is `motorista`

---

### Test 1.4: Phone Number Validation
**Goal**: Ensure only Brazilian numbers are accepted

**Test Cases**:

| Input | Expected Result |
|-------|----------------|
| `(11) 99999-9999` | ✓ Accepted |
| `11999999999` | ✓ Accepted (auto-formats) |
| `+5511999999999` | ✓ Accepted |
| `(11) 9999-9999` | ✗ Rejected (too short) |
| `+14155551234` | ✗ Rejected (not Brazilian) |
| `abc` | ✗ Rejected (invalid format) |

**Steps**:
1. Navigate to `/motorista/login`
2. Try each input above
3. Verify error messages for invalid inputs

---

### Test 1.5: OTP Rate Limiting
**Goal**: Verify rate limiting prevents abuse

**Steps**:
1. Navigate to `/motorista/login`
2. Enter phone number
3. Click "Enviar código" 11 times rapidly
4. **Expected**: After 10th attempt, get error "Rate limit exceeded"

**Verification**:
- [ ] First 10 attempts succeed
- [ ] 11th attempt shows rate limit error
- [ ] Counter resets after 1 hour

---

## Test Suite 2: Client Authentication

### Test 2.1: Client Signup via Email/Password
**Goal**: Verify complete email signup flow

**Steps**:
1. Navigate to `http://localhost:3000/cadastro`
2. Fill form:
   - Nome: Test Client
   - Email: `test-client-${Date.now()}@example.com` (unique)
   - Password: `TestPass123!`
   - Confirm Password: `TestPass123!`
3. Check "Aceito os Termos" checkbox
4. Click "Criar conta"
5. **Expected**: Redirects to `/cadastro/confirmacao-pendente`
6. Check email for verification link
7. Click verification link
8. **Expected**: Redirects to `/login?verified=true`
9. Enter email and password
10. Click "Entrar"
11. **Expected**: Redirects to `/cliente/dashboard`

**Verification**:
- [ ] User created in Supabase Auth
- [ ] Profile created with `tipo = 'cliente'`
- [ ] `account = 'email'`
- [ ] Email verification link works
- [ ] Can login after verification

**Potential Issues**:
- Email not received → Check Supabase email settings
- Verification link 404 → Check callback route
- Can't login after verification → Check if email_confirmed_at is set

---

### Test 2.2: Client Login via Email/Password
**Goal**: Verify returning client can login

**Prerequisites**: Complete Test 2.1 first

**Steps**:
1. Logout if logged in
2. Navigate to `/login`
3. Enter email from Test 2.1
4. Enter password
5. Click "Entrar"
6. **Expected**: Redirects to `/cliente/dashboard`

**Verification**:
- [ ] Login succeeds
- [ ] Dashboard shows correct client data
- [ ] Session type is `cliente`

---

### Test 2.3: Client Signup via Google OAuth
**Goal**: Verify Google authentication flow

**Prerequisites**: Google OAuth configured in Supabase

**Steps**:
1. Navigate to `/cadastro`
2. Click "Continuar com Google"
3. **Expected**: Redirects to Google login
4. Select Google account
5. **Expected**: Redirects back to AmoPagar
6. **Expected**: Lands on `/cliente/dashboard`

**Verification**:
- [ ] Profile created with Google email
- [ ] `tipo = 'cliente'`
- [ ] `account = 'google'`
- [ ] Avatar URL from Google
- [ ] Name from Google profile

**Potential Issues**:
- Google button doesn't work → Check GOOGLE_CLIENT_ID/SECRET
- Redirect loop → Check NEXTAUTH_URL matches current domain
- Profile not created → Check Google OAuth callback in options.ts

---

### Test 2.4: Existing Google User Login
**Goal**: Verify returning Google user can login

**Prerequisites**: Complete Test 2.3 first

**Steps**:
1. Logout
2. Navigate to `/login`
3. Click "Continuar com Google"
4. Select same Google account
5. **Expected**: Redirects to `/cliente/dashboard`

**Verification**:
- [ ] No duplicate profile created
- [ ] Existing profile linked correctly
- [ ] Dashboard shows previous data

---

### Test 2.5: Duplicate Email Handling
**Goal**: Ensure duplicate signups are handled gracefully

**Test Cases**:

**A. Email Already Verified**:
1. Try to signup with email from Test 2.1
2. **Expected**: Error message "Este email já está cadastrado"

**B. Email Unverified (Pending)**:
1. Signup with new email but don't verify
2. Try to signup again with same email
3. **Expected**: "Este email já está registrado mas requer verificação"

**Verification**:
- [ ] No duplicate auth users created
- [ ] Appropriate error messages shown
- [ ] Resend verification option available

---

## Test Suite 3: Edge Cases & Security

### Test 3.1: Session Expiration
**Goal**: Verify sessions expire after 24 hours

**Steps**:
1. Login as any user
2. Wait 24 hours (or manually expire session in browser DevTools)
3. Try to access dashboard
4. **Expected**: Redirects to login page

---

### Test 3.2: Cross-Role Access Prevention
**Goal**: Ensure users can't access wrong dashboards

**Test Cases**:

**A. Driver tries to access client dashboard**:
1. Login as driver
2. Navigate to `/cliente/dashboard`
3. **Expected**: Redirects to `/motorista/dashboard`

**B. Client tries to access driver dashboard**:
1. Login as client
2. Navigate to `/motorista/dashboard`
3. **Expected**: Redirects to `/cliente/dashboard`

**Verification**:
- [ ] Middleware enforces role-based routing
- [ ] No access to unauthorized pages
- [ ] Redirect preserves session

---

### Test 3.3: Unauthenticated Access Prevention
**Goal**: Verify protected routes require authentication

**Test Cases**:

| Route | Expected Redirect |
|-------|------------------|
| `/motorista/dashboard` | `/motorista/login` |
| `/cliente/dashboard` | `/login` |
| `/motorista/cadastro` | `/motorista/login` |

**Steps**:
1. Ensure logged out
2. Try to access each route directly
3. Verify redirects to appropriate login page

---

### Test 3.4: Password Strength Validation
**Goal**: Ensure weak passwords are rejected

**Test Cases**:

| Password | Expected Result |
|----------|----------------|
| `Test123!` | ✓ Accepted (8+ chars) |
| `password` | ✗ Too weak |
| `1234567` | ✗ Too short |
| `Test123` | ✓ Accepted |
| `` | ✗ Required |

**Steps**:
1. Navigate to `/cadastro`
2. Try each password above
3. Verify appropriate error messages

---

### Test 3.5: CSRF Protection
**Goal**: Verify CSRF tokens are validated

**Steps**:
1. Open browser DevTools
2. Navigate to `/login`
3. Try to submit login form without CSRF token
4. **Expected**: Request fails with 403 or 401

---

## Test Suite 4: Integration Tests

### Test 4.1: Complete Driver Journey
**End-to-end test from signup to first payment**

**Steps**:
1. Complete driver signup (Test 1.1)
2. Connect Stripe account
3. Navigate to dashboard
4. Verify Stripe setup status shows as connected
5. Have a client make a payment (requires Test 2.1 first)
6. Verify payment appears in driver dashboard

**Verification**:
- [ ] Stripe account linked
- [ ] Payment recorded in database
- [ ] Correct amounts (with platform fee)
- [ ] Receipt generated

---

### Test 4.2: Complete Client Journey
**End-to-end test from signup to payment**

**Steps**:
1. Complete client signup (Test 2.1)
2. Navigate to dashboard
3. Search for a driver
4. Make a payment
5. Verify payment success
6. Check payment history

**Verification**:
- [ ] Payment processed
- [ ] Receipt available
- [ ] History shows transaction
- [ ] Driver received payment (minus fees)

---

## Test Suite 5: Performance & Reliability

### Test 5.1: Concurrent Logins
**Goal**: Verify system handles multiple logins simultaneously

**Steps**:
1. Open 5 incognito browser windows
2. Login with different accounts in each
3. **Expected**: All logins succeed without conflicts

**Verification**:
- [ ] No session conflicts
- [ ] Each user sees their own data
- [ ] No CORS errors

---

### Test 5.2: Network Interruption Handling
**Goal**: Verify graceful handling of network issues

**Steps**:
1. Start login process
2. Disable network mid-request (browser DevTools)
3. **Expected**: Timeout error with user-friendly message
4. Re-enable network
5. Retry login
6. **Expected**: Succeeds

---

### Test 5.3: Database Connection Issues
**Goal**: Verify error handling when Supabase is down

**Steps**:
1. Temporarily set wrong SUPABASE_URL in env
2. Try to login
3. **Expected**: Error message, no crash
4. Fix SUPABASE_URL
5. **Expected**: System recovers

---

## Automated Testing

### Unit Tests (Recommended)

Create test files for:

```typescript
// __tests__/auth/formatPhoneNumber.test.ts
import { formatPhoneNumber } from '@/lib/supabase/client'

describe('formatPhoneNumber', () => {
  it('formats Brazilian numbers correctly', () => {
    expect(formatPhoneNumber('11999999999', '55')).toBe('+5511999999999')
  })

  it('rejects non-Brazilian numbers', () => {
    expect(() => formatPhoneNumber('14155551234', '1')).toThrow()
  })
})
```

### E2E Tests (Recommended)

Use Playwright or Cypress:

```typescript
// e2e/driver-signup.spec.ts
import { test, expect } from '@playwright/test'

test('driver can complete signup flow', async ({ page }) => {
  await page.goto('/motorista/login')
  await page.fill('input[name="phone"]', '11999999999')
  await page.click('button:text("Enviar código")')
  await expect(page.locator('text=Código enviado')).toBeVisible()
  // ... continue flow
})
```

---

## Debugging Checklist

When tests fail, check:

### Browser Console
- [ ] No JavaScript errors
- [ ] API calls returning 200 status
- [ ] No CORS errors
- [ ] Environment variables loaded

### Network Tab
- [ ] Request payloads correct
- [ ] Response data valid JSON
- [ ] Cookies being set
- [ ] Redirects working

### Supabase Dashboard
- [ ] User created in auth.users
- [ ] Profile created in profiles table
- [ ] RLS policies allow operations
- [ ] Email/SMS provider configured

### Server Logs
- [ ] No 500 errors
- [ ] Database queries succeeding
- [ ] NextAuth callbacks executing
- [ ] Middleware not blocking requests

---

## Test Results Template

Use this template to document test results:

```markdown
## Test Run: [Date]
**Tester**: [Name]
**Environment**: [Local/Staging/Production]
**Browser**: [Chrome/Firefox/Safari]

### Driver Tests
- [x] Test 1.1: New Driver OTP Signup - PASSED
- [x] Test 1.2: Existing Driver Login - PASSED
- [ ] Test 1.3: Email Login - FAILED (Error: ...)
- [x] Test 1.4: Phone Validation - PASSED
- [x] Test 1.5: Rate Limiting - PASSED

### Client Tests
- [x] Test 2.1: Email Signup - PASSED
- [x] Test 2.2: Email Login - PASSED
- [ ] Test 2.3: Google OAuth - SKIPPED (OAuth not configured)
- [x] Test 2.4: Google Login - N/A
- [x] Test 2.5: Duplicate Emails - PASSED

### Security Tests
- [x] Test 3.1: Session Expiration - PASSED
- [x] Test 3.2: Cross-Role Access - PASSED
- [x] Test 3.3: Unauth Access - PASSED
- [x] Test 3.4: Password Strength - PASSED
- [x] Test 3.5: CSRF Protection - PASSED

### Integration Tests
- [x] Test 4.1: Complete Driver Journey - PASSED
- [x] Test 4.2: Complete Client Journey - PASSED

### Performance Tests
- [x] Test 5.1: Concurrent Logins - PASSED
- [x] Test 5.2: Network Interruption - PASSED
- [x] Test 5.3: Database Issues - PASSED

**Overall Status**: 18/19 PASSED (94.7%)
**Critical Issues**: None
**Non-Critical Issues**: OAuth setup needed
```

---

## Quick Smoke Test

For rapid verification after deployments:

```bash
# 1. Driver OTP flow
curl -X POST http://localhost:3000/api/auth/send-verification \
  -H "Content-Type: application/json" \
  -d '{"phone": "11999999999", "countryCode": "55"}'

# Expected: {"success": true}

# 2. Client signup
curl -X POST http://localhost:3000/api/auth/signup-client \
  -H "Content-Type: application/json" \
  -d '{"name": "Test", "email": "test@test.com", "password": "Test123!"}'

# Expected: {"success": true, "message": "..."}

# 3. Health check
curl http://localhost:3000/api/health

# Expected: 200 OK
```

---

## Test Data Cleanup

After testing, clean up:

```sql
-- Delete test profiles
DELETE FROM profiles WHERE email LIKE '%test%' OR nome LIKE '%Test%';

-- Delete test verification codes
DELETE FROM verification_codes WHERE phone LIKE '%99999%';

-- Delete test payments
DELETE FROM pagamentos WHERE created_at > NOW() - INTERVAL '1 hour';
```

---

**Last Updated**: 2025-11-23
**Version**: 1.0
**Status**: Ready for Testing ✅
