CREATE TABLE IF NOT EXISTS public.document_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  document_id UUID NOT NULL REFERENCES public.project_documents(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL DEFAULT 1,
  annotation_type TEXT NOT NULL,
  data JSONB NOT NULL,
  created_by UUID,
  work_order_id UUID,
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_doc_annotations_doc ON public.document_annotations(document_id);
ALTER TABLE public.document_annotations ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "Tenant isolation" ON public.document_annotations FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Service role" ON public.document_annotations FOR ALL USING (auth.role() = 'service_role'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.employee_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  employee_id UUID NOT NULL REFERENCES public.employees(id),
  certificate_type TEXT NOT NULL,
  certificate_name TEXT NOT NULL,
  issuer TEXT, issued_date DATE, expiry_date DATE, document_url TEXT,
  status TEXT NOT NULL DEFAULT 'valid',
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_certs_employee ON public.employee_certificates(employee_id);
CREATE INDEX IF NOT EXISTS idx_certs_expiry ON public.employee_certificates(expiry_date);
ALTER TABLE public.employee_certificates ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "Tenant isolation" ON public.employee_certificates FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Service role" ON public.employee_certificates FOR ALL USING (auth.role() = 'service_role'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.safety_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  project_id UUID REFERENCES public.projects(id),
  reported_by UUID NOT NULL REFERENCES public.employees(id),
  incident_type TEXT NOT NULL, severity TEXT NOT NULL DEFAULT 'low',
  description TEXT NOT NULL, location TEXT, photos TEXT[] DEFAULT '{}',
  corrective_actions TEXT, status TEXT NOT NULL DEFAULT 'reported',
  resolved_at TIMESTAMPTZ, resolved_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_incidents_project ON public.safety_incidents(project_id);
ALTER TABLE public.safety_incidents ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "Tenant isolation" ON public.safety_incidents FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Service role" ON public.safety_incidents FOR ALL USING (auth.role() = 'service_role'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.site_inductions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  project_id UUID NOT NULL REFERENCES public.projects(id),
  employee_id UUID NOT NULL REFERENCES public.employees(id),
  inducted_by UUID, signed_at TIMESTAMPTZ, notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, employee_id)
);
ALTER TABLE public.site_inductions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "Tenant isolation" ON public.site_inductions FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Service role" ON public.site_inductions FOR ALL USING (auth.role() = 'service_role'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.subcontractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  company_name TEXT NOT NULL, org_number TEXT, contact_name TEXT,
  contact_email TEXT, contact_phone TEXT,
  f_skatt_verified BOOLEAN DEFAULT false, f_skatt_verified_at TIMESTAMPTZ,
  insurance_verified BOOLEAN DEFAULT false, insurance_expiry DATE,
  notes TEXT, active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.subcontractors ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "Tenant isolation" ON public.subcontractors FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Service role" ON public.subcontractors FOR ALL USING (auth.role() = 'service_role'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.subcontractor_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  subcontractor_id UUID NOT NULL REFERENCES public.subcontractors(id),
  project_id UUID NOT NULL REFERENCES public.projects(id),
  scope TEXT, budget_sek NUMERIC(12,2), status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(subcontractor_id, project_id)
);
ALTER TABLE public.subcontractor_assignments ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "Tenant isolation" ON public.subcontractor_assignments FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Service role" ON public.subcontractor_assignments FOR ALL USING (auth.role() = 'service_role'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  employee_id UUID NOT NULL REFERENCES public.employees(id),
  project_id UUID REFERENCES public.projects(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  shift_type TEXT DEFAULT 'regular',
  status TEXT DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "Tenant isolation" ON public.schedules FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Service role" ON public.schedules FOR ALL USING (auth.role() = 'service_role'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;;
