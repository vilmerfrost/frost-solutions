# 🚨 QUICK FIX: RPC Function Parameter Order

## Immediate Solution to Try

The error suggests PostgREST is having trouble matching the function. Try these fixes in order:

### Fix 1: Pass Parameters in Exact Function Definition Order

Update `app/lib/ocr/supplierInvoices.ts`:

```typescript
// Change from object with any order to exact function definition order
const { data: invoiceData, error: rpcError } = await admin.rpc('insert_supplier_invoice', {
  // Exact order as function definition
  p_tenant_id: tenantId,
  p_supplier_id: supplierId,
  p_project_id: projectId,  // This comes BEFORE p_file_path in function
  p_file_path: storagePath,
  p_file_size: fileBuffer.length,
  p_mime_type: mimeType || 'application/pdf',
  p_original_filename: fileName,
  p_invoice_number: invoiceNumber,
  p_invoice_date: ocr.fields?.invoiceDate || today,
  p_status: conf >= 70 ? 'pending_approval' : 'draft',
  p_ocr_confidence: conf,
  p_ocr_data: { text: ocr.text, confidence: conf },
  p_extracted_data: ocr.fields,
  p_created_by: createdBy
})
```

### Fix 2: Refresh PostgREST Schema Cache

Run in Supabase SQL Editor:

```sql
-- Force PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
```

Then restart your Next.js dev server.

### Fix 3: Use Positional Parameters (if named params fail)

```typescript
// Call with positional array instead of object
const { data, error } = await admin.rpc('insert_supplier_invoice', [
  tenantId,           // p_tenant_id
  supplierId,        // p_supplier_id
  projectId,         // p_project_id
  storagePath,       // p_file_path
  fileBuffer.length, // p_file_size
  mimeType || 'application/pdf', // p_mime_type
  fileName,          // p_original_filename
  invoiceNumber,     // p_invoice_number
  ocr.fields?.invoiceDate || today, // p_invoice_date
  conf >= 70 ? 'pending_approval' : 'draft', // p_status
  conf,              // p_ocr_confidence
  { text: ocr.text, confidence: conf }, // p_ocr_data
  ocr.fields,        // p_extracted_data
  createdBy          // p_created_by
])
```

**Note:** This requires updating the RPC function to accept positional params or using a different approach.

### Fix 4: Simplify Function Signature (Best Long-term)

Create a wrapper function with fewer parameters:

```sql
CREATE OR REPLACE FUNCTION public.insert_supplier_invoice_simple(
  p_tenant_id UUID,
  p_supplier_id UUID,
  p_data JSONB  -- All other data as JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invoice_id UUID;
BEGIN
  INSERT INTO app.supplier_invoices (
    tenant_id,
    supplier_id,
    project_id,
    file_path,
    -- ... extract from p_data JSONB
  ) VALUES (
    p_tenant_id,
    p_supplier_id,
    (p_data->>'project_id')::UUID,
    p_data->>'file_path',
    -- ...
  )
  RETURNING id INTO v_invoice_id;
  
  RETURN jsonb_build_object('id', v_invoice_id);
END;
$$;
```

Then call with:
```typescript
await admin.rpc('insert_supplier_invoice_simple', {
  p_tenant_id: tenantId,
  p_supplier_id: supplierId,
  p_data: {
    project_id: projectId,
    file_path: storagePath,
    // ... all other fields
  }
})
```

## Try These In Order

1. ✅ Fix 1 (parameter order) - 2 minutes
2. ✅ Fix 2 (schema refresh) - 1 minute  
3. ✅ Fix 3 (positional) - 5 minutes
4. ✅ Fix 4 (simplify) - 15 minutes

## While Waiting for AI Responses

Try Fix 1 and Fix 2 first - they're quick and often solve the issue!

