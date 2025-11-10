# 🚀 IMPLEMENTATION GUIDE: RPC Function Fix

## Quick Summary

**Problem:** `Could not find the function public.insert_supplier_invoice(...) in the schema cache`

**Root Cause:** PostgREST schema cache mismatch - function exists but cache doesn't match parameter signature

**Solution:** JSONB wrapper function (most robust) + schema cache refresh

---

## Step 1: Quick Fix (Try This First - 2 minutes)

### Refresh Schema Cache

Run in Supabase SQL Editor:

```sql
-- Force PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';

-- Wait 2-3 seconds, then try your upload again
```

**If this works:** ✅ Problem solved! Continue using existing function.

**If this doesn't work:** Continue to Step 2.

---

## Step 2: Implement JSONB Wrapper (Robust Solution - 5 minutes)

### 2.1: Create JSONB Wrapper Function

1. Open Supabase SQL Editor
2. Open file: `supabase/rpc/supplier_invoices_v2.sql`
3. Copy entire contents
4. Paste in SQL Editor
5. Click **Run**
6. Wait for "Success"

### 2.2: Verify Function Created

```sql
-- Check if v2 function exists
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'insert_supplier_invoice_v2';
```

**Expected:** 1 row returned

### 2.3: Refresh Schema Cache Again

```sql
NOTIFY pgrst, 'reload schema';
```

### 2.4: Test Upload

The code has been updated to automatically use `insert_supplier_invoice_v2` (JSONB wrapper) with fallback to v1.

Try uploading a PDF again - it should work now!

---

## Step 3: Verify Everything Works

### Test RPC Function Directly

```sql
-- Test JSONB wrapper with sample data
SELECT public.insert_supplier_invoice_v2('{
  "p_tenant_id": "your-tenant-id",
  "p_supplier_id": "your-supplier-id",
  "p_file_path": "/test/file.pdf",
  "p_file_size": 1024,
  "p_mime_type": "application/pdf",
  "p_original_filename": "test.pdf",
  "p_invoice_number": "TEST-001",
  "p_status": "draft"
}'::JSONB);
```

**Expected:** JSONB object with invoice `id`

---

## What Changed in Code

### Before (Multi-parameter - Schema Cache Issues)
```typescript
await admin.rpc('insert_supplier_invoice', {
  p_tenant_id: tenantId,
  p_supplier_id: supplierId,
  // ... 12 more parameters
})
```

### After (JSONB Wrapper - No Schema Cache Issues)
```typescript
await admin.rpc('insert_supplier_invoice_v2', {
  p_payload: {
    p_tenant_id: tenantId,
    p_supplier_id: supplierId,
    // ... all parameters in one object
  }
})
```

**Benefits:**
- ✅ Single parameter = no schema cache matching issues
- ✅ Parameter order doesn't matter
- ✅ Easier to add new fields later
- ✅ Automatic fallback to v1 if v2 doesn't exist

---

## Troubleshooting

### Error: "function insert_supplier_invoice_v2 does not exist"
→ Run Step 2.1 again (create the function)

### Error: Still getting schema cache error
→ Run `NOTIFY pgrst, 'reload schema';` and wait 5 seconds

### Error: "p_tenant_id is required"
→ Make sure you're passing all required fields in payload

### Both functions fail
→ Check that tables exist: `SELECT * FROM app.supplier_invoices LIMIT 1;`

---

## Files Updated

- ✅ `supabase/rpc/supplier_invoices_v2.sql` - New JSONB wrapper function
- ✅ `app/lib/ocr/supplierInvoices.ts` - Updated to use v2 with fallback

---

## Why JSONB Wrapper Works

1. **Single Parameter:** PostgREST only needs to match ONE parameter type (JSONB)
2. **No Order Issues:** JSON objects have no inherent order
3. **Flexible:** Easy to add new fields without changing function signature
4. **Type Safe:** Still validates in PostgreSQL function
5. **Future Proof:** Won't break if PostgREST changes parameter matching

---

## Next Steps

1. ✅ Run Step 1 (quick fix) - test if it works
2. ✅ If not, run Step 2 (JSONB wrapper)
3. ✅ Test upload functionality
4. ✅ Monitor logs for any errors
5. ✅ Once stable, consider deprecating v1 function

**You're all set!** 🎉

