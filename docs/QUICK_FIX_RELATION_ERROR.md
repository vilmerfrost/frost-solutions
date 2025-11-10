# 🚀 Quick Start: Fix "relation does not exist" Error

## Problem
You're seeing: `relation "app.supplier_invoices" does not exist`

This means either:
1. ❌ RPC functions are not created yet
2. ❌ Tables don't exist in `app` schema
3. ❌ RPC function has wrong table reference

## Solution (5 minutes)

### Step 1: Create Tables in app Schema (2 minutes) ⚠️ DO THIS FIRST

1. **Open Supabase SQL Editor**
2. **Open file**: `supabase/migrations/create_app_supplier_invoices.sql`
3. **Copy entire contents**
4. **Paste in SQL Editor**
5. **Click Run**
6. **Wait for "Success"**

**This creates:**
- `app.supplier_invoices` table
- `app.supplier_invoice_history` table
- All required indexes and constraints

### Step 1b: Verify Tables Created (30 seconds)

Run in Supabase SQL Editor:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'app' 
AND table_name IN ('supplier_invoices', 'supplier_invoice_history');
```

**Expected:** 2 rows returned
- `supplier_invoices`
- `supplier_invoice_history`

**If empty:** Migration didn't run. Re-run Step 1.

### Step 2: Create RPC Functions (2 minutes)

1. Open `supabase/rpc/supplier_invoices.sql`
2. Copy **entire file contents**
3. Paste in Supabase SQL Editor
4. Click **Run** (or press F5)
5. Wait for "Success" message

### Step 3: Verify Functions Created (30 seconds)

Run in Supabase SQL Editor:

```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%supplier_invoice%';
```

**Expected:** 4 functions listed
- `get_supplier_invoice`
- `insert_supplier_invoice`
- `list_supplier_invoices`
- `update_supplier_invoice`

### Step 4: Test RPC Function (1 minute)

Run in Supabase SQL Editor (replace IDs with your actual values):

```sql
-- Get a valid supplier ID first
SELECT id FROM app.suppliers LIMIT 1;

-- Then test (replace tenant_id and supplier_id)
SELECT public.insert_supplier_invoice(
  'your-tenant-id'::UUID,
  'your-supplier-id'::UUID,
  NULL::UUID,
  '/test/file.pdf',
  1024,
  'application/pdf',
  'test.pdf',
  'TEST-001',
  CURRENT_DATE,
  'pending_approval',
  95.0,
  '{}'::JSONB,
  '{}'::JSONB,
  NULL::UUID
);
```

**If success:** ✅ JSONB object with invoice `id`  
**If error:** Check error message and fix accordingly

### Step 5: Test API (1 minute)

Restart your Next.js dev server, then test:

```bash
# Windows PowerShell
$file = "test.pdf"
Invoke-RestMethod -Uri "http://localhost:3000/api/supplier-invoices/upload" `
  -Method POST `
  -Headers @{"x-user-id"="test"} `
  -Form @{
    file = Get-Item $file
    supplier_id = "your-supplier-id"
  }
```

**Check server console** for detailed logs with correlation ID.

## Still Getting Errors?

### Error: "function does not exist"
→ RPC functions not created. Re-run Step 2.

### Error: "permission denied"
→ Run this in SQL Editor:
```sql
GRANT EXECUTE ON FUNCTION public.insert_supplier_invoice TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION public.update_supplier_invoice TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION public.get_supplier_invoice TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION public.list_supplier_invoices TO service_role, authenticated;
```

### Error: "relation app.supplier_invoices does not exist"
→ Tables don't exist. Create them first (see `verify_setup.sql` for table definitions).

### Error: "schema must be one of: public, graphql_public"
→ This shouldn't happen with RPC functions. Check that you're using `createAdminClient()` without schema parameter, or add `app` to Exposed schemas.

## Need More Help?

1. Check server logs (Next.js console) - look for `[Upload API]` and `[OCR]` logs
2. Check `docs/TESTING_INVOICE_UPLOAD.md` for detailed testing guide
3. Run `supabase/rpc/verify_setup.sql` for complete verification

## Files Created

- ✅ `supabase/rpc/supplier_invoices.sql` - RPC functions
- ✅ `supabase/rpc/verify_setup.sql` - Verification queries
- ✅ `docs/TESTING_INVOICE_UPLOAD.md` - Detailed test guide
- ✅ `docs/SUPABASE_SCHEMA_SETUP.md` - Schema setup guide

