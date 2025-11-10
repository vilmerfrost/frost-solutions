# ✅ QUICK CHECKLIST: Fix RPC Function Error

## 🚨 Problem
```
Could not find the function public.insert_supplier_invoice(...) in the schema cache
```

## ⚡ Quick Fix (Try This First - 30 seconds)

1. Open Supabase SQL Editor
2. Run:
   ```sql
   NOTIFY pgrst, 'reload schema';
   ```
3. Wait 3 seconds
4. Try uploading PDF again

**If this works:** ✅ Done! Skip to Step 3.

**If this doesn't work:** Continue below.

---

## 🔧 Full Solution (5 minutes)

### Step 1: Create JSONB Wrapper Function

1. Open `supabase/rpc/supplier_invoices_v2.sql`
2. Copy entire file
3. Paste in Supabase SQL Editor
4. Click **Run**
5. Wait for "Success"

### Step 2: Refresh Schema Cache

```sql
NOTIFY pgrst, 'reload schema';
```

### Step 3: Test Upload

The code now automatically uses `insert_supplier_invoice_v2` (JSONB wrapper).

Try uploading a PDF - it should work! ✅

---

## ✅ Verification

### Check Function Exists
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'insert_supplier_invoice_v2';
```
**Expected:** 1 row

### Test Function Directly
```sql
SELECT public.insert_supplier_invoice_v2('{
  "p_tenant_id": "test-tenant-id",
  "p_supplier_id": "test-supplier-id",
  "p_file_path": "/test/file.pdf"
}'::JSONB);
```
**Expected:** JSONB with invoice `id`

---

## 📋 What Was Changed

### Code Changes
- ✅ `app/lib/ocr/supplierInvoices.ts` - Now uses JSONB wrapper (v2) with fallback to v1
- ✅ Automatically removes `undefined` values (uses PostgreSQL DEFAULTs)
- ✅ Better error messages with hints

### Database Changes
- ✅ New function: `public.insert_supplier_invoice_v2(JSONB)`
- ✅ Helper function: `public.reload_postgrest_schema()`

---

## 🎯 Why This Works

**JSONB Wrapper Benefits:**
1. ✅ **Single parameter** = No schema cache matching issues
2. ✅ **Parameter order doesn't matter** (JSON objects are unordered)
3. ✅ **Future-proof** - Easy to add fields without changing signature
4. ✅ **Backwards compatible** - Falls back to v1 if v2 doesn't exist

---

## 🐛 Still Not Working?

### Check These:

1. **Tables exist?**
   ```sql
   SELECT * FROM app.supplier_invoices LIMIT 1;
   ```
   If error → Run `supabase/migrations/create_app_supplier_invoices.sql`

2. **Function created?**
   ```sql
   SELECT routine_name FROM information_schema.routines 
   WHERE routine_name = 'insert_supplier_invoice_v2';
   ```
   If empty → Run `supplier_invoices_v2.sql` again

3. **Schema cache refreshed?**
   ```sql
   NOTIFY pgrst, 'reload schema';
   ```
   Wait 5 seconds, then try again

4. **Check server logs**
   - Look for `[OCR]` logs in Next.js console
   - Check for correlation IDs
   - Look for specific error messages

---

## 📚 Files Reference

- **Implementation Guide:** `docs/IMPLEMENT_RPC_FIX.md`
- **SQL Function:** `supabase/rpc/supplier_invoices_v2.sql`
- **AI Prompts:** `docs/AI_PROMPTS_RPC_FUNCTION_ERROR.md`
- **Quick Fix:** `docs/QUICK_FIX_RPC_PARAMETER_ORDER.md`

---

**You're ready to test!** 🚀

