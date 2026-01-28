-- ============================================
-- Enhanced Invoice System Migration
-- Adds support for:
--   - Invoice types (standard, final, partial)
--   - VAT rate selection
--   - Payment terms
--   - ÄTA linking
--   - Bank account details
-- ============================================

-- Invoice type
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS invoice_type TEXT DEFAULT 'STANDARD';
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'invoices_type_check'
  ) THEN
    ALTER TABLE invoices ADD CONSTRAINT invoices_type_check 
      CHECK (invoice_type IS NULL OR invoice_type IN ('STANDARD', 'FINAL', 'PARTIAL'));
  END IF;
END $$;

-- Period dates
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS period_from DATE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS period_to DATE;

-- Totals breakdown
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS labor_total NUMERIC(12,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS material_total NUMERIC(12,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS change_order_total NUMERIC(12,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS subtotal NUMERIC(12,2) DEFAULT 0;

-- VAT
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS vat_rate NUMERIC(5,2) DEFAULT 25;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS vat_amount NUMERIC(12,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS total_including_vat NUMERIC(12,2);

-- Payment terms
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_terms TEXT DEFAULT 'NETTO_30';
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'invoices_payment_terms_check'
  ) THEN
    ALTER TABLE invoices ADD CONSTRAINT invoices_payment_terms_check 
      CHECK (payment_terms IS NULL OR payment_terms IN ('NETTO_14', 'NETTO_30', 'NETTO_45', 'IMMEDIATE'));
  END IF;
END $$;

-- Bank details
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS bank_account_iban TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS ocr_number TEXT;

-- Timestamps
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- Notes
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS notes_to_customer TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS internal_notes TEXT;

-- Tags for categorization
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Send method
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS send_by_email BOOLEAN DEFAULT TRUE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS send_by_mail BOOLEAN DEFAULT FALSE;

-- ============================================
-- Enhanced invoice_lines table
-- ============================================

-- Item type
ALTER TABLE invoice_lines ADD COLUMN IF NOT EXISTS item_type TEXT DEFAULT 'labor';
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'invoice_lines_item_type_check'
  ) THEN
    ALTER TABLE invoice_lines ADD CONSTRAINT invoice_lines_item_type_check 
      CHECK (item_type IS NULL OR item_type IN ('labor', 'material', 'change_order', 'other'));
  END IF;
END $$;

-- Link to ÄTA
ALTER TABLE invoice_lines ADD COLUMN IF NOT EXISTS aeta_request_id UUID;

-- Unit details
ALTER TABLE invoice_lines ADD COLUMN IF NOT EXISTS quantity NUMERIC(10,2) DEFAULT 1;
ALTER TABLE invoice_lines ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'tim';
ALTER TABLE invoice_lines ADD COLUMN IF NOT EXISTS rate_sek NUMERIC(10,2);
ALTER TABLE invoice_lines ADD COLUMN IF NOT EXISTS amount_sek NUMERIC(12,2);

-- Sort order
ALTER TABLE invoice_lines ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Tenant for RLS
ALTER TABLE invoice_lines ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- ============================================
-- Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_invoices_invoice_type ON invoices(invoice_type);
CREATE INDEX IF NOT EXISTS idx_invoices_payment_terms ON invoices(payment_terms);
CREATE INDEX IF NOT EXISTS idx_invoices_period ON invoices(period_from, period_to);
CREATE INDEX IF NOT EXISTS idx_invoice_lines_item_type ON invoice_lines(item_type);
CREATE INDEX IF NOT EXISTS idx_invoice_lines_aeta ON invoice_lines(aeta_request_id);

-- ============================================
-- Comments
-- ============================================

COMMENT ON COLUMN invoices.invoice_type IS 'STANDARD, FINAL (slutfaktura), PARTIAL (delfaktura)';
COMMENT ON COLUMN invoices.payment_terms IS 'NETTO_14, NETTO_30, NETTO_45, IMMEDIATE';
COMMENT ON COLUMN invoices.change_order_total IS 'Sum of ÄTA amounts on this invoice';
COMMENT ON COLUMN invoice_lines.aeta_request_id IS 'Link to aeta_requests table for change order lines';
