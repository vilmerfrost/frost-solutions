ALTER TABLE public.rot_applications
  ADD COLUMN IF NOT EXISTS ata_type TEXT,
  ADD COLUMN IF NOT EXISTS urgency TEXT DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS timeline_impact_days INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS customer_approval_required BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS customer_approval_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS customer_approval_token TEXT,
  ADD COLUMN IF NOT EXISTS customer_approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS customer_rejected_reason TEXT,
  ADD COLUMN IF NOT EXISTS signing_order_id UUID,
  ADD COLUMN IF NOT EXISTS admin_pricing_notes TEXT,
  ADD COLUMN IF NOT EXISTS labor_hours NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS labor_rate_sek NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS created_by_employee_id UUID;

CREATE TABLE IF NOT EXISTS public.ata_audit_trail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  ata_id UUID NOT NULL REFERENCES public.rot_applications(id),
  event_type TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  actor_type TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ata_audit_ata_id ON public.ata_audit_trail(ata_id);
CREATE INDEX IF NOT EXISTS idx_ata_audit_created ON public.ata_audit_trail(created_at);
ALTER TABLE public.ata_audit_trail ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "Tenant isolation" ON public.ata_audit_trail FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Service role full access" ON public.ata_audit_trail FOR ALL USING (auth.role() = 'service_role'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.project_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  project_id UUID NOT NULL REFERENCES public.projects(id),
  folder TEXT NOT NULL DEFAULT '06-Foton',
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  previous_version_id UUID REFERENCES public.project_documents(id),
  uploaded_by UUID,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  is_required BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_project_docs_project ON public.project_documents(project_id);
CREATE INDEX IF NOT EXISTS idx_project_docs_folder ON public.project_documents(project_id, folder);
ALTER TABLE public.project_documents ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "Tenant isolation" ON public.project_documents FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Service role full access" ON public.project_documents FOR ALL USING (auth.role() = 'service_role'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.document_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  document_id UUID NOT NULL REFERENCES public.project_documents(id),
  access_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  shared_with_email TEXT,
  shared_with_name TEXT,
  permission TEXT NOT NULL DEFAULT 'view',
  expires_at TIMESTAMPTZ,
  password_hash TEXT,
  view_count INTEGER DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.document_shares ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "Tenant isolation" ON public.document_shares FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Service role full access" ON public.document_shares FOR ALL USING (auth.role() = 'service_role'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.customer_portal_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  client_id UUID NOT NULL REFERENCES public.clients(id),
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT,
  last_login TIMESTAMPTZ,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, email)
);
ALTER TABLE public.customer_portal_users ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "Service role full access" ON public.customer_portal_users FOR ALL USING (auth.role() = 'service_role'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.project_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  project_id UUID NOT NULL REFERENCES public.projects(id),
  sender_type TEXT NOT NULL,
  sender_id UUID NOT NULL,
  sender_name TEXT NOT NULL,
  message TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_project_messages_project ON public.project_messages(project_id);
ALTER TABLE public.project_messages ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "Tenant isolation" ON public.project_messages FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Service role full access" ON public.project_messages FOR ALL USING (auth.role() = 'service_role'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;;
