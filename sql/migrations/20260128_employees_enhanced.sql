-- ============================================
-- Enhanced Employee System Migration
-- Adds support for:
--   - Personal info (phone, personnummer)
--   - Employment type and job role
--   - Competencies and certifications
--   - Emergency contact
--   - Salary information
-- ============================================

-- Personal Information
ALTER TABLE employees ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS personal_id TEXT; -- Personnummer (encrypted)

-- Employment Information
ALTER TABLE employees ADD COLUMN IF NOT EXISTS employment_type TEXT DEFAULT 'FULL_TIME';
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'employees_employment_type_check'
  ) THEN
    ALTER TABLE employees ADD CONSTRAINT employees_employment_type_check 
      CHECK (employment_type IS NULL OR employment_type IN ('FULL_TIME', 'PART_TIME', 'CONTRACTOR'));
  END IF;
END $$;

ALTER TABLE employees ADD COLUMN IF NOT EXISTS job_role TEXT;
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'employees_job_role_check'
  ) THEN
    ALTER TABLE employees ADD CONSTRAINT employees_job_role_check 
      CHECK (job_role IS NULL OR job_role IN (
        'PROJECT_MANAGER', 'CARPENTER', 'PLUMBER', 'PAINTER', 
        'ELECTRICIAN', 'WAREHOUSE', 'OFFICE', 'OTHER'
      ));
  END IF;
END $$;

ALTER TABLE employees ADD COLUMN IF NOT EXISTS start_date DATE;

-- Competencies and Certifications (boolean flags)
ALTER TABLE employees ADD COLUMN IF NOT EXISTS has_drivers_license BOOLEAN DEFAULT FALSE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS is_over_19 BOOLEAN DEFAULT FALSE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS has_safety_training BOOLEAN DEFAULT FALSE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS has_rot_eligibility BOOLEAN DEFAULT FALSE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS has_electrical_cert BOOLEAN DEFAULT FALSE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS has_fall_protection BOOLEAN DEFAULT FALSE;

-- Salary Information
ALTER TABLE employees ADD COLUMN IF NOT EXISTS monthly_salary_gross NUMERIC(10,2);

-- Emergency Contact
ALTER TABLE employees ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;

-- Notes
ALTER TABLE employees ADD COLUMN IF NOT EXISTS notes TEXT;

-- Status
ALTER TABLE employees ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'employees_status_check'
  ) THEN
    ALTER TABLE employees ADD CONSTRAINT employees_status_check 
      CHECK (status IS NULL OR status IN ('active', 'inactive', 'on_leave', 'terminated'));
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_employees_employment_type ON employees(employment_type);
CREATE INDEX IF NOT EXISTS idx_employees_job_role ON employees(job_role);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);

-- Comments
COMMENT ON COLUMN employees.personal_id IS 'Swedish personnummer - should be encrypted';
COMMENT ON COLUMN employees.employment_type IS 'FULL_TIME, PART_TIME, CONTRACTOR';
COMMENT ON COLUMN employees.job_role IS 'Primary job function: PROJECT_MANAGER, CARPENTER, PLUMBER, PAINTER, ELECTRICIAN, WAREHOUSE, OFFICE, OTHER';
COMMENT ON COLUMN employees.has_rot_eligibility IS 'Employee can perform ROT-eligible work';
