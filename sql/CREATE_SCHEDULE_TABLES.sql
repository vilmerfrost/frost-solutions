-- Create schedule_slots and absences tables in app schema
-- These tables store scheduling and absence data

-- Ensure app schema exists
CREATE SCHEMA IF NOT EXISTS app;

-- Create schedule_slots table
CREATE TABLE IF NOT EXISTS app.schedule_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  work_site_id UUID REFERENCES public.work_sites(id) ON DELETE SET NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled')),
  notes TEXT,
  shift_type TEXT CHECK (shift_type IN ('day', 'night', 'evening', 'weekend', 'other')) DEFAULT 'day',
  transport_time_minutes INTEGER DEFAULT 0 CHECK (transport_time_minutes >= 0),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Constraints
  CONSTRAINT check_time_range CHECK (end_time > start_time),
  CONSTRAINT check_duration CHECK (EXTRACT(EPOCH FROM (end_time - start_time)) / 3600 <= 12)
);

-- Create absences table
CREATE TABLE IF NOT EXISTS app.absences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  absence_type TEXT NOT NULL CHECK (absence_type IN ('vacation', 'sick', 'other')),
  reason TEXT,
  approved BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Constraints
  CONSTRAINT check_date_range CHECK (end_date >= start_date)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_schedule_slots_tenant_id ON app.schedule_slots(tenant_id);
CREATE INDEX IF NOT EXISTS idx_schedule_slots_employee_id ON app.schedule_slots(employee_id);
CREATE INDEX IF NOT EXISTS idx_schedule_slots_project_id ON app.schedule_slots(project_id);
CREATE INDEX IF NOT EXISTS idx_schedule_slots_start_time ON app.schedule_slots(start_time);
CREATE INDEX IF NOT EXISTS idx_schedule_slots_status ON app.schedule_slots(status);
CREATE INDEX IF NOT EXISTS idx_schedule_slots_shift_type ON app.schedule_slots(shift_type);

CREATE INDEX IF NOT EXISTS idx_absences_tenant_id ON app.absences(tenant_id);
CREATE INDEX IF NOT EXISTS idx_absences_employee_id ON app.absences(employee_id);
CREATE INDEX IF NOT EXISTS idx_absences_start_date ON app.absences(start_date);
CREATE INDEX IF NOT EXISTS idx_absences_end_date ON app.absences(end_date);

-- Enable RLS
ALTER TABLE app.schedule_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.absences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for schedule_slots
-- Employees can see their own schedules, admins can see all
CREATE POLICY schedule_slots_select ON app.schedule_slots
  FOR SELECT
  USING (
    tenant_id = (SELECT tenant_id FROM public.employees WHERE auth_user_id = auth.uid() LIMIT 1)
    AND (
      employee_id IN (SELECT id FROM public.employees WHERE auth_user_id = auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.employees 
        WHERE auth_user_id = auth.uid() 
        AND role = 'admin' 
        AND tenant_id = app.schedule_slots.tenant_id
      )
    )
  );

-- Employees can create their own schedules, admins can create all
CREATE POLICY schedule_slots_insert ON app.schedule_slots
  FOR INSERT
  WITH CHECK (
    tenant_id = (SELECT tenant_id FROM public.employees WHERE auth_user_id = auth.uid() LIMIT 1)
    AND (
      employee_id IN (SELECT id FROM public.employees WHERE auth_user_id = auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.employees 
        WHERE auth_user_id = auth.uid() 
        AND role = 'admin' 
        AND tenant_id = app.schedule_slots.tenant_id
      )
    )
  );

-- Employees can update their own schedules, admins can update all
CREATE POLICY schedule_slots_update ON app.schedule_slots
  FOR UPDATE
  USING (
    tenant_id = (SELECT tenant_id FROM public.employees WHERE auth_user_id = auth.uid() LIMIT 1)
    AND (
      employee_id IN (SELECT id FROM public.employees WHERE auth_user_id = auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.employees 
        WHERE auth_user_id = auth.uid() 
        AND role = 'admin' 
        AND tenant_id = app.schedule_slots.tenant_id
      )
    )
  );

-- Employees can delete their own schedules, admins can delete all
CREATE POLICY schedule_slots_delete ON app.schedule_slots
  FOR DELETE
  USING (
    tenant_id = (SELECT tenant_id FROM public.employees WHERE auth_user_id = auth.uid() LIMIT 1)
    AND (
      employee_id IN (SELECT id FROM public.employees WHERE auth_user_id = auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.employees 
        WHERE auth_user_id = auth.uid() 
        AND role = 'admin' 
        AND tenant_id = app.schedule_slots.tenant_id
      )
    )
  );

-- RLS Policies for absences
-- Employees can see their own absences, admins can see all
CREATE POLICY absences_select ON app.absences
  FOR SELECT
  USING (
    tenant_id = (SELECT tenant_id FROM public.employees WHERE auth_user_id = auth.uid() LIMIT 1)
    AND (
      employee_id IN (SELECT id FROM public.employees WHERE auth_user_id = auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.employees 
        WHERE auth_user_id = auth.uid() 
        AND role = 'admin' 
        AND tenant_id = app.absences.tenant_id
      )
    )
  );

-- Employees can create their own absences, admins can create all
CREATE POLICY absences_insert ON app.absences
  FOR INSERT
  WITH CHECK (
    tenant_id = (SELECT tenant_id FROM public.employees WHERE auth_user_id = auth.uid() LIMIT 1)
    AND (
      employee_id IN (SELECT id FROM public.employees WHERE auth_user_id = auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.employees 
        WHERE auth_user_id = auth.uid() 
        AND role = 'admin' 
        AND tenant_id = app.absences.tenant_id
      )
    )
  );

-- Employees can update their own absences, admins can update all
CREATE POLICY absences_update ON app.absences
  FOR UPDATE
  USING (
    tenant_id = (SELECT tenant_id FROM public.employees WHERE auth_user_id = auth.uid() LIMIT 1)
    AND (
      employee_id IN (SELECT id FROM public.employees WHERE auth_user_id = auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.employees 
        WHERE auth_user_id = auth.uid() 
        AND role = 'admin' 
        AND tenant_id = app.absences.tenant_id
      )
    )
  );

-- Employees can delete their own absences, admins can delete all
CREATE POLICY absences_delete ON app.absences
  FOR DELETE
  USING (
    tenant_id = (SELECT tenant_id FROM public.employees WHERE auth_user_id = auth.uid() LIMIT 1)
    AND (
      employee_id IN (SELECT id FROM public.employees WHERE auth_user_id = auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.employees 
        WHERE auth_user_id = auth.uid() 
        AND role = 'admin' 
        AND tenant_id = app.absences.tenant_id
      )
    )
  );

