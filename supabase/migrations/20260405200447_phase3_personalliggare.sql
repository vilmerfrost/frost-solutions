CREATE TABLE IF NOT EXISTS public.site_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  project_id UUID NOT NULL REFERENCES public.projects(id),
  employee_id UUID REFERENCES public.employees(id),
  subcontractor_id UUID REFERENCES public.subcontractors(id),
  person_name TEXT NOT NULL,
  person_id_last4 TEXT,
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  checked_out_at TIMESTAMPTZ,
  check_in_method TEXT DEFAULT 'manual',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_attendance_project ON public.site_attendance(project_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.site_attendance(checked_in_at);
ALTER TABLE public.site_attendance ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "Tenant isolation" ON public.site_attendance FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Service role" ON public.site_attendance FOR ALL USING (auth.role() = 'service_role'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;;
