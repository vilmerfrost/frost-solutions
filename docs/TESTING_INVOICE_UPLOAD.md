# Test Guide: Supplier Invoice Upload

## Prerequisites

1. **RPC Functions Created**: Make sure you've run `supabase/rpc/supplier_invoices.sql` in Supabase SQL Editor
2. **Tables Exist**: Verify that `app.supplier_invoices` and `app.supplier_invoice_history` tables exist
3. **Valid Supplier ID**: You need a valid supplier ID from your database

## Step 1: Verify RPC Functions Exist

Run this in Supabase SQL Editor:

```sql
-- Check if RPC functions exist
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%supplier_invoice%'
ORDER BY routine_name;
```

**Expected output:**
```
routine_name                  | routine_type
------------------------------|-------------
get_supplier_invoice          | FUNCTION
insert_supplier_invoice       | FUNCTION
list_supplier_invoices        | FUNCTION
update_supplier_invoice       | FUNCTION
```

If functions are missing, run `supabase/rpc/supplier_invoices.sql` again.

## Step 2: Verify Tables Exist

Run this in Supabase SQL Editor:

```sql
-- Check if tables exist in app schema
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'app'
AND table_name IN ('supplier_invoices', 'supplier_invoice_history')
ORDER BY table_name;
```

**Expected output:**
```
table_name
------------------
supplier_invoice_history
supplier_invoices
```

If tables are missing, you need to create them first (not included in RPC script).

## Step 3: Get a Valid Supplier ID

Run this in Supabase SQL Editor:

```sql
-- Get a valid supplier ID (replace with your tenant_id)
SELECT id, name 
FROM app.suppliers 
WHERE tenant_id = 'your-tenant-id-here'
LIMIT 1;
```

Copy the `id` value - you'll need it for testing.

## Step 4: Test RPC Function Directly

Test the RPC function directly in Supabase SQL Editor:

```sql
-- Test insert_supplier_invoice function
SELECT public.insert_supplier_invoice(
  'your-tenant-id'::UUID,           -- p_tenant_id
  'your-supplier-id'::UUID,         -- p_supplier_id
  NULL::UUID,                       -- p_project_id (optional)
  '/test/path/to/file.pdf',         -- p_file_path
  1024,                             -- p_file_size
  'application/pdf',                -- p_mime_type
  'test-invoice.pdf',               -- p_original_filename
  'TEST-INV-001',                   -- p_invoice_number
  CURRENT_DATE,                     -- p_invoice_date
  'pending_approval',               -- p_status
  95.5,                             -- p_ocr_confidence
  '{"text": "test"}'::JSONB,        -- p_ocr_data
  '{"invoiceNumber": "TEST-INV-001"}'::JSONB, -- p_extracted_data
  NULL::UUID                        -- p_created_by (optional)
);
```

**Expected output:** JSONB object with invoice data including `id` field.

**If you get an error:**
- `relation "app.supplier_invoices" does not exist` → Tables don't exist, create them first
- `function does not exist` → RPC function not created, run SQL script
- `permission denied` → Check GRANT statements in SQL script

## Step 5: Test via API (cURL)

### Windows PowerShell

```powershell
# Create a test file first (or use existing PDF)
$testFile = "test-invoice.pdf"
if (-not (Test-Path $testFile)) {
    # Create a dummy PDF file for testing
    "PDF-1.4" | Out-File -FilePath $testFile -Encoding ASCII
}

# Test upload
$tenantId = "your-tenant-id-here"
$supplierId = "your-supplier-id-here"
$userId = "test-user-id"

$formData = @{
    file = Get-Item $testFile
    supplier_id = $supplierId
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/supplier-invoices/upload" `
    -Method POST `
    -Headers @{
        "x-user-id" = $userId
        "x-tenant-id" = $tenantId
    } `
    -ContentType "multipart/form-data" `
    -Body $formData
```

### Linux/Mac (bash)

```bash
# Create a test PDF file (or use existing)
echo "%PDF-1.4" > test-invoice.pdf

# Test upload
curl -X POST http://localhost:3000/api/supplier-invoices/upload \
  -H "x-user-id: test-user-id" \
  -H "x-tenant-id: your-tenant-id-here" \
  -F "file=@test-invoice.pdf" \
  -F "supplier_id=your-supplier-id-here" \
  -v
```

### Using Postman/Insomnia

1. **Method**: POST
2. **URL**: `http://localhost:3000/api/supplier-invoices/upload`
3. **Headers**:
   - `x-user-id`: `test-user-id`
   - `x-tenant-id`: `your-tenant-id-here`
4. **Body**: `form-data`
   - `file`: (File) Select your test PDF
   - `supplier_id`: (Text) Your supplier ID
   - `project_id`: (Text, optional) Your project ID

## Step 6: Check Server Logs

After making a request, check your Next.js server console for logs:

```
[Upload API] <correlation-id> - Starting upload request
[Upload API] <correlation-id> - Tenant ID: <tenant-id>
[Upload API] <correlation-id> - File: test-invoice.pdf, Size: 1024, Type: application/pdf
[Upload API] <correlation-id> - Starting OCR processing...
[OCR] RPC insert_supplier_invoice failed: <error>
```

## Common Errors & Solutions

### Error: "relation app.supplier_invoices does not exist"

**Solution:**
1. Check if tables exist: Run Step 2 above
2. If tables don't exist, create them first (migration script needed)
3. Verify schema name is correct: `app` not `public`

### Error: "function insert_supplier_invoice does not exist"

**Solution:**
1. Run `supabase/rpc/supplier_invoices.sql` in Supabase SQL Editor
2. Verify function exists: Run Step 1 above
3. Check function is in `public` schema, not `app`

### Error: "permission denied for function"

**Solution:**
1. Run GRANT statements from SQL script:
   ```sql
   GRANT EXECUTE ON FUNCTION public.insert_supplier_invoice TO service_role, authenticated;
   ```
2. Verify service role key is correct in `.env.local`

### Error: "The schema must be one of the following: public, graphql_public"

**Solution:**
This error should NOT occur with RPC functions (they're in `public` schema).
- If you see this, check that you're using `createAdminClient()` without schema parameter
- Or add `app` to Exposed schemas in Supabase Dashboard → Settings → API

## Step 7: Verify Data Created

After successful upload, verify data:

```sql
-- Check invoice was created
SELECT id, invoice_number, status, ocr_confidence, created_at
FROM app.supplier_invoices
WHERE tenant_id = 'your-tenant-id'
ORDER BY created_at DESC
LIMIT 5;

-- Check history was logged
SELECT id, supplier_invoice_id, action, created_at
FROM app.supplier_invoice_history
WHERE tenant_id = 'your-tenant-id'
ORDER BY created_at DESC
LIMIT 5;
```

## Debugging Tips

1. **Enable verbose logging**: Check Next.js console for detailed logs
2. **Test RPC directly**: Always test RPC function in SQL Editor first
3. **Check correlation ID**: Each request has a unique ID in logs
4. **Verify environment**: Make sure `.env.local` has correct Supabase credentials
5. **Check network tab**: Browser DevTools → Network → Check request/response

## Next Steps

Once upload works:
1. Test with real invoice PDFs
2. Verify OCR extraction works
3. Test listing invoices: `GET /api/supplier-invoices`
4. Test updating invoices: `PUT /api/supplier-invoices/:id`

