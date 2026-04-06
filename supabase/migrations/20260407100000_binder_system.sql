-- supabase/migrations/20260407100000_binder_system.sql
-- Binder system: templates, binders, tabs, checklists, cases

-- ============================================================
-- 1. BINDER TEMPLATES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.binder_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  name TEXT NOT NULL,
  description TEXT,
  structure JSONB NOT NULL DEFAULT '{"tabs":[]}',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES public.employees(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.binder_templates IS 'Reusable binder structures with tab configurations';
COMMENT ON COLUMN public.binder_templates.structure IS 'JSONB: { tabs: [{ name, key, icon, restricted }] }';
COMMENT ON COLUMN public.binder_templates.is_default IS 'One per tenant — used for auto-creating binders on new projects';

ALTER TABLE public.binder_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "binder_templates_tenant_select" ON public.binder_templates
  FOR SELECT USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
CREATE POLICY "binder_templates_tenant_insert" ON public.binder_templates
  FOR INSERT WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
CREATE POLICY "binder_templates_tenant_update" ON public.binder_templates
  FOR UPDATE USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
CREATE POLICY "binder_templates_tenant_delete" ON public.binder_templates
  FOR DELETE USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
CREATE POLICY "binder_templates_service_all" ON public.binder_templates
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- 2. BINDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.binders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  template_id UUID REFERENCES public.binder_templates(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES public.employees(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.binders IS 'Binder instances within a project — like physical ring binders';

ALTER TABLE public.binders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "binders_tenant_select" ON public.binders
  FOR SELECT USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
CREATE POLICY "binders_tenant_insert" ON public.binders
  FOR INSERT WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
CREATE POLICY "binders_tenant_update" ON public.binders
  FOR UPDATE USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
CREATE POLICY "binders_tenant_delete" ON public.binders
  FOR DELETE USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
CREATE POLICY "binders_service_all" ON public.binders
  FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX idx_binders_project ON public.binders(project_id);

-- ============================================================
-- 3. BINDER TABS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.binder_tabs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  binder_id UUID NOT NULL REFERENCES public.binders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  config JSONB NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES public.employees(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.binder_tabs IS 'Tabs within a binder — each tab holds documents';
COMMENT ON COLUMN public.binder_tabs.key IS 'URL-safe slug, unique per binder';
COMMENT ON COLUMN public.binder_tabs.config IS 'JSONB: { icon, color, restricted_roles: string[] }';

ALTER TABLE public.binder_tabs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "binder_tabs_tenant_select" ON public.binder_tabs
  FOR SELECT USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
CREATE POLICY "binder_tabs_tenant_insert" ON public.binder_tabs
  FOR INSERT WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
CREATE POLICY "binder_tabs_tenant_update" ON public.binder_tabs
  FOR UPDATE USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
CREATE POLICY "binder_tabs_tenant_delete" ON public.binder_tabs
  FOR DELETE USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
CREATE POLICY "binder_tabs_service_all" ON public.binder_tabs
  FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX idx_binder_tabs_binder ON public.binder_tabs(binder_id);
CREATE UNIQUE INDEX idx_binder_tabs_key ON public.binder_tabs(binder_id, key);

-- ============================================================
-- 4. LINK DOCUMENTS TO BINDER TABS
-- ============================================================
ALTER TABLE public.project_documents
  ADD COLUMN IF NOT EXISTS binder_tab_id UUID REFERENCES public.binder_tabs(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.project_documents.binder_tab_id IS 'Links document to a binder tab. Nullable for backwards compat with old folder column.';

CREATE INDEX IF NOT EXISTS idx_documents_binder_tab ON public.project_documents(binder_tab_id);

-- ============================================================
-- 5. CHECKLIST TEMPLATES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.checklist_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  structure JSONB NOT NULL DEFAULT '{"sections":[]}',
  created_by UUID REFERENCES public.employees(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.checklist_templates IS 'Reusable egenkontroll templates with sections and items';
COMMENT ON COLUMN public.checklist_templates.category IS 'Category for filtering: Grund, Stomme, Tak, El, VVS, etc.';
COMMENT ON COLUMN public.checklist_templates.structure IS 'JSONB: { sections: [{ name, items: [{ label, type, config }] }] }';

ALTER TABLE public.checklist_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "checklist_templates_tenant_select" ON public.checklist_templates
  FOR SELECT USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
CREATE POLICY "checklist_templates_tenant_insert" ON public.checklist_templates
  FOR INSERT WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
CREATE POLICY "checklist_templates_tenant_update" ON public.checklist_templates
  FOR UPDATE USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
CREATE POLICY "checklist_templates_tenant_delete" ON public.checklist_templates
  FOR DELETE USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
CREATE POLICY "checklist_templates_service_all" ON public.checklist_templates
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- 6. CHECKLISTS (instances)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  binder_tab_id UUID REFERENCES public.binder_tabs(id) ON DELETE SET NULL,
  template_id UUID REFERENCES public.checklist_templates(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed', 'signed_off')),
  assigned_to UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  signed_by UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  signed_at TIMESTAMPTZ,
  signature_data TEXT,
  created_by UUID REFERENCES public.employees(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.checklists IS 'Filled-in egenkontroll instances, created from templates';

ALTER TABLE public.checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "checklists_tenant_select" ON public.checklists
  FOR SELECT USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
CREATE POLICY "checklists_tenant_insert" ON public.checklists
  FOR INSERT WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
CREATE POLICY "checklists_tenant_update" ON public.checklists
  FOR UPDATE USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
CREATE POLICY "checklists_tenant_delete" ON public.checklists
  FOR DELETE USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
CREATE POLICY "checklists_service_all" ON public.checklists
  FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX idx_checklists_project ON public.checklists(project_id);
CREATE INDEX idx_checklists_status ON public.checklists(project_id, status);

-- ============================================================
-- 7. CASES (must come before checklist_items due to FK)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'ny' CHECK (status IN ('ny', 'pagaende', 'atgardad', 'godkand')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  assigned_to UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.employees(id),
  source_type TEXT CHECK (source_type IN ('manual', 'checklist', 'annotation')),
  source_id UUID,
  due_date DATE,
  resolved_at TIMESTAMPTZ,
  photos TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.cases IS 'Issues, defects, and action items — tracked via kanban workflow';
COMMENT ON COLUMN public.cases.source_type IS 'Where the case originated: manual, checklist item failure, or document annotation';
COMMENT ON COLUMN public.cases.source_id IS 'FK to checklist_items.id or document_annotations.id based on source_type';

ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cases_tenant_select" ON public.cases
  FOR SELECT USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
CREATE POLICY "cases_tenant_insert" ON public.cases
  FOR INSERT WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
CREATE POLICY "cases_tenant_update" ON public.cases
  FOR UPDATE USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
CREATE POLICY "cases_tenant_delete" ON public.cases
  FOR DELETE USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
CREATE POLICY "cases_service_all" ON public.cases
  FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX idx_cases_project ON public.cases(project_id);
CREATE INDEX idx_cases_status ON public.cases(project_id, status);
CREATE INDEX idx_cases_assigned ON public.cases(assigned_to) WHERE assigned_to IS NOT NULL;

-- ============================================================
-- 8. CHECKLIST ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id UUID NOT NULL REFERENCES public.checklists(id) ON DELETE CASCADE,
  section TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  label TEXT NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('yes_no', 'measurement', 'dropdown', 'text')),
  config JSONB NOT NULL DEFAULT '{}',
  value TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'ok', 'fail', 'na')),
  comment TEXT,
  photo_path TEXT,
  case_id UUID REFERENCES public.cases(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.checklist_items IS 'Individual check items within a filled-in egenkontroll';
COMMENT ON COLUMN public.checklist_items.case_id IS 'Auto-created case when item fails inspection';

ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "checklist_items_tenant_select" ON public.checklist_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.checklists c WHERE c.id = checklist_id AND c.tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
  );
CREATE POLICY "checklist_items_tenant_insert" ON public.checklist_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.checklists c WHERE c.id = checklist_id AND c.tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
  );
CREATE POLICY "checklist_items_tenant_update" ON public.checklist_items
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.checklists c WHERE c.id = checklist_id AND c.tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
  );
CREATE POLICY "checklist_items_tenant_delete" ON public.checklist_items
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.checklists c WHERE c.id = checklist_id AND c.tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
  );
CREATE POLICY "checklist_items_service_all" ON public.checklist_items
  FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX idx_checklist_items_checklist ON public.checklist_items(checklist_id);

-- ============================================================
-- 9. CASE COMMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.case_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.employees(id),
  body TEXT NOT NULL,
  photos TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.case_comments IS 'Discussion thread on a case';

ALTER TABLE public.case_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "case_comments_tenant_select" ON public.case_comments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.cases c WHERE c.id = case_id AND c.tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
  );
CREATE POLICY "case_comments_tenant_insert" ON public.case_comments
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.cases c WHERE c.id = case_id AND c.tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
  );
CREATE POLICY "case_comments_tenant_delete" ON public.case_comments
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.cases c WHERE c.id = case_id AND c.tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
  );
CREATE POLICY "case_comments_service_all" ON public.case_comments
  FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX idx_case_comments_case ON public.case_comments(case_id);
