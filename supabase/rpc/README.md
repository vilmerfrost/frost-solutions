# Supplier Invoices RPC Functions

## Quick Setup

1. **Open Supabase Dashboard** → SQL Editor
2. **Copy entire contents** of `supabase/rpc/supplier_invoices.sql`
3. **Paste and Run** in SQL Editor
4. **Verify** functions are created:
   ```sql
   SELECT routine_name 
   FROM information_schema.routines 
   WHERE routine_schema = 'public' 
   AND routine_name LIKE '%supplier_invoice%';
   ```

## Functions Overview

### `insert_supplier_invoice`
Creates a new supplier invoice and logs to history in a single transaction.

**Parameters:**
- `p_tenant_id` (UUID, required)
- `p_supplier_id` (UUID, required)
- `p_project_id` (UUID, optional)
- `p_file_path` (TEXT, required)
- `p_file_size` (INTEGER, default: 0)
- `p_mime_type` (TEXT, default: 'application/pdf')
- `p_original_filename` (TEXT, optional)
- `p_invoice_number` (TEXT, optional)
- `p_invoice_date` (DATE, default: CURRENT_DATE)
- `p_status` (TEXT, default: 'pending_approval')
- `p_ocr_confidence` (NUMERIC, optional)
- `p_ocr_data` (JSONB, optional)
- `p_extracted_data` (JSONB, optional)
- `p_created_by` (UUID, optional)

**Returns:** JSONB with invoice data including `id`

### `update_supplier_invoice`
Updates an existing invoice and logs changes to history.

**Parameters:**
- `p_invoice_id` (UUID, required)
- `p_tenant_id` (UUID, required)
- `p_status` (TEXT, optional)
- `p_ocr_status` (TEXT, optional)
- `p_ocr_data` (JSONB, optional)
- `p_extracted_data` (JSONB, optional)
- `p_invoice_number` (TEXT, optional)
- `p_invoice_date` (DATE, optional)
- `p_due_date` (DATE, optional)
- `p_total_amount` (NUMERIC, optional)
- `p_ocr_confidence` (NUMERIC, optional)
- `p_updated_by` (UUID, optional)

**Returns:** JSONB with updated invoice data

### `get_supplier_invoice`
Retrieves a single invoice by ID.

**Parameters:**
- `p_invoice_id` (UUID, required)
- `p_tenant_id` (UUID, required)

**Returns:** JSONB with invoice data

### `list_supplier_invoices`
Lists invoices with filtering and pagination.

**Parameters:**
- `p_tenant_id` (UUID, required)
- `p_limit` (INTEGER, default: 50)
- `p_offset` (INTEGER, default: 0)
- `p_status` (TEXT, optional)
- `p_project_id` (UUID, optional)
- `p_supplier_id` (UUID, optional)
- `p_search` (TEXT, optional) - searches invoice_number and notes

**Returns:** JSONB with `{ data: [...], total: number, limit: number, offset: number }`

## Usage in Code

```typescript
import { createAdminClient } from '@/utils/supabase/admin'

const admin = createAdminClient() // Uses 'public' schema for RPC calls

// Insert invoice
const { data, error } = await admin.rpc('insert_supplier_invoice', {
  p_tenant_id: tenantId,
  p_supplier_id: supplierId,
  p_file_path: '/path/to/file.pdf',
  // ... other parameters
})

// List invoices
const { data: invoices, error } = await admin.rpc('list_supplier_invoices', {
  p_tenant_id: tenantId,
  p_limit: 20,
  p_offset: 0,
  p_status: 'pending_approval'
})
```

## Security

- All functions use `SECURITY DEFINER` to access `app` schema
- Functions validate `tenant_id` to ensure data isolation
- Only `service_role` and `authenticated` roles can execute functions
- History logging is automatic and transactional

## Notes

- Functions handle both invoice creation/update AND history logging atomically
- If history insert fails, entire transaction rolls back
- All date fields default to `CURRENT_DATE` if not provided
- Search is case-insensitive and uses `ILIKE` pattern matching

