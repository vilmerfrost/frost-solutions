# 🔍 DEBUG GUIDE: RPC Function Still Not Working

## ✅ Syntax Error Fixed

The template string syntax error has been fixed. The build should now work.

---

## 🐛 If Upload Still Fails After Running SQL

### Step 1: Check Server Logs

Look in your **Next.js console** (terminal where `npm run dev` is running) for:

```
[Upload API] <correlation-id> - Starting upload request
[OCR] Calling RPC insert_supplier_invoice_v2 (JSONB wrapper)...
[OCR] RPC payload: { ... }
[OCR] ❌ RPC call failed: ...
```

**Copy the exact error message** - this will tell us what's wrong.

### Step 2: Verify Function Exists

Run in Supabase SQL Editor:

```sql
-- Check if v2 function exists
SELECT 
  routine_name,
  routine_type,
  pg_get_function_arguments(oid) as arguments
FROM information_schema.routines
WHERE routine_schema = 'public' 
AND routine_name = 'insert_supplier_invoice_v2';
```

**Expected:** 1 row with `insert_supplier_invoice_v2` and arguments showing `p_payload jsonb`

**If empty:** Function not created. Re-run `supplier_invoices_v2.sql`

### Step 3: Test Function Directly

Run in Supabase SQL Editor (replace with your actual IDs):

```sql
-- Test v2 function directly
SELECT public.insert_supplier_invoice_v2('{
  "p_tenant_id": "your-tenant-id-here",
  "p_supplier_id": "your-supplier-id-here",
  "p_file_path": "/test/file.pdf",
  "p_file_size": 1024,
  "p_mime_type": "application/pdf",
  "p_original_filename": "test.pdf",
  "p_status": "draft"
}'::JSONB);
```

**If this works:** Function is correct, problem is in TypeScript call  
**If this fails:** Check error message - likely table doesn't exist

### Step 4: Check Tables Exist

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'app' 
AND table_name IN ('supplier_invoices', 'supplier_invoice_history');
```

**Expected:** 2 rows  
**If empty:** Run `supabase/migrations/create_app_supplier_invoices.sql`

### Step 5: Refresh Schema Cache

```sql
NOTIFY pgrst, 'reload schema';
```

Wait 5 seconds, then try upload again.

---

## 🔧 Common Issues & Fixes

### Issue: "function insert_supplier_invoice_v2 does not exist"

**Fix:**
1. Open `supabase/rpc/supplier_invoices_v2.sql`
2. Copy entire file
3. Paste in Supabase SQL Editor
4. Click Run
5. Verify with Step 2 above

### Issue: "relation app.supplier_invoices does not exist"

**Fix:**
1. Run `supabase/migrations/create_app_supplier_invoices.sql`
2. Verify with Step 4 above

### Issue: "permission denied"

**Fix:**
```sql
GRANT EXECUTE ON FUNCTION public.insert_supplier_invoice_v2(JSONB) TO service_role, authenticated;
```

### Issue: Function exists but still getting "not found"

**Fix:**
1. Refresh schema cache: `NOTIFY pgrst, 'reload schema';`
2. Wait 5 seconds
3. Restart Next.js dev server
4. Try upload again

---

## 📋 Complete Verification Checklist

Run these in order:

```sql
-- 1. Check function exists
SELECT routine_name FROM information_schema.routines 
WHERE routine_name = 'insert_supplier_invoice_v2';

-- 2. Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'app' 
AND table_name IN ('supplier_invoices', 'supplier_invoice_history');

-- 3. Refresh cache
NOTIFY pgrst, 'reload schema';

-- 4. Test function (replace IDs)
SELECT public.insert_supplier_invoice_v2('{
  "p_tenant_id": "test-id",
  "p_supplier_id": "test-id",
  "p_file_path": "/test.pdf"
}'::JSONB);
```

**All should succeed before testing upload.**

---

## 🚨 Still Not Working?

### Get Detailed Error Info

1. **Check Next.js console** for `[OCR]` logs
2. **Check browser console** for network errors
3. **Check Supabase logs** (Dashboard → Logs → API)

### Share These Details:

- Exact error message from server logs
- Result of Step 2 (function exists?)
- Result of Step 4 (tables exist?)
- Result of Step 3 (direct SQL test works?)

---

## 💡 Quick Test

After fixing syntax error, try this:

1. **Restart Next.js dev server** (Ctrl+C, then `npm run dev`)
2. **Refresh browser** (hard refresh: Ctrl+Shift+R)
3. **Try upload again**
4. **Check server console** for detailed logs

The syntax error is now fixed - the build should work! 🎉

