# ⚡ Quick Migration Shortcut

**When you're ready to run migrations, come back here!**

---

## 📍 Step-by-Step (Copy/Paste Friendly)

### 1. Open Supabase
**URL:** https://app.supabase.com → Select Pixter project → SQL Editor

### 2. Run These SQL Files in Order

**Copy each file content from:** `supabase/migrations/`

```
✅ Step 1: 20251122000000_ensure_profiles_table.sql
✅ Step 2: 20251122000001_create_pagamentos_table.sql
✅ Step 3: 20251122000002_create_verification_codes_table.sql
✅ Step 4: 20251122000003_create_payment_methods_table.sql
✅ Step 5: 20251122000004_create_sms_rate_limits_table.sql
✅ Step 6: 20251122000005_create_rls_policies.sql
```

### 3. Create Storage Buckets

**Go to:** Storage → New Bucket

```
Bucket 1:
- Name: receipts
- Public: YES ✅
- File size limit: 5 MB
- MIME types: application/pdf

Bucket 2:
- Name: selfies
- Public: YES ✅
- File size limit: 5 MB
- MIME types: image/jpeg,image/png,image/jpg
```

### 4. Verify

**Run this test query:**
```sql
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('pagamentos', 'payment_methods', 'verification_codes', 'sms_rate_limits')
ORDER BY tablename;
```

**Expected result:** 4 tables listed

---

## ⏱️ Time: 20-30 minutes total

**Full detailed guide:** See `supabase/RUN_MIGRATIONS.md`

---

**After migrations, test payment flow:** See `QUICKSTART.md` Step 3
