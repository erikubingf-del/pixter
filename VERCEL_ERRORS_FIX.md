# Vercel Errors - Quick Fix Guide

## 🔴 Errors Found in Your Logs

### Error 1: NO_SECRET ❌
```
[next-auth][error][NO_SECRET]
Please define a `secret` in production.
```
**What this means**: NEXTAUTH_SECRET is missing in Vercel

---

### Error 2: Unsupported phone provider ❌
```
Supabase signInWithOtp error: Unsupported phone provider
```
**What this means**: Phone authentication not enabled in Supabase

---

## ✅ IMMEDIATE FIXES NEEDED

### Fix 1: Add NEXTAUTH_SECRET (5 minutes)

**Step 1**: Generate Secret
- Visit: https://generate-secret.vercel.app/32
- Copy the generated secret

**Step 2**: Add to Vercel
1. Go to https://vercel.com/dashboard
2. Click **amopagar** project
3. Click **Settings** tab
4. Click **Environment Variables**
5. Click **Add New**
6. Fill in:
   ```
   Name: NEXTAUTH_SECRET
   Value: [paste secret from step 1]
   Environment: Check all 3 boxes
   ```
7. Click **Save**

---

### Fix 2: Enable Phone Auth in Supabase (10 minutes)

**Step 1**: Go to Supabase
1. Visit: https://app.supabase.com
2. Select your project
3. Click **Authentication** in left sidebar
4. Click **Providers** tab

**Step 2**: Find Phone Provider
1. Scroll down to **Phone** section
2. Toggle it **ON** (enable)

**Step 3**: Configure SMS Provider

You have 2 options:

#### Option A: Use Supabase Built-in SMS (Quick, for testing)
1. After enabling Phone, select **"Supabase"** as the SMS provider
2. Click **Save**
3. ⚠️ Note: Limited free messages, good for testing only

#### Option B: Use Twilio (Production-ready)
1. Go to https://console.twilio.com
2. Sign up / Log in
3. Get a phone number (must purchase one - around $1-2/month)
4. Copy credentials:
   - Account SID (starts with AC...)
   - Auth Token
   - Phone Number (+55...)
5. Back in Supabase, select **"Twilio"** as provider
6. Paste credentials
7. Click **Save**

**Step 4**: Save Configuration
- Click **Save** button
- Wait 1-2 minutes for changes to propagate

---

### Fix 3: Redeploy on Vercel

After adding NEXTAUTH_SECRET and enabling Phone in Supabase:

1. Go to Vercel Dashboard
2. Click **Deployments** tab
3. Find latest deployment
4. Click **"..."** menu
5. Click **Redeploy**
6. Wait 2-3 minutes

---

## 🧪 Test After Fixes

1. Visit: https://amopagar-git-main-crmlx.vercel.app/motorista/login
2. Enter phone number
3. Click "Enviar código"
4. Should work now! ✅

---

## 📋 Complete Environment Variables Checklist

Based on your logs, here's what Vercel needs:

### ✅ REQUIRED (Must have):
- [ ] NEXT_PUBLIC_SUPABASE_URL
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
- [ ] SUPABASE_SERVICE_ROLE_KEY
- [ ] **NEXTAUTH_SECRET** ← Missing! Add this!
- [ ] NEXTAUTH_URL
- [ ] STRIPE_SECRET_KEY
- [ ] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

### ⚙️ OPTIONAL (Only if using Twilio):
- [ ] TWILIO_ACCOUNT_SID
- [ ] TWILIO_AUTH_TOKEN
- [ ] TWILIO_PHONE_NUMBER

---

## 🎯 Quick Steps Summary

1. **Now**: Add NEXTAUTH_SECRET to Vercel
2. **Now**: Enable Phone provider in Supabase
3. **Now**: Redeploy on Vercel
4. **Wait**: 3 minutes
5. **Test**: Try login again

---

## 🆘 If Still Not Working

Check Vercel logs again:
1. Go to Vercel Dashboard
2. Click **Deployments**
3. Click latest deployment
4. Click **Runtime Logs**
5. Look for new errors
6. Share them with me

---

## 📸 Visual Checklist

### In Supabase:
```
Authentication > Providers
  ↓
Find "Phone"
  ↓
Toggle ON
  ↓
Select SMS Provider (Supabase or Twilio)
  ↓
SAVE
```

### In Vercel:
```
Settings > Environment Variables
  ↓
Add New
  ↓
Name: NEXTAUTH_SECRET
Value: [generated secret]
  ↓
Check all 3 environment boxes
  ↓
SAVE
  ↓
Go to Deployments > Redeploy
```

---

## ⏱️ Time Estimate

- Adding NEXTAUTH_SECRET: **2 minutes**
- Enabling Phone in Supabase: **5 minutes**
- Redeploying: **3 minutes**
- **Total: 10 minutes** ⏰

---

**Priority**: Fix these TWO things FIRST, then test. Everything else can wait!

**Last Updated**: 2025-11-23 19:45
