-- ================================================================
-- Create app.supplier_invoices and app.supplier_invoice_history tables
-- ================================================================
-- This migration creates the tables in the 'app' schema that the RPC functions expect.
-- Run this BEFORE running the RPC functions if tables don't exist.
-- ================================================================

-- Create app schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS app;

-- ================================================================
-- 1. Supplier Invoices Table (app schema)
-- ================================================================
CREATE TABLE IF NOT EXISTS app.supplier_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  supplier_id UUID NOT NULL,
  project_id UUID,
  
  -- File information
  file_path TEXT,
  file_size_bytes INTEGER DEFAULT 0,
  mime_type TEXT DEFAULT 'application/pdf',
  original_filename TEXT,
  
  -- Invoice details
  invoice_number TEXT,
  invoice_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  
  -- Status and workflow
  status TEXT DEFAULT 'pending_approval',
  ocr_status TEXT,
  
  -- OCR data
  ocr_confidence NUMERIC(5,2),
  ocr_data JSONB,
  extracted_data JSONB,
  
  -- Financial fields (matching public schema structure)
  currency TEXT DEFAULT 'SEK',
  exchange_rate NUMERIC(12,6) DEFAULT 1,
  amount_subtotal NUMERIC(14,2) DEFAULT 0,
  amount_tax NUMERIC(14,2) DEFAULT 0,
  amount_total NUMERIC(14,2) DEFAULT 0,
  amount_paid NUMERIC(14,2) DEFAULT 0,
  amount_remaining NUMERIC(14,2) GENERATED ALWAYS AS (GREATEST(amount_total - amount_paid, 0)) STORED,
  markup_total NUMERIC(14,2) DEFAULT 0,
  
  -- Metadata
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT supplier_invoices_status_check 
    CHECK (status IN ('draft', 'pending_approval', 'approved', 'booked', 'paid', 'archived', 'rejected'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_app_supplier_invoices_tenant_status 
  ON app.supplier_invoices(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_app_supplier_invoices_project 
  ON app.supplier_invoices(project_id);
CREATE INDEX IF NOT EXISTS idx_app_supplier_invoices_supplier 
  ON app.supplier_invoices(supplier_id);
CREATE INDEX IF NOT EXISTS idx_app_supplier_invoices_invoice_number 
  ON app.supplier_invoices(tenant_id, supplier_id, invoice_number);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION app.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_app_supplier_invoices_updated_at ON app.supplier_invoices;
CREATE TRIGGER trg_app_supplier_invoices_updated_at
BEFORE UPDATE ON app.supplier_invoices
FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();

-- ================================================================
-- 2. Supplier Invoice History Table (app schema)
-- ================================================================
CREATE TABLE IF NOT EXISTS app.supplier_invoice_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  supplier_invoice_id UUID NOT NULL,
  action TEXT NOT NULL,
  changed_by UUID,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Foreign key constraint
  CONSTRAINT supplier_invoice_history_action_check
    CHECK (action IN ('created', 'updated', 'approved', 'rejected', 'paid', 'booked', 'archived', 'ocr_scanned', 'markup_applied', 'converted'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_app_supplier_invoice_history_invoice 
  ON app.supplier_invoice_history(supplier_invoice_id);
CREATE INDEX IF NOT EXISTS idx_app_supplier_invoice_history_tenant 
  ON app.supplier_invoice_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_app_supplier_invoice_history_created_at 
  ON app.supplier_invoice_history(created_at DESC);

-- Foreign key constraint (add after both tables exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'supplier_invoice_history_supplier_invoice_id_fkey'
  ) THEN
    ALTER TABLE app.supplier_invoice_history
    ADD CONSTRAINT supplier_invoice_history_supplier_invoice_id_fkey
    FOREIGN KEY (supplier_invoice_id) 
    REFERENCES app.supplier_invoices(id) 
    ON DELETE CASCADE;
  END IF;
END $$;

-- ================================================================
-- 3. Grant permissions (if needed for direct access)
-- ================================================================
-- Note: RPC functions use SECURITY DEFINER, so they don't need these grants
-- But if you want direct access, uncomment:
-- GRANT SELECT, INSERT, UPDATE, DELETE ON app.supplier_invoices TO service_role;
-- GRANT SELECT, INSERT ON app.supplier_invoice_history TO service_role;

-- ================================================================
-- Verification Query
-- ================================================================
-- Run this to verify tables were created:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'app' 
-- AND table_name IN ('supplier_invoices', 'supplier_invoice_history');

