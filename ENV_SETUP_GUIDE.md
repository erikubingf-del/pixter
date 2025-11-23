# Environment Variables Setup Guide

## Quick Start

### 1️⃣ Copy the Template
```bash
cp .env.example .env.local
```

### 2️⃣ Fill In Your Values

Open `.env.local` and replace the placeholder values with your actual credentials.

---

## 📋 Required Variables

### Supabase (REQUIRED ✅)

**Where to get**: https://app.supabase.com → Your Project → Settings → API

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Steps**:
1. Go to https://app.supabase.com
2. Select your project
3. Click "Settings" (gear icon)
4. Click "API" in sidebar
5. Copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY` (Click "Reveal" first)

---

### Stripe (REQUIRED ✅)

**Where to get**: https://dashboard.stripe.com/test/apikeys

```bash
STRIPE_SECRET_KEY=sk_test_51xxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51xxxxxxxxxxxxx
```

**Steps**:
1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy:
   - Secret key → `STRIPE_SECRET_KEY`
   - Publishable key → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

**For Production**: Switch to live keys (remove `_test_` from URLs)

---

### NextAuth (REQUIRED ✅)

```bash
NEXTAUTH_SECRET=your-random-32-character-secret-here
NEXTAUTH_URL=http://localhost:3000
```

**Generate Secret**:
- **Option 1**: Visit https://generate-secret.vercel.app/32 (easiest)
- **Option 2**: Run `openssl rand -base64 32` in terminal
- **Option 3**: Use any random 32+ character string

**For Production**: Change `NEXTAUTH_URL` to your domain

---

## ⚙️ Optional Variables

### Google OAuth (Optional)

**Only needed if**: You want to allow clients to login with Google

**Where to get**: https://console.cloud.google.com/apis/credentials

```bash
GOOGLE_CLIENT_ID=123456789-xxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxx
```

**Steps**:
1. Go to https://console.cloud.google.com/apis/credentials
2. Create project (if needed)
3. Click "Create Credentials" → "OAuth 2.0 Client ID"
4. Application type: "Web application"
5. Add authorized redirect URI:
   - Local: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://your-domain.com/api/auth/callback/google`
6. Copy Client ID and Client Secret

---

## 🚀 Platform-Specific Setup

### For Local Development

**File**: `.env.local` (create this file)

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
STRIPE_SECRET_KEY=sk_test_51xxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51xxxxxxxxxxxxx
NEXTAUTH_SECRET=your-generated-secret-here
NEXTAUTH_URL=http://localhost:3000

# Optional
GOOGLE_CLIENT_ID=123456789-xxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxx
```

---

### For Vercel Production

**Location**: Vercel Dashboard → Your Project → Settings → Environment Variables

#### Add Each Variable:

1. Go to https://vercel.com/dashboard
2. Select your project
3. Click "Settings" tab
4. Click "Environment Variables" in sidebar
5. For each variable, click "Add New"

**Required Variables**:
```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://xxxxxxxxxxxxx.supabase.co
Environment: Production, Preview, Development
```

```
Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Environment: Production, Preview, Development
```

```
Name: SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Environment: Production, Preview, Development
```

```
Name: STRIPE_SECRET_KEY
Value: sk_live_xxxxxxxxxxxxx  (⚠️ Use LIVE key, not test!)
Environment: Production
```

```
Name: STRIPE_SECRET_KEY
Value: sk_test_xxxxxxxxxxxxx  (Use test key for preview)
Environment: Preview, Development
```

```
Name: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
Value: pk_live_xxxxxxxxxxxxx  (⚠️ Use LIVE key, not test!)
Environment: Production
```

```
Name: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
Value: pk_test_xxxxxxxxxxxxx  (Use test key for preview)
Environment: Preview, Development
```

```
Name: NEXTAUTH_SECRET
Value: [generate new secret for production]
Environment: Production, Preview, Development
```

```
Name: NEXTAUTH_URL
Value: https://your-domain.vercel.app  (or custom domain)
Environment: Production
```

**Optional Variables** (if using):
```
Name: GOOGLE_CLIENT_ID
Value: 123456789-xxxxxxxx.apps.googleusercontent.com
Environment: Production, Preview, Development
```

```
Name: GOOGLE_CLIENT_SECRET
Value: GOCSPX-xxxxxxxxxxxxxxxxxxxx
Environment: Production, Preview, Development
```

**Important**: After adding variables, redeploy your app for them to take effect!

---

### For Gitpod

**Location**: https://gitpod.io/user/variables

1. Go to https://gitpod.io/user/variables
2. Click "New Variable"
3. For each variable:
   - **Name**: Variable name (e.g., `NEXT_PUBLIC_SUPABASE_URL`)
   - **Value**: Your actual value
   - **Scope**: `your-username/pixter` (or `*/*` for all repos)

---

## 🔒 Security Best Practices

### ✅ DO:
- ✅ Keep `.env.local` private (already in `.gitignore`)
- ✅ Use different secrets for development vs production
- ✅ Regenerate `NEXTAUTH_SECRET` for production
- ✅ Use Stripe test keys for development
- ✅ Use Stripe live keys for production only

### ❌ DON'T:
- ❌ Never commit `.env.local` to git
- ❌ Never share service role keys publicly
- ❌ Never use production keys in development
- ❌ Never expose secrets in client-side code
- ❌ Never reuse `NEXTAUTH_SECRET` across environments

---

## 🧪 Test Your Setup

### Check if variables are loaded:

**In browser console** (after starting dev server):
```javascript
// These should show values (NEXT_PUBLIC_ vars only):
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)

// These should be undefined (server-only):
console.log(process.env.SUPABASE_SERVICE_ROLE_KEY) // undefined ✅
console.log(process.env.STRIPE_SECRET_KEY) // undefined ✅
```

### Quick Test:
```bash
# Start dev server
npm run dev

# Visit http://localhost:3000
# Open browser DevTools (F12)
# Check Console for errors
# Should see no "env variables required" errors
```

---

## 🆘 Troubleshooting

### "env variables required" error

**Problem**: Supabase client can't initialize

**Solution**:
1. Check `.env.local` exists in project root
2. Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
3. Restart dev server (`Ctrl+C` then `npm run dev`)
4. Hard refresh browser (`Cmd+Shift+R` or `Ctrl+Shift+R`)

### "Invalid credentials" error

**Problem**: Wrong Supabase keys

**Solution**:
1. Go to https://app.supabase.com
2. Verify you copied the correct project's keys
3. Check for extra spaces or missing characters
4. Regenerate keys if needed (Settings → API → Reset keys)

### "Authentication failed" error

**Problem**: Wrong NextAuth configuration

**Solution**:
1. Verify `NEXTAUTH_SECRET` is at least 32 characters
2. Check `NEXTAUTH_URL` matches your current URL
3. For localhost: `http://localhost:3000`
4. For production: Your actual domain
5. Restart server after changing

### Variables not working in Vercel

**Problem**: Deployment doesn't see environment variables

**Solution**:
1. Verify variables added in Vercel Dashboard
2. Check "Environment" is set correctly (Production/Preview/Development)
3. Redeploy after adding variables:
   - Go to Deployments
   - Click "..." on latest
   - Click "Redeploy"

---

## 📚 Additional Resources

- **Supabase Docs**: https://supabase.com/docs/guides/auth
- **Stripe Docs**: https://stripe.com/docs/keys
- **NextAuth Docs**: https://next-auth.js.org/configuration/options
- **Vercel Docs**: https://vercel.com/docs/concepts/projects/environment-variables

---

## ✅ Final Checklist

Before deploying:

### Local Development:
- [ ] Created `.env.local` file
- [ ] Added all required Supabase variables
- [ ] Added all required Stripe test variables
- [ ] Generated and added `NEXTAUTH_SECRET`
- [ ] Set `NEXTAUTH_URL=http://localhost:3000`
- [ ] (Optional) Added Google OAuth credentials
- [ ] Server starts without errors
- [ ] Can access auth flows without errors

### Production (Vercel):
- [ ] Added all variables to Vercel dashboard
- [ ] Switched to Stripe LIVE keys
- [ ] Generated new `NEXTAUTH_SECRET` for production
- [ ] Set correct `NEXTAUTH_URL` (production domain)
- [ ] Updated Google OAuth redirect URIs (if using)
- [ ] Deployed and tested
- [ ] All authentication flows work
- [ ] No console errors in browser

---

**Need Help?**
- Check [AUTHENTICATION_GUIDE.md](AUTHENTICATION_GUIDE.md) for detailed auth documentation
- Check [QUICK_REFERENCE.md](QUICK_REFERENCE.md) for quick commands
- Check [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) for deployment steps

---

**Last Updated**: 2025-11-23
**Version**: 1.0
