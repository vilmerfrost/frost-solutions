-- ============================================
-- ÄTA System Enhancement Migration
-- Adds support for:
--   - Change types (ADDITION, MODIFICATION, UNFORESEEN)
--   - Photo documentation (mandatory for UNFORESEEN)
--   - Customer approval flow with token-based approval
--   - Pricing controls
--   - Timeline impact tracking
-- ============================================

-- Core fields for employee quick form
ALTER TABLE aeta_requests ADD COLUMN IF NOT EXISTS title TEXT;

ALTER TABLE aeta_requests ADD COLUMN IF NOT EXISTS change_type TEXT;
-- Add check constraint separately to handle existing NULL values
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'aeta_requests_change_type_check'
  ) THEN
    ALTER TABLE aeta_requests ADD CONSTRAINT aeta_requests_change_type_check 
      CHECK (change_type IS NULL OR change_type IN ('ADDITION', 'MODIFICATION', 'UNFORESEEN'));
  END IF;
END $$;

-- Photos array for documentation (critical for UNFORESEEN type)
ALTER TABLE aeta_requests ADD COLUMN IF NOT EXISTS photos TEXT[] DEFAULT '{}';

-- Simplified hour estimates for field workers
ALTER TABLE aeta_requests ADD COLUMN IF NOT EXISTS estimated_hours_category TEXT;
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'aeta_requests_hours_category_check'
  ) THEN
    ALTER TABLE aeta_requests ADD CONSTRAINT aeta_requests_hours_category_check 
      CHECK (estimated_hours_category IS NULL OR estimated_hours_category IN ('2h', '4-8h', '>1dag'));
  END IF;
END $$;

-- Material cost estimate
ALTER TABLE aeta_requests ADD COLUMN IF NOT EXISTS estimated_material_cost NUMERIC(10,2);

-- Who ordered the work on site
ALTER TABLE aeta_requests ADD COLUMN IF NOT EXISTS ordered_by_name TEXT;

-- ============================================
-- Admin/Pricing fields
-- ============================================

-- Link to main contract moment for invoice grouping
ALTER TABLE aeta_requests ADD COLUMN IF NOT EXISTS linked_moment TEXT;

-- Whether this ÄTA follows the main contract pricing
ALTER TABLE aeta_requests ADD COLUMN IF NOT EXISTS follows_main_contract BOOLEAN DEFAULT TRUE;

-- Custom pricing if not following main contract
ALTER TABLE aeta_requests ADD COLUMN IF NOT EXISTS custom_hourly_rate NUMERIC(10,2);
ALTER TABLE aeta_requests ADD COLUMN IF NOT EXISTS custom_material_markup NUMERIC(5,2);

-- ============================================
-- Customer Approval fields
-- ============================================

-- Status tracking for customer interaction
ALTER TABLE aeta_requests ADD COLUMN IF NOT EXISTS customer_approval_status TEXT DEFAULT 'DRAFT';
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'aeta_requests_approval_status_check'
  ) THEN
    ALTER TABLE aeta_requests ADD CONSTRAINT aeta_requests_approval_status_check 
      CHECK (customer_approval_status IN (
        'DRAFT', 'SENT_FOR_APPROVAL', 'APPROVED_VERBAL', 'APPROVED_DIGITAL', 'REJECTED'
      ));
  END IF;
END $$;

-- Token for customer approval link (e.g., /approve/[token])
ALTER TABLE aeta_requests ADD COLUMN IF NOT EXISTS customer_approval_token UUID;

-- When customer approved/rejected
ALTER TABLE aeta_requests ADD COLUMN IF NOT EXISTS customer_approval_timestamp TIMESTAMPTZ;

-- Customer contact info for sending approval requests
ALTER TABLE aeta_requests ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE aeta_requests ADD COLUMN IF NOT EXISTS customer_phone TEXT;

-- ============================================
-- Timeline Impact fields
-- ============================================

-- Does this ÄTA affect the project completion date?
ALTER TABLE aeta_requests ADD COLUMN IF NOT EXISTS impacts_timeline BOOLEAN DEFAULT FALSE;

-- New completion date if timeline is impacted
ALTER TABLE aeta_requests ADD COLUMN IF NOT EXISTS new_completion_date DATE;

-- Internal notes (for office use, not shown to customer)
ALTER TABLE aeta_requests ADD COLUMN IF NOT EXISTS internal_notes TEXT;

-- ============================================
-- Indexes for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_aeta_requests_change_type ON aeta_requests(change_type);
CREATE INDEX IF NOT EXISTS idx_aeta_requests_customer_approval_status ON aeta_requests(customer_approval_status);
CREATE INDEX IF NOT EXISTS idx_aeta_requests_customer_approval_token ON aeta_requests(customer_approval_token);

-- ============================================
-- Comments for documentation
-- ============================================

COMMENT ON COLUMN aeta_requests.change_type IS 'ADDITION=New work requested, MODIFICATION=Changed existing work, UNFORESEEN=Discovered problems';
COMMENT ON COLUMN aeta_requests.photos IS 'Array of photo URLs - MANDATORY for UNFORESEEN type';
COMMENT ON COLUMN aeta_requests.customer_approval_status IS 'DRAFT=Internal only, SENT_FOR_APPROVAL=Waiting for customer, APPROVED_VERBAL=Risky!, APPROVED_DIGITAL=Legally binding, REJECTED=Customer said no';
COMMENT ON COLUMN aeta_requests.customer_approval_token IS 'UUID token for public approval page /approve/[token]';
