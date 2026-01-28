-- ============================================
-- ROT SKV 5017 Compliance Migration
-- Adds support for:
--   - Property type and BRF details
--   - Work dates
--   - Work details (itemized)
--   - Customer declarations
--   - Yearly limit tracking
-- ============================================

-- Property type
ALTER TABLE rot_applications ADD COLUMN IF NOT EXISTS property_type TEXT;
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'rot_applications_property_type_check'
  ) THEN
    ALTER TABLE rot_applications ADD CONSTRAINT rot_applications_property_type_check 
      CHECK (property_type IS NULL OR property_type IN ('BRF', 'HOUSE', 'APARTMENT', 'TOWNHOUSE', 'OTHER'));
  END IF;
END $$;

-- BRF-specific fields
ALTER TABLE rot_applications ADD COLUMN IF NOT EXISTS apartment_number TEXT;
ALTER TABLE rot_applications ADD COLUMN IF NOT EXISTS brf_org_number TEXT;

-- Work period
ALTER TABLE rot_applications ADD COLUMN IF NOT EXISTS work_start_date DATE;
ALTER TABLE rot_applications ADD COLUMN IF NOT EXISTS work_end_date DATE;

-- Work details (itemized breakdown for SKV 5017)
-- Format: [{ "description": "Rivning", "hours": 40, "hourly_rate": 650, "total": 26000 }, ...]
ALTER TABLE rot_applications ADD COLUMN IF NOT EXISTS work_details JSONB DEFAULT '[]';

-- Customer declarations (checkboxes from SKV 5017)
-- Format: { "is_owner": true, "is_private_residence": true, "is_repair_work": true, ... }
ALTER TABLE rot_applications ADD COLUMN IF NOT EXISTS customer_declarations JSONB;

-- Calculated deduction amount (stored for quick access)
ALTER TABLE rot_applications ADD COLUMN IF NOT EXISTS deductible_amount NUMERIC(10,2);
ALTER TABLE rot_applications ADD COLUMN IF NOT EXISTS deduction_percentage NUMERIC(5,2) DEFAULT 50;

-- Customer address fields (for ROT, work must be at customer's residence)
ALTER TABLE rot_applications ADD COLUMN IF NOT EXISTS customer_street_address TEXT;
ALTER TABLE rot_applications ADD COLUMN IF NOT EXISTS customer_postal_code TEXT;
ALTER TABLE rot_applications ADD COLUMN IF NOT EXISTS customer_city TEXT;

-- Yearly limit tracking
-- Create a view to easily track yearly deductions per customer
CREATE OR REPLACE VIEW rot_yearly_deductions AS
SELECT 
  customer_person_number,
  EXTRACT(YEAR FROM COALESCE(work_end_date, created_at)) as year,
  SUM(CASE WHEN status IN ('approved', 'submitted', 'under_review') THEN deductible_amount ELSE 0 END) as used_deduction,
  50000 - SUM(CASE WHEN status IN ('approved', 'submitted', 'under_review') THEN COALESCE(deductible_amount, 0) ELSE 0 END) as remaining_deduction
FROM rot_applications
WHERE status NOT IN ('rejected', 'cancelled')
GROUP BY customer_person_number, EXTRACT(YEAR FROM COALESCE(work_end_date, created_at));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_rot_property_type ON rot_applications(property_type);
CREATE INDEX IF NOT EXISTS idx_rot_work_dates ON rot_applications(work_start_date, work_end_date);
CREATE INDEX IF NOT EXISTS idx_rot_customer_pn_year ON rot_applications(customer_person_number, (EXTRACT(YEAR FROM created_at)));

-- Comments
COMMENT ON COLUMN rot_applications.property_type IS 'BRF (bostadsrätt), HOUSE (eget hus), APARTMENT (lägenhet), TOWNHOUSE (radhus), OTHER';
COMMENT ON COLUMN rot_applications.work_details IS 'Itemized work breakdown: [{ description, hours, hourly_rate, total }]';
COMMENT ON COLUMN rot_applications.customer_declarations IS 'SKV 5017 declaration checkboxes: { is_owner, is_private_residence, is_repair_work, will_declare }';
COMMENT ON COLUMN rot_applications.deductible_amount IS '50% of work_cost_sek, max 50,000 SEK per person per year';
COMMENT ON COLUMN rot_applications.deduction_percentage IS 'ROT deduction rate (currently 50%)';

-- Function to calculate ROT deduction
CREATE OR REPLACE FUNCTION calculate_rot_deduction(work_cost NUMERIC, person_number TEXT, year INTEGER)
RETURNS TABLE(deduction NUMERIC, remaining NUMERIC, over_limit BOOLEAN) AS $$
DECLARE
  yearly_used NUMERIC;
  max_yearly NUMERIC := 50000;
  rate NUMERIC := 0.50;
  potential_deduction NUMERIC;
BEGIN
  -- Get already used deduction this year
  SELECT COALESCE(SUM(deductible_amount), 0) INTO yearly_used
  FROM rot_applications
  WHERE customer_person_number = person_number
    AND EXTRACT(YEAR FROM COALESCE(work_end_date, created_at)) = year
    AND status IN ('approved', 'submitted', 'under_review');
  
  -- Calculate potential deduction
  potential_deduction := work_cost * rate;
  
  -- Check if it exceeds yearly limit
  IF yearly_used + potential_deduction > max_yearly THEN
    deduction := GREATEST(0, max_yearly - yearly_used);
    remaining := 0;
    over_limit := true;
  ELSE
    deduction := potential_deduction;
    remaining := max_yearly - yearly_used - potential_deduction;
    over_limit := false;
  END IF;
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;
