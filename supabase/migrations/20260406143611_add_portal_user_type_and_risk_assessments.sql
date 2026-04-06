ALTER TABLE public.customer_portal_users
  ADD COLUMN IF NOT EXISTS portal_user_type TEXT NOT NULL DEFAULT 'customer'
  CHECK (portal_user_type IN ('customer', 'subcontractor'));

CREATE TABLE IF NOT EXISTS public.risk_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  project_id UUID NOT NULL REFERENCES public.projects(id),
  template_id TEXT NOT NULL,
  title TEXT NOT NULL,
  work_type TEXT NOT NULL,
  risks JSONB NOT NULL DEFAULT '[]',
  created_by UUID REFERENCES public.employees(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_risk_assessments_tenant_id ON public.risk_assessments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_project_id ON public.risk_assessments(project_id);

ALTER TABLE public.risk_assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant isolation" ON public.risk_assessments;
CREATE POLICY "Tenant isolation" ON public.risk_assessments
  FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);

DROP POLICY IF EXISTS "Service role full access" ON public.risk_assessments;
CREATE POLICY "Service role full access" ON public.risk_assessments
  FOR ALL USING (auth.role() = 'service_role');;
