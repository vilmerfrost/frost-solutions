-- CREATE PUBLIC VIEWS FOR SCHEDULING
-- These views allow API routes to access app.schedule_slots and app.absences
-- through the public schema, respecting RLS policies

-- View for schedule_slots
CREATE OR REPLACE VIEW public.schedule_slots AS
SELECT 
  id,
  tenant_id,
  employee_id,
  project_id,
  work_site_id,
  start_time,
  end_time,
  status,
  notes,
  shift_type,
  transport_time_minutes,
  created_by,
  created_at,
  updated_at
FROM app.schedule_slots;

-- Grant SELECT to authenticated users (RLS will handle tenant isolation)
GRANT SELECT ON public.schedule_slots TO authenticated;

-- View for absences
CREATE OR REPLACE VIEW public.absences AS
SELECT 
  id,
  tenant_id,
  employee_id,
  start_date,
  end_date,
  absence_type,
  reason,
  approved,
  approved_by,
  created_at,
  updated_at
FROM app.absences;

-- Grant SELECT to authenticated users (RLS will handle tenant isolation)
GRANT SELECT ON public.absences TO authenticated;

