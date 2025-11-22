# Running Database Migrations - Step by Step Guide

## Prerequisites
- Supabase project already created ✅
- Access to Supabase Dashboard ✅

---

## Step 1: Open Supabase SQL Editor

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Select your Pixter project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**

---

## Step 2: Run Migrations in Order

### Migration 1: Create pagamentos (payments) table

**File:** `20251122000001_create_pagamentos_table.sql`

1. Copy the ENTIRE contents of this file
2. Paste into SQL Editor
3. Click **RUN** (or press Cmd/Ctrl + Enter)
4. Wait for: ✅ Success message
5. Verify: Go to **Table Editor** → You should see `pagamentos` table

**Expected output:**
```
Success. No rows returned.
```

---

### Migration 2: Create verification_codes table

**File:** `20251122000002_create_verification_codes_table.sql`

1. Click **New Query** again
2. Copy entire file contents
3. Paste and **RUN**
4. Verify: `verification_codes` table appears

---

### Migration 3: Create payment_methods table

**File:** `20251122000003_create_payment_methods_table.sql`

1. New Query
2. Copy, paste, **RUN**
3. Verify: `payment_methods` table appears

---

### Migration 4: Create sms_rate_limits table

**File:** `20251122000004_create_sms_rate_limits_table.sql`

1. New Query
2. Copy, paste, **RUN**
3. Verify: `sms_rate_limits` table appears

---

### Migration 5: Create RLS Policies

**File:** `20251122000005_create_rls_policies.sql`

1. New Query
2. Copy, paste, **RUN**
3. This will enable Row Level Security on all tables

**Expected output:**
```
Success. No rows returned.
```

---

## Step 3: Create Storage Buckets

### Create 'receipts' Bucket

1. Go to **Storage** in left sidebar
2. Click **New bucket**
3. Settings:
   - **Name:** `receipts`
   - **Public bucket:** ✅ YES (checked)
   - **File size limit:** 5 MB
   - **Allowed MIME types:** `application/pdf`
4. Click **Create bucket**

### Create 'selfies' Bucket

1. Click **New bucket** again
2. Settings:
   - **Name:** `selfies`
   - **Public bucket:** ✅ YES (checked)
   - **File size limit:** 5 MB
   - **Allowed MIME types:** `image/jpeg,image/png,image/jpg`
3. Click **Create bucket**

---

## Step 4: Verify Everything

### Check Tables Exist

Go to **Table Editor** → You should see:
- [x] pagamentos
- [x] payment_methods
- [x] profiles (should already exist from before)
- [x] sms_rate_limits
- [x] verification_codes

### Check Policies

Go to **Authentication** → **Policies**

You should see policies for:
- profiles (4 policies)
- pagamentos (4 policies)
- payment_methods (4 policies)
- verification_codes (4 policies)
- sms_rate_limits (3 policies)

### Check Storage Buckets

Go to **Storage** → You should see:
- [x] receipts (public)
- [x] selfies (public)

---

## Step 5: Test Database Functions

Run this test query in SQL Editor:

```sql
-- Test 1: Check pagamentos table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'pagamentos'
ORDER BY ordinal_position;

-- Test 2: Check SMS rate limit function
SELECT check_sms_rate_limit_phone('+5511999999999', 3, 60);
-- Should return: true (allowed)

-- Test 3: Check indexes exist
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('pagamentos', 'payment_methods', 'verification_codes', 'sms_rate_limits')
ORDER BY tablename, indexname;

-- Test 4: Verify RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('pagamentos', 'payment_methods', 'verification_codes', 'sms_rate_limits', 'profiles');
-- All should show rowsecurity = true
```

---

## Troubleshooting

### Error: "relation already exists"
**Solution:** Table already created. Skip this migration or drop the table first:
```sql
DROP TABLE IF EXISTS table_name CASCADE;
```
Then re-run the migration.

### Error: "permission denied"
**Solution:** You need to be the project owner or admin. Check your Supabase role.

### Error: "policy already exists"
**Solution:** Policies already created. Skip or drop first:
```sql
DROP POLICY IF EXISTS "policy_name" ON table_name;
```

### Storage bucket creation fails
**Solution:** Bucket might already exist. Check Storage section. If it exists, you're good!

---

## Verification Checklist

Before proceeding to testing:

- [ ] All 5 migration files executed successfully
- [ ] 5 tables visible in Table Editor
- [ ] RLS enabled on all tables (check with test query above)
- [ ] Policies created (check Authentication → Policies)
- [ ] 2 storage buckets created (receipts, selfies)
- [ ] Both buckets are public
- [ ] No error messages in SQL Editor

---

## Next Steps

Once all migrations are complete:

1. ✅ Migrations done!
2. → **Next:** Test payment flow (see QUICKSTART.md Step 3)
3. → **Then:** Verify receipt generation
4. → **Finally:** Go live!

---

**Time taken:** Should be ~15-20 minutes total
**Status:** Ready to test payments! 🚀

If you encounter any issues, check the error message carefully and refer to the Troubleshooting section above.
