-- Quick Verification Script for Supplier Invoice RPC Functions
-- Run this in Supabase SQL Editor to verify everything is set up correctly

-- ================================================================
-- 1. Check if RPC functions exist
-- ================================================================
SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%supplier_invoice%'
ORDER BY routine_name;

-- Expected: 4 functions should be listed
-- - get_supplier_invoice
-- - insert_supplier_invoice
-- - list_supplier_invoices
-- - update_supplier_invoice

-- ================================================================
-- 2. Check if tables exist in app schema
-- ================================================================
SELECT 
  table_schema,
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'app'
AND table_name IN ('supplier_invoices', 'supplier_invoice_history')
ORDER BY table_name;

-- Expected: 2 tables should be listed
-- - supplier_invoices
-- - supplier_invoice_history

-- ================================================================
-- 3. Check function permissions
-- ================================================================
SELECT 
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  r.rolname as granted_to
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
JOIN pg_proc_acl pa ON p.oid = pa.prooid
JOIN pg_roles r ON pa.grantee = r.oid
WHERE n.nspname = 'public'
AND p.proname LIKE '%supplier_invoice%'
ORDER BY p.proname, r.rolname;

-- Expected: Functions should be granted to 'service_role' and 'authenticated'

-- ================================================================
-- 4. Test RPC function (replace with your actual IDs)
-- ================================================================
-- Uncomment and fill in your values to test:
/*
SELECT public.insert_supplier_invoice(
  '00000000-0000-0000-0000-000000000000'::UUID,  -- Replace with your tenant_id
  '00000000-0000-0000-0000-000000000000'::UUID,  -- Replace with your supplier_id
  NULL::UUID,                                     -- project_id (optional)
  '/test/path/to/file.pdf',                       -- file_path
  1024,                                           -- file_size
  'application/pdf',                               -- mime_type
  'test-invoice.pdf',                             -- original_filename
  'TEST-INV-001',                                 -- invoice_number
  CURRENT_DATE,                                   -- invoice_date
  'pending_approval',                             -- status
  95.5,                                           -- ocr_confidence
  '{"text": "test ocr text"}'::JSONB,            -- ocr_data
  '{"invoiceNumber": "TEST-INV-001"}'::JSONB,    -- extracted_data
  NULL::UUID                                      -- created_by (optional)
);
*/

-- ================================================================
-- 5. Check if app schema is exposed (optional - only if using direct access)
-- ================================================================
-- Note: This requires admin access to check PostgREST configuration
-- Usually checked in Supabase Dashboard → Settings → API → Exposed schemas

-- ================================================================
-- Troubleshooting
-- ================================================================
-- If functions don't exist:
--   1. Open supabase/rpc/supplier_invoices.sql
--   2. Copy entire contents
--   3. Paste in Supabase SQL Editor
--   4. Run script
--   5. Re-run verification queries above

-- If tables don't exist:
--   You need to create the tables first. Check your migration scripts
--   or create them manually:
/*
CREATE SCHEMA IF NOT EXISTS app;

CREATE TABLE IF NOT EXISTS app.supplier_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  supplier_id UUID NOT NULL,
  project_id UUID,
  file_path TEXT,
  file_size_bytes INTEGER,
  mime_type TEXT,
  original_filename TEXT,
  invoice_number TEXT,
  invoice_date DATE,
  due_date DATE,
  status TEXT DEFAULT 'pending_approval',
  ocr_status TEXT,
  ocr_confidence NUMERIC,
  ocr_data JSONB,
  extracted_data JSONB,
  total_amount NUMERIC,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app.supplier_invoice_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  supplier_invoice_id UUID NOT NULL REFERENCES app.supplier_invoices(id),
  action TEXT NOT NULL,
  changed_by UUID,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
*/

-- If permissions are missing:
--   Run GRANT statements from supplier_invoices.sql:
/*
GRANT EXECUTE ON FUNCTION public.insert_supplier_invoice TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION public.update_supplier_invoice TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION public.get_supplier_invoice TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION public.list_supplier_invoices TO service_role, authenticated;
*/

