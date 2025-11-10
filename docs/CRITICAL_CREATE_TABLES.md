# 🚨 CRITICAL: Create Tables in app Schema

## Problem
RPC functions exist but tables don't exist in `app` schema. The error:
```
relation "app.supplier_invoices" does not exist
```

## Solution: Run Migration

### Step 1: Create Tables (2 minutes)

1. **Open Supabase SQL Editor**
2. **Open file**: `supabase/migrations/create_app_supplier_invoices.sql`
3. **Copy entire contents**
4. **Paste in SQL Editor**
5. **Click Run** (or press F5)
6. **Wait for "Success"**

### Step 2: Verify Tables Created (30 seconds)

Run this query:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'app' 
AND table_name IN ('supplier_invoices', 'supplier_invoice_history');
```

**Expected:** 2 rows returned
- `supplier_invoices`
- `supplier_invoice_history`

### Step 3: Test RPC Function (1 minute)

Test the RPC function directly:

```sql
-- Get a valid supplier ID first
SELECT id FROM public.suppliers LIMIT 1;

-- Then test (replace tenant_id and supplier_id with your values)
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

**Expected:** JSONB object with invoice `id` field

### Step 4: Test API Upload

After tables are created, try uploading again in your app. Check server logs for:
```
[Upload API] <correlation-id> - ✅ Success! Invoice ID: <id>
```

## What This Migration Does

1. ✅ Creates `app` schema if it doesn't exist
2. ✅ Creates `app.supplier_invoices` table with all required columns
3. ✅ Creates `app.supplier_invoice_history` table
4. ✅ Adds indexes for performance
5. ✅ Adds triggers for `updated_at` timestamp
6. ✅ Adds foreign key constraints

## Column Mapping

The migration creates tables that match what the RPC functions expect:

**RPC Function Expects:**
- `tenant_id`, `supplier_id`, `project_id`
- `file_path`, `file_size_bytes`, `mime_type`, `original_filename`
- `invoice_number`, `invoice_date`, `status`
- `ocr_confidence`, `ocr_data`, `extracted_data`
- `created_by`

**Migration Creates:** All of the above ✅

## Troubleshooting

### Error: "schema app does not exist"
→ Migration creates it automatically with `CREATE SCHEMA IF NOT EXISTS app`

### Error: "relation already exists"
→ Tables already exist. Check if they're in the right schema:
```sql
SELECT table_schema, table_name 
FROM information_schema.tables 
WHERE table_name IN ('supplier_invoices', 'supplier_invoice_history');
```

### Error: "permission denied"
→ Make sure you're running as a user with CREATE privileges (usually postgres/admin)

### Still getting "does not exist" after migration
→ Check that tables are in `app` schema, not `public`:
```sql
SELECT table_schema, table_name 
FROM information_schema.tables 
WHERE table_name = 'supplier_invoices';
```

Should show `app`, not `public`.

## Next Steps

Once tables are created:
1. ✅ RPC functions will work
2. ✅ API upload will work
3. ✅ You can start uploading and analyzing PDFs

**That's it!** After running the migration, your upload should work immediately.

