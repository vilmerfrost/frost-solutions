CREATE TABLE IF NOT EXISTS public.daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  project_id UUID NOT NULL REFERENCES public.projects(id),
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  author_id UUID NOT NULL REFERENCES public.employees(id),
  weather TEXT,
  temperature_c INTEGER,
  summary TEXT NOT NULL,
  workers_on_site INTEGER,
  work_performed TEXT,
  materials_used TEXT,
  issues TEXT,
  photos TEXT[] DEFAULT '{}',
  visible_to_customer BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, log_date)
);
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation" ON public.daily_logs FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);
CREATE POLICY "Service role" ON public.daily_logs FOR ALL USING (auth.role() = 'service_role');
