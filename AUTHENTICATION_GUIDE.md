# AmoPagar Authentication System Guide

## Overview

AmoPagar uses a dual authentication system that separates **Drivers (Motoristas)** and **Clients (Clientes)** with different login methods and onboarding flows.

---

## Architecture

### Technology Stack
- **NextAuth.js**: Session management and OAuth
- **Supabase Auth**: User authentication and OTP delivery
- **Supabase Database**: Profile storage and management
- **Stripe Connect**: Driver payment account integration

### Key Components
1. **NextAuth Providers**:
   - `phone-otp`: Phone OTP for drivers (auto-creates profiles)
   - `email-password`: Email/password for both drivers and clients
   - `google`: Google OAuth for clients only

2. **Supabase Clients**:
   - `createBrowserClient()`: Client-side operations (with env validation)
   - `createRouteHandlerClient()`: API route operations
   - `supabaseAdmin`: Server-side admin operations

3. **Middleware**: Route protection and role-based redirects

---

## Driver (Motorista) Authentication Flow

### Primary Method: Phone OTP

**Entry Point**: `/motorista/login`

#### New Driver Flow:
1. User enters phone number on login page
2. System sends OTP via Supabase Auth (SMS)
3. User enters 6-digit code
4. System verifies OTP with Supabase
5. **Auto-creates** driver profile with:
   ```typescript
   {
     id: user.id,
     celular: formattedPhone,
     tipo: "motorista",
     nome: formattedPhone, // Temporary
     onboarding_completed: false,
     verified: true
   }
   ```
6. Redirects to `/motorista/cadastro` (onboarding)
7. Driver completes profile:
   - Full name
   - CPF
   - Date of birth
   - Profession
   - Optional: email, selfie, avatar
8. Redirects to `/motorista/stripe-onboarding`
9. Driver connects Stripe account
10. Finally redirects to `/motorista/dashboard`

#### Existing Driver Flow:
1. User enters phone number
2. System sends OTP
3. User enters code
4. System checks `onboarding_completed` status
5. If complete: redirects to dashboard
6. If incomplete: redirects to cadastro page

### Secondary Method: Email/Password

Drivers who completed onboarding can also login with email/password if they provided an email during onboarding.

**Key Files**:
- Login Page: `src/app/motorista/login/page.tsx`
- Onboarding Page: `src/app/motorista/cadastro/page.tsx`
- Check Onboarding API: `src/app/api/motorista/check-onboarding/route.ts`
- Phone OTP Provider: `src/lib/auth/options.ts` (lines 138-332)

---

## Client (Cliente) Authentication Flow

### Primary Method: Email/Password

**Entry Point**: `/cadastro` (signup) or `/login` (existing users)

#### New Client Flow:
1. User fills signup form:
   - Full name
   - Email
   - Password (min 8 chars)
   - Accepts terms
2. System calls `/api/auth/signup-client`
3. Creates Supabase auth user with:
   ```typescript
   {
     email,
     password,
     options: {
       data: {
         nome: name,
         tipo: "cliente",
         account: "email"
       }
     }
   }
   ```
4. Redirects to `/cadastro/confirmacao-pendente`
5. User receives email verification link
6. Clicks link → redirects to `/auth/callback`
7. Callback route exchanges code for session
8. Redirects to `/login?verified=true`
9. User logs in with email/password
10. Redirects to `/cliente/dashboard`

#### Existing Client Flow:
1. User enters email/password on `/login`
2. NextAuth validates credentials with Supabase
3. Redirects to `/cliente/dashboard`

### Secondary Method: Google OAuth

**Entry Point**: `/cadastro` or `/login` (Google button)

#### New Google User Flow:
1. User clicks "Continue with Google"
2. NextAuth redirects to Google OAuth
3. User authorizes in Google
4. Google redirects back to NextAuth callback
5. System checks if profile exists by email
6. If not exists:
   - Creates Supabase auth user (if needed)
   - Creates profile:
     ```typescript
     {
       id: user.id,
       nome: user.name,
       email: user.email,
       avatar_url: user.image,
       tipo: "cliente",
       account: "google"
     }
     ```
7. Redirects to `/cliente/dashboard`

#### Existing Google User Flow:
1. User clicks Google button
2. System finds existing profile by email
3. Links to existing profile
4. Redirects to dashboard

**Key Files**:
- Signup Page: `src/app/cadastro/page.tsx`
- Login Page: `src/app/login/page.tsx`
- Confirmation Page: `src/app/cadastro/confirmacao-pendente/page.tsx`
- Signup API: `src/app/api/auth/signup-client/route.ts`
- Auth Callback: `src/app/api/auth/callback/route.ts`
- Google Provider: `src/lib/auth/options.ts` (lines 85-89, 346-431)

---

## API Routes Reference

### Authentication Routes

| Route | Method | Purpose | Auth Required |
|-------|--------|---------|---------------|
| `/api/auth/[...nextauth]` | GET/POST | NextAuth handler | No |
| `/api/auth/callback` | GET | Email verification callback | No |
| `/api/auth/send-verification` | POST | Send phone OTP | No |
| `/api/auth/verify-code` | POST | Verify custom OTP | No |
| `/api/auth/signup-client` | POST | Client email signup | No |
| `/api/auth/complete-registration` | POST | Complete driver onboarding | Yes |
| `/api/motorista/check-onboarding` | GET | Check if onboarding needed | Yes |

### Stripe Routes

| Route | Method | Purpose | Auth Required |
|-------|--------|---------|---------------|
| `/api/stripe/create-account` | POST | Create Stripe Connect account | Yes |
| `/api/stripe/create-login-link` | POST | Generate Stripe dashboard link | Yes |
| `/api/stripe/create-payment` | POST | Create payment intent | Yes |

---

## Environment Variables

### Required for All Environments

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...

# NextAuth
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=https://your-domain.com

# Stripe
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### Optional

```bash
# Google OAuth (for client login)
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx

# Twilio (if using SMS alternative)
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+1234567890
```

---

## Security Features

### 1. Environment Variable Validation
- Client-side: `validateSupabaseConfig()` checks NEXT_PUBLIC vars at runtime
- Server-side: Build fails if critical vars missing
- Graceful fallbacks prevent crashes

### 2. Phone Number Validation
- Only Brazilian numbers (+55) accepted
- E.164 format enforcement
- Length validation (10-11 digits)

### 3. Rate Limiting
- Phone OTP: 10 codes per hour per phone number
- Implemented via Supabase RPC function `check_sms_rate_limit_phone`

### 4. Session Management
- JWT strategy with 24-hour expiration
- Secure HTTP-only cookies
- CSRF protection via NextAuth

### 5. Role-Based Access Control
- Middleware enforces route protection
- User type (`motorista` vs `cliente`) stored in session
- Automatic redirect to appropriate dashboard

### 6. Password Requirements
- Minimum 8 characters
- Confirmed during signup
- Hashed by Supabase Auth

---

## Middleware Logic

**File**: `src/middleware.ts`

### Public Routes (No Auth Required)
- `/`
- `/login`
- `/cadastro`
- `/motorista/login`
- `/api/*`
- `/images/*`
- `/termos`
- `/privacidade`
- `/auth/callback`

### Protected Routes (Auth Required)
- `/cliente/*` - Client dashboard and features
- `/motorista/*` - Driver dashboard and features (except `/motorista/login`)

### Redirect Rules
1. **Not authenticated + protected route** → Redirect to appropriate login
2. **Authenticated + login page** → Redirect to dashboard based on user type
3. **Wrong user type + dashboard** → Redirect to correct dashboard

---

## Common Issues & Solutions

### 1. "env variables required" Error
**Cause**: Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY

**Solution**:
```bash
# Add to .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
```

### 2. "Server error" on Email Verification
**Cause**: Missing `await` on `cookies()` or env vars not set

**Solution**: All API routes now use `await cookies()` (Next.js 15 requirement)

### 3. Google Login Creates New User Instead of Linking
**Cause**: Email mismatch or profile not found

**Solution**: System now uses `listUsers()` Admin API to find existing users

### 4. Driver Can't Access Dashboard After OTP Login
**Cause**: Onboarding not completed

**Expected Behavior**: System redirects to `/motorista/cadastro` to complete profile

### 5. Rate Limit Exceeded on OTP
**Cause**: Too many OTP requests (10/hour limit)

**Solution**: Wait 1 hour or have admin reset rate limit in Supabase

---

## Testing Checklist

### Driver Flow
- [ ] New driver can receive OTP
- [ ] OTP verification creates profile
- [ ] Redirects to onboarding page
- [ ] Can complete profile with all fields
- [ ] Redirects to Stripe onboarding
- [ ] Can access dashboard after setup
- [ ] Existing driver can login with OTP
- [ ] Existing driver can login with email/password (if set)

### Client Flow
- [ ] New client can signup with email
- [ ] Receives confirmation email
- [ ] Email link redirects correctly
- [ ] Can login after verification
- [ ] Can signup with Google
- [ ] Google creates profile correctly
- [ ] Existing client can login with email
- [ ] Existing client can login with Google

### Security
- [ ] Cannot access dashboard without auth
- [ ] Client cannot access driver routes
- [ ] Driver cannot access client routes
- [ ] Rate limiting works on OTP
- [ ] Only Brazilian phones accepted
- [ ] Weak passwords rejected

### Edge Cases
- [ ] Duplicate email signup handled gracefully
- [ ] Duplicate phone signup handled gracefully
- [ ] Session expires after 24 hours
- [ ] Logout works correctly
- [ ] Middleware redirects work
- [ ] Callback errors show user-friendly messages

---

## Database Schema

### profiles Table

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  celular TEXT,
  email TEXT,
  nome TEXT,
  cpf TEXT,
  data_nascimento DATE,
  profissao TEXT,
  tipo TEXT CHECK (tipo IN ('motorista', 'cliente')),
  account TEXT CHECK (account IN ('phone', 'email', 'google')),
  avatar_url TEXT,
  selfie_url TEXT,
  stripe_account_id TEXT,
  verified BOOLEAN DEFAULT FALSE,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Indexes
```sql
CREATE INDEX idx_profiles_celular ON profiles(celular);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_tipo ON profiles(tipo);
CREATE INDEX idx_profiles_stripe ON profiles(stripe_account_id);
```

---

## File Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── [...nextauth]/route.ts    # NextAuth handler
│   │   │   ├── callback/route.ts         # Email verification callback
│   │   │   ├── send-verification/route.ts # Send OTP
│   │   │   ├── verify-code/route.ts      # Verify OTP
│   │   │   ├── signup-client/route.ts    # Client signup
│   │   │   └── complete-registration/route.ts # Driver onboarding
│   │   ├── motorista/
│   │   │   └── check-onboarding/route.ts # Check onboarding status
│   │   └── stripe/
│   │       ├── create-account/route.ts   # Create Connect account
│   │       └── create-login-link/route.ts # Stripe dashboard link
│   ├── motorista/
│   │   ├── login/page.tsx                # Driver login
│   │   ├── cadastro/page.tsx             # Driver onboarding
│   │   └── dashboard/page.tsx            # Driver dashboard
│   ├── cliente/
│   │   └── dashboard/page.tsx            # Client dashboard
│   ├── cadastro/
│   │   ├── page.tsx                      # Client signup
│   │   └── confirmacao-pendente/page.tsx # Email confirmation page
│   ├── login/page.tsx                    # Client login
│   └── page.tsx                          # Landing page
├── lib/
│   ├── auth/
│   │   └── options.ts                    # NextAuth configuration
│   └── supabase/
│       └── client.ts                     # Supabase clients & helpers
└── middleware.ts                         # Route protection
```

---

## Deployment Checklist

### Vercel Environment Variables
1. Add all variables from `.env.example`
2. Set `NEXTAUTH_URL` to production domain
3. Set `NEXT_PUBLIC_APP_URL` to production domain
4. Verify Supabase URLs are production URLs
5. Use production Stripe keys

### Supabase Configuration
1. Enable Email Auth
2. Enable Phone Auth
3. Configure email templates
4. Set up SMS provider (Twilio/MessageBird)
5. Configure redirect URLs:
   - `https://your-domain.com/auth/callback`
6. Enable RLS policies for `profiles` table

### Stripe Configuration
1. Create Connect application
2. Configure redirect URLs
3. Set up webhook endpoints
4. Test payment flows in test mode
5. Switch to live keys for production

### Google OAuth (Optional)
1. Create OAuth 2.0 credentials
2. Add authorized redirect URIs:
   - `https://your-domain.com/api/auth/callback/google`
3. Add to environment variables

---

## Support & Maintenance

### Logging
All authentication operations log to console:
- User creation/login attempts
- OTP sending/verification
- Profile creation/updates
- Errors with stack traces

### Monitoring
Key metrics to track:
- Signup conversion rate
- OTP delivery success rate
- Email verification completion rate
- Google OAuth success rate
- Session duration
- Error rates by endpoint

### Common Maintenance Tasks
1. **Reset user password**: Use Supabase dashboard
2. **Manual email verification**: Update `email_confirmed_at` in auth.users
3. **Clear rate limits**: Delete from `verification_codes` table
4. **Force onboarding**: Set `onboarding_completed = false`
5. **Link Stripe account**: Update `stripe_account_id` in profiles

---

## Credits

Built with:
- Next.js 15
- NextAuth.js
- Supabase Auth & Database
- Stripe Connect
- Tailwind CSS

---

**Last Updated**: 2025-11-23
**Version**: 2.0
**Status**: Production Ready ✅
