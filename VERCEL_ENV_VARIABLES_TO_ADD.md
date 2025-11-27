# Environment Variables to Add to Vercel

## 🚨 CRITICAL - Do This Now

Go to: https://vercel.com/dashboard → Your Project (amopagar) → Settings → Environment Variables

For **EACH** variable below, click "Add New" and:
1. Enter the Name
2. Paste the Value (from your .env.local)
3. Check **ALL 3** boxes: Production, Preview, Development
4. Click Save

---

## ✅ Required Variables (11 total)

### 1. Supabase Variables

**Name**: `NEXT_PUBLIC_SUPABASE_URL`
**Value**: `https://vludtqhcmxrzyfyxrrrx.supabase.co`
**Environments**: ☑️ Production ☑️ Preview ☑️ Development

---

**Name**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
**Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsdWR0cWhjbXhyenlmeXhycnJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3NTk2NzQsImV4cCI6MjA3OTMzNTY3NH0.Ffmm3hL_jsEXywG1ERLsKszOZD4gdusrjWIJirt0PRY`
**Environments**: ☑️ Production ☑️ Preview ☑️ Development

---

**Name**: `SUPABASE_SERVICE_ROLE_KEY`
**Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsdWR0cWhjbXhyenlmeXhycnJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzc1OTY3NCwiZXhwIjoyMDc5MzM1Njc0fQ.6SQgOzJoVS9bN3Blx09krsJQzlPHJM1pg5577Nf_55o`
**Environments**: ☑️ Production ☑️ Preview ☑️ Development

---

### 2. Stripe Variables

**Name**: `STRIPE_SECRET_KEY`
**Value**: `sk_test_51RHl6dDFfIUbvyERvs7Vjs54Fi8TJXDhqV1MySWr0yKrUen70fbKVsrx1dbXaBE87QdWir7QlTeDtSqKgKJNgoBe00gte6eoAJ`
**Environments**: ☑️ Production ☑️ Preview ☑️ Development
**Note**: This is test key - switch to live key for production later

---

**Name**: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
**Value**: `pk_test_51RHl6dDFfIUbvyER4zK3cw5MrvIeNv9dRyIUOBeoRGd3Pl3TFHJNYfG7EKJzeTQQ7buylNzxOMbqKD1sF8aJxsTZ00vIWmA1dC`
**Environments**: ☑️ Production ☑️ Preview ☑️ Development
**Note**: This is test key - switch to live key for production later

---

**Name**: `STRIPE_WEBHOOK_SECRET`
**Value**: `whsec_7mmBkfV1ZrVTmkkmAL3Vc7dqYD97tljJ`
**Environments**: ☑️ Production ☑️ Preview ☑️ Development

---

### 3. NextAuth Variables (🔴 CRITICAL - This is missing!)

**Name**: `NEXTAUTH_SECRET`
**Value**: `Rnfp2IoqLsVH6RhwSadu8ifTcFPXHxbG88ElmOVH+Jk=`
**Environments**: ☑️ Production ☑️ Preview ☑️ Development
**⚠️ THIS IS THE ONE CAUSING THE ERROR IN YOUR LOGS!**

---

**Name**: `NEXTAUTH_URL`
**Value**: `https://amopagar-git-main-crmlx.vercel.app`
**Environments**: ☑️ Production ☑️ Preview
**Note**: For Development, use `http://localhost:3000` or leave blank

---

### 4. Google OAuth Variables

**Name**: `GOOGLE_CLIENT_ID`
**Value**: `772109384584-etun8ejkep1me0q77j3giu6ahnv2t8gq.apps.googleusercontent.com`
**Environments**: ☑️ Production ☑️ Preview ☑️ Development

---

**Name**: `GOOGLE_CLIENT_SECRET`
**Value**: `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`
**Environments**: ☑️ Production ☑️ Preview ☑️ Development

---

### 5. App Configuration

**Name**: `NEXT_PUBLIC_APP_URL`
**Value**: `https://amopagar-git-main-crmlx.vercel.app`
**Environments**: ☑️ Production ☑️ Preview
**Note**: For Development, use `http://localhost:3000`

---

## ⚙️ Optional - Twilio Variables

Since you're using Twilio via Supabase (which you already configured in Supabase dashboard), you **don't need** to add these to Vercel unless you're calling Twilio directly from your API routes.

However, if you want to add them for future use:

**Name**: `TWILIO_ACCOUNT_SID`
**Value**: `ACf732c8d1bd2e881724592369471bbb4d`
**Environments**: ☑️ Production ☑️ Preview ☑️ Development

**Name**: `TWILIO_AUTH_TOKEN`
**Value**: `934e62c6d7cbb7defabbb74f3db9fe39`
**Environments**: ☑️ Production ☑️ Preview ☑️ Development

**Name**: `TWILIO_PHONE_NUMBER`
**Value**: `+17623727247`
**Environments**: ☑️ Production ☑️ Preview ☑️ Development

---

## 🎯 Quick Checklist

After adding all variables to Vercel:

- [ ] NEXT_PUBLIC_SUPABASE_URL ✅
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY ✅
- [ ] SUPABASE_SERVICE_ROLE_KEY ✅
- [ ] STRIPE_SECRET_KEY ✅
- [ ] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ✅
- [ ] STRIPE_WEBHOOK_SECRET ✅
- [ ] **NEXTAUTH_SECRET** ✅ ← CRITICAL!
- [ ] NEXTAUTH_URL ✅
- [ ] GOOGLE_CLIENT_ID ✅
- [ ] GOOGLE_CLIENT_SECRET ✅
- [ ] NEXT_PUBLIC_APP_URL ✅
- [ ] (Optional) Twilio variables

---

## 🚀 After Adding Variables

1. Go to **Deployments** tab in Vercel
2. Click the **"..."** menu on your latest deployment
3. Click **"Redeploy"**
4. Wait 2-3 minutes for deployment to complete
5. Visit: https://amopagar-git-main-crmlx.vercel.app/motorista/login
6. Test phone login - should work now! ✅

---

## 📸 Visual Guide

In Vercel dashboard:

```
Settings
  ↓
Environment Variables
  ↓
Click "Add New"
  ↓
Name: NEXTAUTH_SECRET
Value: Rnfp2IoqLsVH6RhwSadu8ifTcFPXHxbG88ElmOVH+Jk=
  ↓
☑️ Production
☑️ Preview
☑️ Development
  ↓
Click "Save"
  ↓
Repeat for all 11 variables
```

---

**Time Estimate**: 5-7 minutes to add all variables
**Priority**: DO THIS NOW - Production is broken without these!

---

**Last Updated**: 2025-11-23
**Status**: Ready to copy/paste into Vercel
