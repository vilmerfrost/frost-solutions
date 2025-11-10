-- ================================================================
-- COMPLETE VERIFICATION & FIX SCRIPT
-- ================================================================
-- Run this ENTIRE script in Supabase SQL Editor to verify and fix everything
-- ================================================================

-- Step 1: Verify tables exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'app' 
    AND table_name = 'supplier_invoices'
  ) THEN
    RAISE EXCEPTION 'Table app.supplier_invoices does not exist. Run create_app_supplier_invoices.sql first!';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'app' 
    AND table_name = 'supplier_invoice_history'
  ) THEN
    RAISE EXCEPTION 'Table app.supplier_invoice_history does not exist. Run create_app_supplier_invoices.sql first!';
  END IF;
  
  RAISE NOTICE '✅ Tables exist';
END $$;

-- Step 2: Verify v2 function exists, create if not
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.routines
    WHERE routine_schema = 'public'
    AND routine_name = 'insert_supplier_invoice_v2'
  ) THEN
    RAISE NOTICE 'Creating insert_supplier_invoice_v2 function...';
    
    -- Function will be created below
  ELSE
    RAISE NOTICE '✅ Function insert_supplier_invoice_v2 exists';
  END IF;
END $$;

-- Step 3: Create/Recreate v2 function (idempotent)
CREATE OR REPLACE FUNCTION public.insert_supplier_invoice_v2(
  p_payload JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, app
AS $$
DECLARE
  v_invoice_id UUID;
  v_invoice JSONB;
  v_tenant_id UUID;
  v_supplier_id UUID;
  v_project_id UUID;
  v_file_path TEXT;
  v_file_size INTEGER;
  v_mime_type TEXT;
  v_original_filename TEXT;
  v_invoice_number TEXT;
  v_invoice_date DATE;
  v_status TEXT;
  v_ocr_confidence NUMERIC;
  v_ocr_data JSONB;
  v_extracted_data JSONB;
  v_created_by UUID;
BEGIN
  -- Extract parameters from JSONB
  v_tenant_id := (p_payload->>'p_tenant_id')::UUID;
  v_supplier_id := (p_payload->>'p_supplier_id')::UUID;
  v_project_id := NULLIF(p_payload->>'p_project_id', '')::UUID;
  v_file_path := p_payload->>'p_file_path';
  v_file_size := COALESCE((p_payload->>'p_file_size')::INTEGER, 0);
  v_mime_type := COALESCE(p_payload->>'p_mime_type', 'application/pdf');
  v_original_filename := p_payload->>'p_original_filename';
  v_invoice_number := NULLIF(p_payload->>'p_invoice_number', '');
  v_invoice_date := COALESCE(
    NULLIF(p_payload->>'p_invoice_date', '')::DATE,
    CURRENT_DATE
  );
  v_status := COALESCE(p_payload->>'p_status', 'pending_approval');
  v_ocr_confidence := NULLIF(p_payload->>'p_ocr_confidence', '')::NUMERIC;
  v_ocr_data := p_payload->'p_ocr_data';
  v_extracted_data := p_payload->'p_extracted_data';
  v_created_by := NULLIF(p_payload->>'p_created_by', '')::UUID;

  -- Validate required fields
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'p_tenant_id is required';
  END IF;
  
  IF v_supplier_id IS NULL THEN
    RAISE EXCEPTION 'p_supplier_id is required';
  END IF;
  
  IF v_file_path IS NULL OR v_file_path = '' THEN
    RAISE EXCEPTION 'p_file_path is required';
  END IF;

  -- Insert into app.supplier_invoices
  INSERT INTO app.supplier_invoices (
    tenant_id,
    supplier_id,
    project_id,
    file_path,
    file_size_bytes,
    mime_type,
    original_filename,
    invoice_number,
    invoice_date,
    status,
    ocr_confidence,
    ocr_data,
    extracted_data,
    created_by
  ) VALUES (
    v_tenant_id,
    v_supplier_id,
    v_project_id,
    v_file_path,
    v_file_size,
    v_mime_type,
    v_original_filename,
    v_invoice_number,
    v_invoice_date,
    v_status,
    v_ocr_confidence,
    v_ocr_data,
    v_extracted_data,
    v_created_by
  )
  RETURNING id INTO v_invoice_id;

  -- Log to history (transactional)
  INSERT INTO app.supplier_invoice_history (
    tenant_id,
    supplier_invoice_id,
    action,
    changed_by,
    data
  ) VALUES (
    v_tenant_id,
    v_invoice_id,
    'created',
    v_created_by,
    jsonb_build_object(
      'status', v_status,
      'file_path', v_file_path,
      'ocr_confidence', v_ocr_confidence,
      'invoice_number', v_invoice_number
    )
  );

  -- Return complete invoice
  SELECT jsonb_build_object(
    'id', id,
    'tenant_id', tenant_id,
    'supplier_id', supplier_id,
    'project_id', project_id,
    'file_path', file_path,
    'invoice_number', invoice_number,
    'invoice_date', invoice_date,
    'status', status,
    'ocr_confidence', ocr_confidence,
    'created_at', created_at
  ) INTO v_invoice
  FROM app.supplier_invoices
  WHERE id = v_invoice_id;

  RETURN v_invoice;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to insert supplier invoice: %', SQLERRM;
END;
$$;

-- Step 4: Grant permissions
GRANT EXECUTE ON FUNCTION public.insert_supplier_invoice_v2(JSONB) TO service_role, authenticated;

-- Step 5: Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Step 6: Verification queries
SELECT 
  'Tables' as check_type,
  COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema = 'app' 
AND table_name IN ('supplier_invoices', 'supplier_invoice_history')

UNION ALL

SELECT 
  'Functions' as check_type,
  COUNT(*) as count
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'insert_supplier_invoice_v2';

-- Expected output:
-- check_type | count
-- -----------|------
-- Tables     | 2
-- Functions  | 1

-- Step 7: Test function (uncomment and replace IDs to test)
/*
SELECT public.insert_supplier_invoice_v2('{
  "p_tenant_id": "your-tenant-id",
  "p_supplier_id": "your-supplier-id",
  "p_file_path": "/test/file.pdf",
  "p_file_size": 1024,
  "p_mime_type": "application/pdf",
  "p_original_filename": "test.pdf",
  "p_status": "draft"
}'::JSONB);
*/

-- ================================================================
-- If all checks pass, your RPC function is ready!
-- ================================================================

