-- ================================================================
-- RPC Functions for Supplier Invoices (app schema)
-- ================================================================
-- These functions allow access to app.supplier_invoices and related tables
-- without requiring the 'app' schema to be exposed in Supabase API settings.
--
-- IMPORTANT: Run this SQL in Supabase SQL Editor
-- ================================================================

-- ================================================================
-- RPC: Insert Supplier Invoice (with history logging)
-- ================================================================
CREATE OR REPLACE FUNCTION public.insert_supplier_invoice(
  p_tenant_id UUID,
  p_supplier_id UUID,
  p_project_id UUID DEFAULT NULL,
  p_file_path TEXT,
  p_file_size INTEGER DEFAULT 0,
  p_mime_type TEXT DEFAULT 'application/pdf',
  p_original_filename TEXT DEFAULT NULL,
  p_invoice_number TEXT DEFAULT NULL,
  p_invoice_date DATE DEFAULT NULL,
  p_status TEXT DEFAULT 'pending_approval',
  p_ocr_confidence NUMERIC DEFAULT NULL,
  p_ocr_data JSONB DEFAULT NULL,
  p_extracted_data JSONB DEFAULT NULL,
  p_created_by UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Runs as function owner (bypasses RLS)
AS $$
DECLARE
  v_invoice_id UUID;
  v_invoice JSONB;
BEGIN
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
    p_tenant_id,
    p_supplier_id,
    p_project_id,
    p_file_path,
    p_file_size,
    p_mime_type,
    p_original_filename,
    p_invoice_number,
    COALESCE(p_invoice_date, CURRENT_DATE),
    p_status,
    p_ocr_confidence,
    p_ocr_data,
    p_extracted_data,
    p_created_by
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
    p_tenant_id,
    v_invoice_id,
    'created',
    p_created_by,
    jsonb_build_object(
      'status', p_status,
      'file_path', p_file_path,
      'ocr_confidence', p_ocr_confidence
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
END;
$$;

-- ================================================================
-- RPC: Update Supplier Invoice (with history logging)
-- ================================================================
CREATE OR REPLACE FUNCTION public.update_supplier_invoice(
  p_invoice_id UUID,
  p_tenant_id UUID,
  p_status TEXT DEFAULT NULL,
  p_ocr_status TEXT DEFAULT NULL,
  p_ocr_data JSONB DEFAULT NULL,
  p_extracted_data JSONB DEFAULT NULL,
  p_invoice_number TEXT DEFAULT NULL,
  p_invoice_date DATE DEFAULT NULL,
  p_due_date DATE DEFAULT NULL,
  p_total_amount NUMERIC DEFAULT NULL,
  p_ocr_confidence NUMERIC DEFAULT NULL,
  p_updated_by UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_old_data JSONB;
  v_changes JSONB := '{}'::JSONB;
  v_updated JSONB;
BEGIN
  -- Get old data for history
  SELECT jsonb_build_object(
    'status', status,
    'ocr_status', ocr_status,
    'invoice_number', invoice_number,
    'total_amount', total_amount,
    'ocr_confidence', ocr_confidence
  ) INTO v_old_data
  FROM app.supplier_invoices
  WHERE id = p_invoice_id AND tenant_id = p_tenant_id;

  IF v_old_data IS NULL THEN
    RAISE EXCEPTION 'Invoice not found or access denied';
  END IF;

  -- Update invoice (only non-null params)
  UPDATE app.supplier_invoices
  SET
    status = COALESCE(p_status, status),
    ocr_status = COALESCE(p_ocr_status, ocr_status),
    ocr_data = COALESCE(p_ocr_data, ocr_data),
    extracted_data = COALESCE(p_extracted_data, extracted_data),
    invoice_number = COALESCE(p_invoice_number, invoice_number),
    invoice_date = COALESCE(p_invoice_date, invoice_date),
    due_date = COALESCE(p_due_date, due_date),
    total_amount = COALESCE(p_total_amount, total_amount),
    ocr_confidence = COALESCE(p_ocr_confidence, ocr_confidence),
    updated_at = NOW()
  WHERE id = p_invoice_id AND tenant_id = p_tenant_id;

  -- Build changes object
  IF p_status IS NOT NULL AND (v_old_data->>'status') IS DISTINCT FROM p_status THEN
    v_changes := v_changes || jsonb_build_object('status', jsonb_build_object(
      'old', v_old_data->>'status',
      'new', p_status
    ));
  END IF;

  IF p_ocr_status IS NOT NULL AND (v_old_data->>'ocr_status') IS DISTINCT FROM p_ocr_status THEN
    v_changes := v_changes || jsonb_build_object('ocr_status', jsonb_build_object(
      'old', v_old_data->>'ocr_status',
      'new', p_ocr_status
    ));
  END IF;

  -- Log to history
  INSERT INTO app.supplier_invoice_history (
    tenant_id,
    supplier_invoice_id,
    action,
    changed_by,
    data
  ) VALUES (
    p_tenant_id,
    p_invoice_id,
    'updated',
    p_updated_by,
    v_changes
  );

  -- Return updated invoice
  SELECT jsonb_build_object(
    'id', id,
    'status', status,
    'ocr_status', ocr_status,
    'invoice_number', invoice_number,
    'total_amount', total_amount,
    'ocr_confidence', ocr_confidence,
    'updated_at', updated_at
  ) INTO v_updated
  FROM app.supplier_invoices
  WHERE id = p_invoice_id;

  RETURN v_updated;
END;
$$;

-- ================================================================
-- RPC: Get Supplier Invoice
-- ================================================================
CREATE OR REPLACE FUNCTION public.get_supplier_invoice(
  p_invoice_id UUID,
  p_tenant_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_invoice JSONB;
BEGIN
  SELECT row_to_json(inv)::JSONB INTO v_invoice
  FROM app.supplier_invoices inv
  WHERE id = p_invoice_id AND tenant_id = p_tenant_id;

  RETURN v_invoice;
END;
$$;

-- ================================================================
-- RPC: List Supplier Invoices
-- ================================================================
CREATE OR REPLACE FUNCTION public.list_supplier_invoices(
  p_tenant_id UUID,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0,
  p_status TEXT DEFAULT NULL,
  p_project_id UUID DEFAULT NULL,
  p_supplier_id UUID DEFAULT NULL,
  p_search TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_invoices JSONB;
  v_total INTEGER;
BEGIN
  -- Get total count
  SELECT COUNT(*)::INTEGER INTO v_total
  FROM app.supplier_invoices
  WHERE tenant_id = p_tenant_id
    AND (p_status IS NULL OR status = p_status)
    AND (p_project_id IS NULL OR project_id = p_project_id)
    AND (p_supplier_id IS NULL OR supplier_id = p_supplier_id)
    AND (p_search IS NULL OR invoice_number ILIKE '%' || p_search || '%' OR notes ILIKE '%' || p_search || '%');

  -- Get invoices
  SELECT COALESCE(jsonb_agg(row_to_json(inv)), '[]'::JSONB) INTO v_invoices
  FROM (
    SELECT *
    FROM app.supplier_invoices
    WHERE tenant_id = p_tenant_id
      AND (p_status IS NULL OR status = p_status)
      AND (p_project_id IS NULL OR project_id = p_project_id)
      AND (p_supplier_id IS NULL OR supplier_id = p_supplier_id)
      AND (p_search IS NULL OR invoice_number ILIKE '%' || p_search || '%' OR notes ILIKE '%' || p_search || '%')
    ORDER BY invoice_date DESC, created_at DESC
    LIMIT p_limit
    OFFSET p_offset
  ) inv;

  RETURN jsonb_build_object(
    'data', v_invoices,
    'total', v_total,
    'limit', p_limit,
    'offset', p_offset
  );
END;
$$;

-- ================================================================
-- Grant execute permissions
-- ================================================================
GRANT EXECUTE ON FUNCTION public.insert_supplier_invoice TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION public.update_supplier_invoice TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION public.get_supplier_invoice TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION public.list_supplier_invoices TO service_role, authenticated;

