-- ============================================
-- Schedule Patterns Migration
-- Adds support for:
--   - Recurring shift patterns (weekly, etc.)
--   - Multiple days of week selection
--   - Shift exceptions (vacation, sick, etc.)
--   - Notification preferences
-- ============================================

-- Create schedule_patterns table for recurring shifts
CREATE TABLE IF NOT EXISTS schedule_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  employee_id UUID NOT NULL,
  project_id UUID,
  
  -- Pattern info
  name TEXT,
  pattern_type TEXT NOT NULL DEFAULT 'weekly', -- weekly, single, recurring
  
  -- Date range
  start_date DATE NOT NULL,
  end_date DATE,
  
  -- Time settings
  start_time TIME NOT NULL DEFAULT '07:00',
  end_time TIME NOT NULL DEFAULT '16:00',
  break_minutes INTEGER DEFAULT 45,
  
  -- Days of week (1=Monday, 7=Sunday)
  days_of_week INTEGER[] DEFAULT '{1,2,3,4,5}',
  
  -- Notification settings
  notify_via_app BOOLEAN DEFAULT TRUE,
  notify_via_sms BOOLEAN DEFAULT FALSE,
  notify_via_email BOOLEAN DEFAULT TRUE,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  
  -- Constraints
  CONSTRAINT schedule_patterns_pattern_type_check 
    CHECK (pattern_type IN ('weekly', 'single', 'recurring'))
);

-- Create schedule_exceptions table for vacation, sick days, etc.
CREATE TABLE IF NOT EXISTS schedule_exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  pattern_id UUID,
  employee_id UUID NOT NULL,
  
  -- Exception details
  exception_date DATE NOT NULL,
  exception_type TEXT NOT NULL, -- vacation, sick, leave, other
  exception_reason TEXT,
  
  -- Full day or partial
  is_full_day BOOLEAN DEFAULT TRUE,
  start_time TIME,
  end_time TIME,
  
  -- Status
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT schedule_exceptions_type_check 
    CHECK (exception_type IN ('vacation', 'sick', 'leave', 'training', 'other'))
);

-- Add foreign keys
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'schedule_patterns_tenant_fk'
  ) THEN
    ALTER TABLE schedule_patterns 
      ADD CONSTRAINT schedule_patterns_tenant_fk 
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'schedule_patterns_employee_fk'
  ) THEN
    ALTER TABLE schedule_patterns 
      ADD CONSTRAINT schedule_patterns_employee_fk 
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'schedule_patterns_project_fk'
  ) THEN
    ALTER TABLE schedule_patterns 
      ADD CONSTRAINT schedule_patterns_project_fk 
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'schedule_exceptions_tenant_fk'
  ) THEN
    ALTER TABLE schedule_exceptions 
      ADD CONSTRAINT schedule_exceptions_tenant_fk 
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'schedule_exceptions_employee_fk'
  ) THEN
    ALTER TABLE schedule_exceptions 
      ADD CONSTRAINT schedule_exceptions_employee_fk 
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'schedule_exceptions_pattern_fk'
  ) THEN
    ALTER TABLE schedule_exceptions 
      ADD CONSTRAINT schedule_exceptions_pattern_fk 
      FOREIGN KEY (pattern_id) REFERENCES schedule_patterns(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE schedule_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_exceptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DO $$
BEGIN
  DROP POLICY IF EXISTS "tenant_isolation_patterns" ON schedule_patterns;
  CREATE POLICY "tenant_isolation_patterns" ON schedule_patterns
    FOR ALL
    USING (
      tenant_id = (
        SELECT tenant_id FROM employees WHERE auth_user_id = auth.uid() LIMIT 1
      )
    );
    
  DROP POLICY IF EXISTS "tenant_isolation_exceptions" ON schedule_exceptions;
  CREATE POLICY "tenant_isolation_exceptions" ON schedule_exceptions
    FOR ALL
    USING (
      tenant_id = (
        SELECT tenant_id FROM employees WHERE auth_user_id = auth.uid() LIMIT 1
      )
    );
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_schedule_patterns_tenant ON schedule_patterns(tenant_id);
CREATE INDEX IF NOT EXISTS idx_schedule_patterns_employee ON schedule_patterns(employee_id);
CREATE INDEX IF NOT EXISTS idx_schedule_patterns_dates ON schedule_patterns(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_schedule_patterns_active ON schedule_patterns(is_active) WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_schedule_exceptions_tenant ON schedule_exceptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_schedule_exceptions_employee ON schedule_exceptions(employee_id);
CREATE INDEX IF NOT EXISTS idx_schedule_exceptions_date ON schedule_exceptions(exception_date);
CREATE INDEX IF NOT EXISTS idx_schedule_exceptions_pattern ON schedule_exceptions(pattern_id);

-- Function to calculate total scheduled hours for a pattern
CREATE OR REPLACE FUNCTION calculate_pattern_hours(
  p_start_time TIME,
  p_end_time TIME,
  p_break_minutes INTEGER,
  p_days_count INTEGER
) RETURNS NUMERIC AS $$
DECLARE
  daily_hours NUMERIC;
BEGIN
  -- Calculate daily hours (handle overnight shifts)
  IF p_end_time > p_start_time THEN
    daily_hours := EXTRACT(EPOCH FROM (p_end_time - p_start_time)) / 3600;
  ELSE
    daily_hours := EXTRACT(EPOCH FROM (p_end_time - p_start_time + INTERVAL '24 hours')) / 3600;
  END IF;
  
  -- Subtract break
  daily_hours := daily_hours - (COALESCE(p_break_minutes, 0) / 60.0);
  
  -- Multiply by days
  RETURN ROUND(daily_hours * p_days_count, 2);
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE schedule_patterns IS 'Recurring shift patterns for employees (weekly schedules)';
COMMENT ON TABLE schedule_exceptions IS 'Exceptions to schedules like vacation, sick days, etc.';
COMMENT ON COLUMN schedule_patterns.days_of_week IS 'Array of ISO weekday numbers (1=Mon, 7=Sun)';
COMMENT ON COLUMN schedule_patterns.pattern_type IS 'weekly (repeat), single (one-off), recurring (custom)';
