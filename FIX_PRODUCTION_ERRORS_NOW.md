# 🚨 Fix Production Errors - Step by Step

## Current Errors on Vercel

Your logs show **2 critical errors**:

1. ❌ `[next-auth][error][NO_SECRET]` - Missing NEXTAUTH_SECRET
2. ❌ `Database error saving new user` - Missing INSERT policy on profiles table

---

## ✅ Fix 1: Add NEXTAUTH_SECRET to Vercel (2 minutes)

### Step-by-Step:

1. **Open Vercel Dashboard**: https://vercel.com/dashboard
2. **Click your project**: amopagar
3. **Go to Settings** tab
4. **Click "Environment Variables"** in left sidebar
5. **Click "Add New"** button

### Add This Variable:

```
Name: NEXTAUTH_SECRET
Value: Rnfp2IoqLsVH6RhwSadu8ifTcFPXHxbG88ElmOVH+Jk=
Environments: ☑️ Production ☑️ Preview ☑️ Development
```

6. **Click "Save"**

**Status**: ⏳ Wait to redeploy (we'll do this after fixing database)

---

## ✅ Fix 2: Add Missing Database Policy (3 minutes)

### The Problem:
Your Supabase database is missing an INSERT policy on the `profiles` table, so new users can't create their profile during signup.

### The Fix:
Run this SQL migration in Supabase.

### Step-by-Step:

1. **Go to Supabase Dashboard**: https://app.supabase.com
2. **Select your project** (vludtqhcmxrzyfyxrrrx)
3. **Click "SQL Editor"** in left sidebar
4. **Click "New query"** button
5. **Copy and paste this SQL**:

```sql
-- Fix: Add missing INSERT policies for profiles table
-- This allows the trigger to create profiles during signup

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;

-- Policy 1: Allow service role to insert profiles (used by handle_new_user trigger)
CREATE POLICY "Service role can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'role' = 'service_role'
  );

-- Policy 2: Allow authenticated users to insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (
    auth.uid() = id
  );

-- Add comments
COMMENT ON POLICY "Service role can insert profiles" ON profiles IS
  'Allows the service role to create profiles. This is used by the handle_new_user() trigger which runs during signup.';

COMMENT ON POLICY "Users can insert own profile" ON profiles IS
  'Allows authenticated users to create their own profile.';
```

6. **Click "Run"** (or press Ctrl+Enter / Cmd+Enter)
7. **Verify success**: You should see "Success. No rows returned"

**Alternative**: If you prefer, you can run the migration file directly:
- The migration is saved in: `supabase/migrations/20251123_fix_profile_insert_policy.sql`
- In Supabase SQL Editor, click "Upload SQL file" and select this file

---

## ✅ Fix 3: Add All Other Environment Variables to Vercel

While you're in Vercel, add the remaining environment variables from your `.env.local`:

### Quick Copy/Paste List:

Open [VERCEL_ENV_VARIABLES_TO_ADD.md](VERCEL_ENV_VARIABLES_TO_ADD.md) and add all 11 variables.

**Essential ones** (if you want to do minimum first):

1. ✅ `NEXTAUTH_SECRET` (already done above)
2. `NEXT_PUBLIC_SUPABASE_URL` = `https://vludtqhcmxrzyfyxrrrx.supabase.co`
3. `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsdWR0cWhjbXhyenlmeXhycnJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3NTk2NzQsImV4cCI6MjA3OTMzNTY3NH0.Ffmm3hL_jsEXywG1ERLsKszOZD4gdusrjWIJirt0PRY`
4. `SUPABASE_SERVICE_ROLE_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsdWR0cWhjbXhyenlmeXhycnJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzc1OTY3NCwiZXhwIjoyMDc5MzM1Njc0fQ.6SQgOzJoVS9bN3Blx09krsJQzlPHJM1pg5577Nf_55o`
5. `NEXTAUTH_URL` = `https://amopagar-git-main-crmlx.vercel.app`

For each variable:
- Click "Add New"
- Enter Name and Value
- Check all 3 environment boxes
- Click "Save"

---

## ✅ Fix 4: Redeploy on Vercel (2 minutes)

After adding **NEXTAUTH_SECRET** and fixing the database policy:

1. **In Vercel Dashboard**, go to **"Deployments"** tab
2. **Find your latest deployment** (should be at the top)
3. **Click the "..."** menu (three dots)
4. **Click "Redeploy"**
5. **Wait 2-3 minutes** for deployment to complete

---

## ✅ Fix 5: Test the Login Flow (1 minute)

After redeployment completes:

1. **Visit**: https://amopagar-git-main-crmlx.vercel.app/motorista/login
2. **Enter a phone number**: Example: `11999999999`
3. **Click "Enviar código"**
4. **Expected**:
   - ✅ "Código enviado! Verifique seu WhatsApp."
   - ✅ You receive SMS with 6-digit code
   - ✅ Enter code
   - ✅ Successfully logged in!

---

## 🎯 Quick Summary

**In Supabase** (3 minutes):
1. Go to SQL Editor
2. Run the INSERT policy SQL (above)
3. Verify success

**In Vercel** (5 minutes):
1. Add NEXTAUTH_SECRET (critical!)
2. Add other 10 environment variables
3. Redeploy

**Test** (1 minute):
1. Try driver phone login
2. Should work perfectly! ✅

---

## 📊 What Will Be Fixed

| Issue | Before | After |
|-------|--------|-------|
| NEXTAUTH_SECRET error | ❌ Broken | ✅ Fixed |
| Database error saving user | ❌ Broken | ✅ Fixed |
| Driver OTP login | ❌ Fails | ✅ Works |
| Client email signup | ❌ Fails | ✅ Works |
| Google OAuth | ❌ Fails | ✅ Works |

---

## 🆘 If You Still See Errors

After completing all steps, if you still see errors:

1. **Check Vercel Logs**:
   - Go to Deployments → Latest → Runtime Logs
   - Look for new error messages

2. **Share the new logs** with me, and I'll help debug further

---

## ✅ Complete Checklist

- [ ] Added NEXTAUTH_SECRET to Vercel
- [ ] Ran SQL migration in Supabase to add INSERT policy
- [ ] Added remaining env variables to Vercel (at least the 5 essential ones)
- [ ] Redeployed on Vercel
- [ ] Waited 2-3 minutes for deployment
- [ ] Tested driver login - works! ✅
- [ ] Tested client signup - works! ✅

---

**Time Estimate**: 10 minutes total
**Priority**: DO THIS NOW - Production is completely broken!

---

**Last Updated**: 2025-11-23
**Status**: Ready to execute
