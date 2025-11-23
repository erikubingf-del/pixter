# AmoPagar - Quick Reference Card

## 🚀 Quick Start

```bash
# 1. Clone & install
git clone [repo-url]
cd pixter
npm install

# 2. Setup environment
cp .env.example .env.local
# Edit .env.local with your credentials

# 3. Start dev server
npm run dev

# 4. Open browser
http://localhost:3000
```

---

## 🔐 Authentication URLs

### For Drivers
- **Login/Signup**: `http://localhost:3000/motorista/login`
- **Onboarding**: `http://localhost:3000/motorista/cadastro` (auto-redirect after first OTP)
- **Dashboard**: `http://localhost:3000/motorista/dashboard`

### For Clients
- **Signup**: `http://localhost:3000/cadastro`
- **Login**: `http://localhost:3000/login`
- **Dashboard**: `http://localhost:3000/cliente/dashboard`

---

## 📋 Environment Variables

### Minimum Required
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=http://localhost:3000
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Optional (for Google OAuth)
```bash
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
```

---

## 🧪 Quick Test Commands

### Test Driver OTP Flow
```bash
curl -X POST http://localhost:3000/api/auth/send-verification \
  -H "Content-Type: application/json" \
  -d '{"phone": "11999999999", "countryCode": "55"}'
```

### Test Client Signup
```bash
curl -X POST http://localhost:3000/api/auth/signup-client \
  -H "Content-Type: application/json" \
  -d '{"name": "Test User", "email": "test@example.com", "password": "Test123!"}'
```

---

## 🛠️ Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| "env variables required" | Check NEXT_PUBLIC_ vars are set |
| "Server error" on email link | Check callback route has `await cookies()` |
| Google login fails | Verify GOOGLE_CLIENT_ID/SECRET |
| OTP not received | Check Supabase SMS provider settings |
| Rate limit error | Wait 1hr or clear verification_codes table |
| Can't access dashboard | Check onboarding_completed status |

---

## 📊 Database Quick Queries

### Check User Profile
```sql
SELECT * FROM profiles WHERE email = 'user@example.com';
```

### Verify User Email Manually
```sql
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'user@example.com';
```

### Clear Rate Limit
```sql
DELETE FROM verification_codes WHERE phone = '+5511999999999';
```

### Force Re-onboarding
```sql
UPDATE profiles
SET onboarding_completed = false
WHERE email = 'driver@example.com';
```

---

## 🔑 Key Files

| File | Purpose |
|------|---------|
| `src/lib/supabase/client.ts` | Supabase clients & phone formatting |
| `src/lib/auth/options.ts` | NextAuth config & providers |
| `src/middleware.ts` | Route protection & redirects |
| `src/app/motorista/login/page.tsx` | Driver login page |
| `src/app/cadastro/page.tsx` | Client signup page |
| `src/app/login/page.tsx` | Client login page |

---

## 🎯 User Flows

### Driver: New User
```
/motorista/login
  → Enter phone
  → Receive OTP
  → Enter code
  → [Auto-creates profile]
  → /motorista/cadastro
  → Complete profile
  → /motorista/stripe-onboarding
  → /motorista/dashboard
```

### Driver: Existing User
```
/motorista/login
  → Enter phone OR email
  → Enter code OR password
  → /motorista/dashboard
```

### Client: New User (Email)
```
/cadastro
  → Fill form
  → Submit
  → /cadastro/confirmacao-pendente
  → Click email link
  → /login
  → Enter credentials
  → /cliente/dashboard
```

### Client: New User (Google)
```
/cadastro
  → Click Google button
  → Authorize in Google
  → [Auto-creates profile]
  → /cliente/dashboard
```

---

## 📱 Test Phone Numbers

For testing OTP in development:

```
(11) 99999-9999  → Valid Brazilian mobile
(21) 98888-8888  → Valid Rio mobile
(11) 9999-9999   → Invalid (too short)
+14155551234     → Invalid (not Brazilian)
```

---

## 🚨 Emergency Commands

### Restart Development
```bash
# Kill all node processes
pkill -f node

# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Restart
npm run dev
```

### Reset Supabase Local
```bash
# If using Supabase locally
supabase db reset
supabase start
```

### Check Environment
```bash
# Verify env vars are loaded
node -e "console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)"
```

---

## 📚 Documentation Index

| Document | Purpose |
|----------|---------|
| `README.md` | Project overview |
| `AUTHENTICATION_GUIDE.md` | Complete auth system docs |
| `TESTING_GUIDE.md` | Testing procedures |
| `AUTHENTICATION_FIXES_SUMMARY.md` | Recent changes summary |
| `QUICK_REFERENCE.md` | This file |

---

## 🎨 Brand Colors

```css
--amo-purple: #8B7DD8  /* AmoPagar primary */
--amo-green: #81C995   /* AmoPagar secondary */
--amo-bg-gradient: linear-gradient(135deg, #F0E7FC 0%, #E8F5E9 100%)
```

---

## 🔧 Useful Scripts

### Generate NextAuth Secret
```bash
openssl rand -base64 32
```

### Check Port Usage
```bash
lsof -i :3000
```

### View Logs
```bash
# In development
tail -f .next/trace

# In Vercel
vercel logs [deployment-url]
```

---

## 📞 Support Contacts

- **Supabase Issues**: https://supabase.com/support
- **Stripe Issues**: https://support.stripe.com
- **NextAuth Issues**: https://next-auth.js.org/getting-started/introduction

---

## ✅ Pre-Deployment Checklist

- [ ] All env vars set in Vercel
- [ ] Supabase email auth enabled
- [ ] Supabase phone auth enabled
- [ ] Stripe Connect configured
- [ ] Google OAuth configured (if using)
- [ ] RLS policies enabled
- [ ] Database migrations applied
- [ ] Smoke tests passed
- [ ] Error monitoring setup

---

## 🎯 Success Indicators

**Healthy System**:
- ✅ OTP delivery: <5 seconds
- ✅ Login success rate: >95%
- ✅ Email verification: >90%
- ✅ Google OAuth: >95%
- ✅ Dashboard load: <2 seconds
- ✅ Error rate: <1%

**Needs Attention**:
- ⚠️ OTP delivery: >10 seconds
- ⚠️ Login success rate: <85%
- ⚠️ Email bounces: >10%
- ⚠️ Dashboard load: >5 seconds
- ⚠️ Error rate: >5%

---

**Last Updated**: 2025-11-23
**Version**: 2.0
**Status**: Production Ready ✅

**Quick Links**:
- [Full Documentation](AUTHENTICATION_GUIDE.md)
- [Testing Guide](TESTING_GUIDE.md)
- [Recent Changes](AUTHENTICATION_FIXES_SUMMARY.md)
