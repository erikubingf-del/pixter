# How to Get Supabase Keys - Step by Step

## 🎯 Exact Steps to Get the Correct Keys

### Step 1: Go to Supabase Dashboard

1. Visit: **https://app.supabase.com**
2. **Sign in** with your account
3. You should see a list of your projects

### Step 2: Select Your Project

1. Click on your **AmoPagar project** (or whatever you named it)
2. You'll land on the project dashboard

### Step 3: Go to Project Settings

1. Look at the **left sidebar**
2. Scroll to the bottom
3. Click the **⚙️ Settings** icon (gear icon)

### Step 4: Click API Settings

1. In the Settings page, look at the **left sidebar**
2. Click **"API"** under "Configuration" section
3. You should now see the "Project API keys" section

### Step 5: Copy the Keys

You'll see several sections. Here's what to copy:

---

#### ✅ Section 1: Project URL

**Look for**: "Config" section at the top

**Find this line**:
```
URL: https://xxxxxxxxxxxxx.supabase.co
```

**Copy this ENTIRE URL** (including `https://`)

**This is your**: `NEXT_PUBLIC_SUPABASE_URL`

**Example**:
```
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmno.supabase.co
```

---

#### ✅ Section 2: anon/public Key

**Look for**: "Project API keys" section

**Find the key labeled**: `anon` `public`

**It looks like**:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ubyIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjk...
```

**Copy this ENTIRE string** (very long, usually 200+ characters)

**This is your**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Important**:
- ✅ It starts with `eyJ`
- ✅ It has dots (.) in the middle
- ✅ It's very long (200-300 characters)
- ❌ Don't copy any extra spaces
- ❌ Don't include the label "anon" or "public"

---

#### ✅ Section 3: service_role Key (Secret!)

**Look for**: Same "Project API keys" section

**Find the key labeled**: `service_role` `secret`

**Click**: "Reveal" or "👁️" icon to show the key

**It looks like**:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ubyIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE2OT...
```

**Copy this ENTIRE string** (very long, even longer than anon key)

**This is your**: `SUPABASE_SERVICE_ROLE_KEY`

**Important**:
- ✅ Also starts with `eyJ`
- ✅ Even longer than anon key
- ⚠️ This is SECRET - never share publicly!
- ❌ Don't copy any extra spaces

---

## 📸 Visual Guide

### What You'll See:

```
┌─────────────────────────────────────────────────────────┐
│ Project Settings > API                                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Config                                                   │
│ ┌─────────────────────────────────────────────────────┐│
│ │ URL                                                  ││
│ │ https://abcdefghijklmno.supabase.co                 ││ ← Copy this!
│ └─────────────────────────────────────────────────────┘│
│                                                          │
│ Project API keys                                         │
│ ┌─────────────────────────────────────────────────────┐│
│ │ anon  public                                         ││
│ │ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3...     ││ ← Copy this!
│ │                                                      ││
│ │ service_role  secret                   👁️ Reveal    ││
│ │ ●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●  Click Reveal││
│ │ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3...     ││ ← Copy this!
│ └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

---

## ✅ Verify Your Keys Are Correct

### Check 1: Length
- ✅ `NEXT_PUBLIC_SUPABASE_URL`: Should be ~50 characters
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Should be 200-300 characters
- ✅ `SUPABASE_SERVICE_ROLE_KEY`: Should be 300-400 characters

### Check 2: Format
- ✅ URL starts with: `https://`
- ✅ URL ends with: `.supabase.co`
- ✅ Anon key starts with: `eyJ`
- ✅ Service role key starts with: `eyJ`

### Check 3: No Extra Characters
- ❌ No spaces at the beginning or end
- ❌ No quotes around the values
- ❌ No line breaks in the middle

---

## 🔧 Add to Vercel (Step by Step)

### After Getting the Keys:

1. Go to: https://vercel.com/dashboard
2. Click your **amopagar** project
3. Click **Settings** tab
4. Click **Environment Variables**
5. Click **Add New**

### Add Each Variable:

**Variable 1**:
```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: [Paste the URL you copied - starts with https://]
Environments: Check all three boxes (Production, Preview, Development)
```

**Variable 2**:
```
Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: [Paste the anon key - starts with eyJ, very long]
Environments: Check all three boxes
```

**Variable 3**:
```
Name: SUPABASE_SERVICE_ROLE_KEY
Value: [Paste the service_role key - starts with eyJ, even longer]
Environments: Check all three boxes
```

---

## 🚨 Common Mistakes

### ❌ Mistake 1: Using the Wrong Keys
**Wrong**: Using keys from the wrong Supabase project
**Fix**: Make sure you're in the correct project

### ❌ Mistake 2: Copying Extra Characters
**Wrong**: `"eyJhbGciOiJIUzI1NiIs..."`  (has quotes)
**Correct**: `eyJhbGciOiJIUzI1NiIs...`  (no quotes)

### ❌ Mistake 3: Truncated Keys
**Wrong**: Key gets cut off because it's too long
**Fix**: Make sure to copy the ENTIRE key (scroll to see all of it)

### ❌ Mistake 4: Spaces
**Wrong**: ` eyJhbGciOiJI...` (space at start)
**Correct**: `eyJhbGciOiJI...` (no space)

### ❌ Mistake 5: Not Revealing Secret Key
**Wrong**: Copying `●●●●●●●●●●●●●●●●` (masked)
**Fix**: Click "Reveal" or 👁️ icon FIRST, then copy

---

## 🧪 Test Your Keys Locally First

Before adding to Vercel, test locally:

1. Open `.env.local`
2. Paste the keys:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmno.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. Save the file
4. Restart your dev server (if running)
5. Visit http://localhost:3000/motorista/cadastro
6. You should NOT see the error anymore

If it works locally, then use the SAME keys in Vercel!

---

## 📞 Still Not Working?

### Check in Browser Console:

1. Open your Vercel deployment: `https://amopagar-git-main-crmlx.vercel.app`
2. Press `F12` to open DevTools
3. Go to **Console** tab
4. Type and press Enter:
```javascript
console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
```

**Expected**:
```
URL: https://abcdefghijklmno.supabase.co
Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**If you see**:
```
URL: undefined
Key: undefined
```

Then the variables are NOT in Vercel yet! Go back to Vercel Dashboard and add them.

---

## ✅ Final Checklist

- [ ] Logged into Supabase at https://app.supabase.com
- [ ] Selected correct project
- [ ] Went to Settings > API
- [ ] Copied Project URL (starts with https://)
- [ ] Copied anon key (starts with eyJ, ~200-300 chars)
- [ ] Clicked "Reveal" for service_role key
- [ ] Copied service_role key (starts with eyJ, ~300-400 chars)
- [ ] Added all 3 to Vercel Environment Variables
- [ ] Checked all boxes (Production, Preview, Development)
- [ ] Clicked "Save" on each variable
- [ ] Redeployed the app in Vercel
- [ ] Tested the deployment URL
- [ ] No more "env variables required" error!

---

**Need visual help?**

Take a screenshot of your Supabase Settings > API page (blur out the actual keys!) and I can verify you're looking at the right place.

**Last Updated**: 2025-11-23
