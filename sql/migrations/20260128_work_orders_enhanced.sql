-- ============================================
-- Enhanced Work Orders Migration
-- Adds support for:
--   - Work order types (standard, ata, damage, sales)
--   - Estimated hours
--   - Material requirements
--   - Safety requirements
--   - Quote and ÄTA linking
--   - Multiple employee assignments
-- ============================================

-- Work order type
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS work_order_type TEXT DEFAULT 'standard';
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'work_orders_type_check'
  ) THEN
    ALTER TABLE work_orders ADD CONSTRAINT work_orders_type_check 
      CHECK (work_order_type IS NULL OR work_order_type IN ('standard', 'ata', 'damage', 'sales'));
  END IF;
END $$;

-- Estimated hours (radio button options)
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS estimated_hours TEXT;
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'work_orders_estimated_hours_check'
  ) THEN
    ALTER TABLE work_orders ADD CONSTRAINT work_orders_estimated_hours_check 
      CHECK (estimated_hours IS NULL OR estimated_hours IN ('2-4h', '4-8h', '8-16h', '16+h', 'multi-day'));
  END IF;
END $$;

-- Link to ÄTA request (for ÄTA-type work orders)
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS aeta_request_id UUID;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'aeta_requests') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'work_orders_aeta_request_fk'
    ) THEN
      ALTER TABLE work_orders 
        ADD CONSTRAINT work_orders_aeta_request_fk 
        FOREIGN KEY (aeta_request_id) REFERENCES aeta_requests(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

-- Link to quote item (for tracking against quotes)
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS quote_item_id UUID;

-- Material requirements (JSONB array)
-- Format: [{ "material_id": "uuid", "name": "Gipskartor", "quantity": 5, "unit": "st" }, ...]
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS material_requirements JSONB DEFAULT '[]';

-- Safety requirements (text array)
-- Options: 'ppe', 'safety_training', 'first_aid', 'zone_marking', 'photo_before_after'
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS safety_requirements TEXT[] DEFAULT '{}';

-- Visibility settings (who can see this work order)
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS visible_to_assignees BOOLEAN DEFAULT TRUE;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS visible_to_project_lead BOOLEAN DEFAULT TRUE;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS visible_to_admin BOOLEAN DEFAULT TRUE;

-- Special instructions
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS special_instructions TEXT;

-- Create work order assignments table for multiple employee assignments
CREATE TABLE IF NOT EXISTS work_order_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL,
  employee_id UUID NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT work_order_assignments_unique UNIQUE (work_order_id, employee_id)
);

-- Add foreign keys for assignments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'work_order_assignments_work_order_fk'
  ) THEN
    ALTER TABLE work_order_assignments 
      ADD CONSTRAINT work_order_assignments_work_order_fk 
      FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'work_order_assignments_employee_fk'
  ) THEN
    ALTER TABLE work_order_assignments 
      ADD CONSTRAINT work_order_assignments_employee_fk 
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Enable RLS on assignments table
ALTER TABLE work_order_assignments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for work_order_assignments
DO $$
BEGIN
  DROP POLICY IF EXISTS "tenant_isolation" ON work_order_assignments;
  
  CREATE POLICY "tenant_isolation" ON work_order_assignments
    FOR ALL
    USING (
      work_order_id IN (
        SELECT id FROM work_orders WHERE tenant_id = (
          SELECT tenant_id FROM employees WHERE auth_user_id = auth.uid() LIMIT 1
        )
      )
    );
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_work_orders_type ON work_orders(work_order_type);
CREATE INDEX IF NOT EXISTS idx_work_orders_aeta ON work_orders(aeta_request_id);
CREATE INDEX IF NOT EXISTS idx_work_order_assignments_work_order ON work_order_assignments(work_order_id);
CREATE INDEX IF NOT EXISTS idx_work_order_assignments_employee ON work_order_assignments(employee_id);

-- Comments
COMMENT ON COLUMN work_orders.work_order_type IS 'standard, ata (change order), damage (damaged goods), sales (material sale)';
COMMENT ON COLUMN work_orders.estimated_hours IS 'Estimated duration: 2-4h, 4-8h, 8-16h, 16+h, multi-day';
COMMENT ON COLUMN work_orders.material_requirements IS 'Required materials: [{ material_id, name, quantity, unit }]';
COMMENT ON COLUMN work_orders.safety_requirements IS 'Safety checklist: ppe, safety_training, first_aid, zone_marking, photo_before_after';
COMMENT ON TABLE work_order_assignments IS 'Multiple employee assignments per work order, with primary assignee marking';
