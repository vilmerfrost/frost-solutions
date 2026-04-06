# Binder System, Checklists & Case Management — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hardcoded BSAB folder system with flexible iBinder-style binders, add structured egenkontroller (checklists), and case/issue tracking with kanban workflow.

**Architecture:** Relational core + JSONB config. Binders/tabs are relational tables with proper FKs and RLS. Templates stored as JSONB snapshots. Checklists instantiated from templates into relational rows. Cases linked to checklists/annotations via polymorphic source_type/source_id.

**Tech Stack:** Next.js 16 (App Router), Supabase (Postgres + Storage + RLS), React 19, Tailwind CSS, Zod validation, lucide-react icons.

**Spec:** `docs/superpowers/specs/2026-04-06-binder-system-design.md`

---

## File Structure

```
# New files to create:
supabase/migrations/20260407100000_binder_system.sql          — Schema: all new tables, indexes, RLS
supabase/migrations/20260407100100_migrate_documents.sql       — Data migration: existing docs → binders
supabase/migrations/20260407100200_seed_bsab_template.sql      — Seed BSAB default template

app/lib/binders/templates.ts         — BSAB default structure, createBinderFromTemplate()
app/lib/binders/permissions.ts       — Role-based permission checks for binders/tabs
app/lib/checklists/templates.ts      — Checklist template helpers, instantiateChecklist()
app/lib/cases/utils.ts               — Status transitions, createCaseFromChecklistItem()
app/lib/photos/compress.ts           — Client-side image compression utility

app/api/projects/[id]/binders/route.ts                        — GET (list), POST (create)
app/api/projects/[id]/binders/[binderId]/route.ts             — PATCH (update), DELETE
app/api/projects/[id]/binders/[binderId]/tabs/route.ts        — GET (list), POST (create)
app/api/projects/[id]/binders/[binderId]/tabs/[tabId]/route.ts — PATCH (update), DELETE
app/api/projects/[id]/checklists/route.ts                     — GET (list), POST (create)
app/api/projects/[id]/checklists/[checklistId]/route.ts       — GET (detail), PATCH (update/sign)
app/api/projects/[id]/checklists/[checklistId]/items/[itemId]/route.ts — PATCH (update item)
app/api/projects/[id]/cases/route.ts                          — GET (list), POST (create)
app/api/projects/[id]/cases/[caseId]/route.ts                 — GET (detail), PATCH (update)
app/api/projects/[id]/cases/[caseId]/comments/route.ts        — POST (add comment)
app/api/templates/binders/route.ts                            — GET, POST
app/api/templates/binders/[id]/route.ts                       — PATCH, DELETE
app/api/templates/checklists/route.ts                         — GET, POST
app/api/templates/checklists/[id]/route.ts                    — PATCH, DELETE

app/projects/[id]/checklists/page.tsx                         — Checklist overview
app/projects/[id]/checklists/[checklistId]/page.tsx           — Checklist fill-in (mobile-first)
app/projects/[id]/cases/page.tsx                              — Case kanban board
app/projects/[id]/cases/[caseId]/page.tsx                     — Case detail view
app/settings/templates/page.tsx                               — Template management (admin)

# Files to modify:
app/projects/[id]/documents/page.tsx                          — Rework to binder browser
app/components/SidebarClient.tsx                              — Add Egenkontroller, Ärenden, Mallar
app/lib/documents/folders.ts                                  — Add deprecation note
app/api/projects/[id]/documents/route.ts                      — Add binder_tab_id filter
app/api/projects/[id]/documents/upload/route.ts               — Accept binder_tab_id param
```

---

## Task 1: Database Schema — Binder Tables

**Files:**
- Create: `supabase/migrations/20260407100000_binder_system.sql`

- [ ] **Step 1: Write the binder system migration**

```sql
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

-- checklist_items inherits access from parent checklist via JOIN
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
```

- [ ] **Step 2: Apply the migration**

Run: `supabase db push`
Expected: Migration applies successfully, all tables created.

- [ ] **Step 3: Verify tables exist**

Run: `supabase db diff`
Expected: No diff — schema matches.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260407100000_binder_system.sql
git commit -m "feat: add binder system database schema (tables, RLS, indexes)"
```

---

## Task 2: BSAB Default Template Seed

**Files:**
- Create: `supabase/migrations/20260407100200_seed_bsab_template.sql`
- Create: `app/lib/binders/templates.ts`

- [ ] **Step 1: Write the BSAB seed migration**

```sql
-- supabase/migrations/20260407100200_seed_bsab_template.sql
-- Seed the built-in BSAB default template for each tenant.
-- This runs once. New tenants get the template via the app layer.

-- Insert a system-level BSAB template for each existing tenant
INSERT INTO public.binder_templates (tenant_id, name, description, structure, is_default, created_by)
SELECT
  t.id,
  'BSAB Standard',
  'Standardmall baserad på BSAB-systemet för byggprojekt',
  '{
    "tabs": [
      { "name": "Ritningar", "key": "01-ritningar", "icon": "blueprint", "restricted": false },
      { "name": "Beskrivningar", "key": "02-beskrivningar", "icon": "file-text", "restricted": false },
      { "name": "Administrativt", "key": "03-administrativt", "icon": "folder", "restricted": false },
      { "name": "Avtal", "key": "04-avtal", "icon": "file-lock", "restricted": true },
      { "name": "Ekonomi", "key": "05-ekonomi", "icon": "banknote", "restricted": true },
      { "name": "Foton", "key": "06-foton", "icon": "camera", "restricted": false },
      { "name": "KMA", "key": "07-kma", "icon": "shield-check", "restricted": false }
    ]
  }'::jsonb,
  true,
  NULL
FROM public.tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM public.binder_templates bt
  WHERE bt.tenant_id = t.id AND bt.is_default = true
);
```

- [ ] **Step 2: Write the binder template helpers**

```typescript
// app/lib/binders/templates.ts

import { SupabaseClient } from '@supabase/supabase-js'

export interface TabDefinition {
  name: string
  key: string
  icon: string
  restricted: boolean
}

export interface BinderTemplateStructure {
  tabs: TabDefinition[]
}

export const BSAB_DEFAULT_STRUCTURE: BinderTemplateStructure = {
  tabs: [
    { name: 'Ritningar', key: '01-ritningar', icon: 'blueprint', restricted: false },
    { name: 'Beskrivningar', key: '02-beskrivningar', icon: 'file-text', restricted: false },
    { name: 'Administrativt', key: '03-administrativt', icon: 'folder', restricted: false },
    { name: 'Avtal', key: '04-avtal', icon: 'file-lock', restricted: true },
    { name: 'Ekonomi', key: '05-ekonomi', icon: 'banknote', restricted: true },
    { name: 'Foton', key: '06-foton', icon: 'camera', restricted: false },
    { name: 'KMA', key: '07-kma', icon: 'shield-check', restricted: false },
  ],
}

/**
 * Create a binder from a template within a project.
 * Copies the template structure into real binder_tabs rows.
 */
export async function createBinderFromTemplate(
  admin: SupabaseClient,
  opts: {
    tenantId: string
    projectId: string
    templateId: string
    name: string
    createdBy: string
  }
): Promise<{ binderId: string } | { error: string }> {
  // 1. Fetch the template structure
  const { data: template, error: tErr } = await admin
    .from('binder_templates')
    .select('structure')
    .eq('id', opts.templateId)
    .eq('tenant_id', opts.tenantId)
    .single()

  if (tErr || !template) {
    return { error: 'Template not found' }
  }

  const structure = template.structure as BinderTemplateStructure

  // 2. Get next sort_order for this project
  const { data: existing } = await admin
    .from('binders')
    .select('sort_order')
    .eq('project_id', opts.projectId)
    .eq('tenant_id', opts.tenantId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0

  // 3. Create the binder
  const { data: binder, error: bErr } = await admin
    .from('binders')
    .insert({
      tenant_id: opts.tenantId,
      project_id: opts.projectId,
      name: opts.name,
      template_id: opts.templateId,
      sort_order: nextOrder,
      created_by: opts.createdBy,
    })
    .select('id')
    .single()

  if (bErr || !binder) {
    return { error: bErr?.message || 'Failed to create binder' }
  }

  // 4. Create tabs from template structure
  const tabRows = structure.tabs.map((tab, i) => ({
    tenant_id: opts.tenantId,
    binder_id: binder.id,
    name: tab.name,
    key: tab.key,
    sort_order: i,
    config: {
      icon: tab.icon,
      restricted_roles: tab.restricted ? ['admin'] : [],
    },
    created_by: opts.createdBy,
  }))

  const { error: tabErr } = await admin
    .from('binder_tabs')
    .insert(tabRows)

  if (tabErr) {
    // Rollback: delete the binder (cascade deletes tabs)
    await admin.from('binders').delete().eq('id', binder.id)
    return { error: tabErr.message || 'Failed to create tabs' }
  }

  return { binderId: binder.id }
}

/**
 * Create an empty binder (no template) with custom tabs.
 */
export async function createEmptyBinder(
  admin: SupabaseClient,
  opts: {
    tenantId: string
    projectId: string
    name: string
    createdBy: string
  }
): Promise<{ binderId: string } | { error: string }> {
  const { data: existing } = await admin
    .from('binders')
    .select('sort_order')
    .eq('project_id', opts.projectId)
    .eq('tenant_id', opts.tenantId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0

  const { data: binder, error } = await admin
    .from('binders')
    .insert({
      tenant_id: opts.tenantId,
      project_id: opts.projectId,
      name: opts.name,
      template_id: null,
      sort_order: nextOrder,
      created_by: opts.createdBy,
    })
    .select('id')
    .single()

  if (error || !binder) {
    return { error: error?.message || 'Failed to create binder' }
  }

  return { binderId: binder.id }
}
```

- [ ] **Step 3: Apply the seed migration**

Run: `supabase db push`
Expected: BSAB template inserted for each existing tenant.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260407100200_seed_bsab_template.sql app/lib/binders/templates.ts
git commit -m "feat: add BSAB default template seed and binder helper functions"
```

---

## Task 3: Data Migration — Existing Documents to Binders

**Files:**
- Create: `supabase/migrations/20260407100100_migrate_documents.sql`

- [ ] **Step 1: Write the data migration**

```sql
-- supabase/migrations/20260407100100_migrate_documents.sql
-- Migrate existing project_documents from folder-based to binder-based system.
-- For each project that has documents, create a BSAB binder and link documents to tabs.

-- Step 1: Create binders for projects that have documents but no binder yet
INSERT INTO public.binders (tenant_id, project_id, name, template_id, sort_order, created_by)
SELECT DISTINCT
  pd.tenant_id,
  pd.project_id,
  'BSAB Standard',
  bt.id,
  0,
  NULL
FROM public.project_documents pd
JOIN public.binder_templates bt ON bt.tenant_id = pd.tenant_id AND bt.is_default = true
WHERE pd.binder_tab_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.binders b
    WHERE b.project_id = pd.project_id AND b.tenant_id = pd.tenant_id
  );

-- Step 2: Create tabs for those binders from the BSAB template structure
-- We use a function to avoid repeating the tab creation logic
DO $$
DECLARE
  binder_rec RECORD;
  tab_def JSONB;
  tab_idx INTEGER;
BEGIN
  FOR binder_rec IN
    SELECT b.id AS binder_id, b.tenant_id, bt.structure
    FROM public.binders b
    JOIN public.binder_templates bt ON bt.id = b.template_id
    WHERE NOT EXISTS (
      SELECT 1 FROM public.binder_tabs t WHERE t.binder_id = b.id
    )
  LOOP
    tab_idx := 0;
    FOR tab_def IN SELECT jsonb_array_elements(binder_rec.structure -> 'tabs')
    LOOP
      INSERT INTO public.binder_tabs (tenant_id, binder_id, name, key, sort_order, config)
      VALUES (
        binder_rec.tenant_id,
        binder_rec.binder_id,
        tab_def ->> 'name',
        tab_def ->> 'key',
        tab_idx,
        jsonb_build_object(
          'icon', tab_def ->> 'icon',
          'restricted_roles', CASE WHEN (tab_def ->> 'restricted')::boolean THEN '["admin"]'::jsonb ELSE '[]'::jsonb END
        )
      );
      tab_idx := tab_idx + 1;
    END LOOP;
  END LOOP;
END $$;

-- Step 3: Map existing folder values to binder_tab_id
-- The old folder format is like '01-Ritningar' or '06-Foton/Före'
-- The new key format is like '01-ritningar'
UPDATE public.project_documents pd
SET binder_tab_id = bt.id
FROM public.binder_tabs bt
JOIN public.binders b ON b.id = bt.binder_id
WHERE b.project_id = pd.project_id
  AND b.tenant_id = pd.tenant_id
  AND pd.binder_tab_id IS NULL
  AND pd.folder IS NOT NULL
  AND bt.key = lower(split_part(pd.folder, '/', 1));
```

- [ ] **Step 2: Apply the migration**

Run: `supabase db push`
Expected: Existing documents now linked to binder tabs via `binder_tab_id`.

- [ ] **Step 3: Verify the migration**

Run the following SQL via `supabase db execute` or the Supabase dashboard:
```sql
SELECT count(*) AS total,
       count(binder_tab_id) AS migrated,
       count(*) - count(binder_tab_id) AS unmigrated
FROM public.project_documents;
```
Expected: `migrated` count matches or is close to `total`. `unmigrated` should only include documents with NULL or non-standard folder values.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260407100100_migrate_documents.sql
git commit -m "feat: migrate existing documents to binder system"
```

---

## Task 4: Binder Permissions Helper

**Files:**
- Create: `app/lib/binders/permissions.ts`

- [ ] **Step 1: Write the permissions helper**

```typescript
// app/lib/binders/permissions.ts

export type UserRole = 'admin' | 'Admin' | 'supervisor' | 'worker' | 'subcontractor'

const ADMIN_ROLES: string[] = ['admin', 'Admin']
const MANAGEMENT_ROLES: string[] = ['admin', 'Admin', 'supervisor']

/**
 * Check if a role can create/delete binders in a project.
 */
export function canManageBinders(role: string | null): boolean {
  return MANAGEMENT_ROLES.includes(role ?? '')
}

/**
 * Check if a role can create checklist/binder templates.
 */
export function canManageTemplates(role: string | null): boolean {
  return ADMIN_ROLES.includes(role ?? '')
}

/**
 * Check if a role can create checklist templates.
 */
export function canCreateChecklistTemplates(role: string | null): boolean {
  return MANAGEMENT_ROLES.includes(role ?? '')
}

/**
 * Check if a role can sign off a checklist.
 */
export function canSignOffChecklist(role: string | null): boolean {
  return MANAGEMENT_ROLES.includes(role ?? '')
}

/**
 * Check if a role can assign/close cases.
 */
export function canManageCases(role: string | null): boolean {
  return MANAGEMENT_ROLES.includes(role ?? '')
}

/**
 * Check if a role can access a tab based on its config.restricted_roles.
 * If restricted_roles is empty, everyone can access.
 * If restricted_roles has values, only those roles can access.
 */
export function canAccessTab(
  role: string | null,
  tabConfig: { restricted_roles?: string[] }
): boolean {
  const restricted = tabConfig.restricted_roles ?? []
  if (restricted.length === 0) return true
  return restricted.includes(role ?? '')
}
```

- [ ] **Step 2: Commit**

```bash
git add app/lib/binders/permissions.ts
git commit -m "feat: add binder/checklist/case permission helpers"
```

---

## Task 5: Binder API Routes

**Files:**
- Create: `app/api/projects/[id]/binders/route.ts`
- Create: `app/api/projects/[id]/binders/[binderId]/route.ts`
- Create: `app/api/projects/[id]/binders/[binderId]/tabs/route.ts`
- Create: `app/api/projects/[id]/binders/[binderId]/tabs/[tabId]/route.ts`

- [ ] **Step 1: Write binder list/create route**

```typescript
// app/api/projects/[id]/binders/route.ts
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuthAdmin, parseBody, apiSuccess, apiError, handleRouteError } from '@/lib/api'
import { canManageBinders } from '@/lib/binders/permissions'
import { createBinderFromTemplate, createEmptyBinder } from '@/lib/binders/templates'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { data, error } = await auth.admin
      .from('binders')
      .select(`
        id, name, sort_order, template_id, created_at,
        binder_tabs ( id, name, key, sort_order, config )
      `)
      .eq('project_id', projectId)
      .eq('tenant_id', auth.tenantId)
      .order('sort_order', { ascending: true })

    if (error) return apiError(error.message, 500)

    return apiSuccess({ binders: data || [] })
  } catch (err) {
    return handleRouteError(err)
  }
}

const CreateBinderSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  templateId: z.string().uuid().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    // Check role
    const { data: emp } = await auth.admin
      .from('employees')
      .select('role')
      .eq('auth_user_id', auth.user.id)
      .eq('tenant_id', auth.tenantId)
      .single()

    if (!canManageBinders(emp?.role ?? null)) {
      return apiError('Behörighet saknas', 403)
    }

    const body = await parseBody(request, CreateBinderSchema)
    if (body.error) return body.error

    const { name, templateId } = body.data

    if (templateId) {
      const result = await createBinderFromTemplate(auth.admin, {
        tenantId: auth.tenantId,
        projectId,
        templateId,
        name,
        createdBy: emp?.id || auth.user.id,
      })
      if ('error' in result) return apiError(result.error, 400)
      return apiSuccess({ binderId: result.binderId }, 201)
    }

    const result = await createEmptyBinder(auth.admin, {
      tenantId: auth.tenantId,
      projectId,
      name,
      createdBy: emp?.id || auth.user.id,
    })
    if ('error' in result) return apiError(result.error, 400)
    return apiSuccess({ binderId: result.binderId }, 201)
  } catch (err) {
    return handleRouteError(err)
  }
}
```

- [ ] **Step 2: Write binder update/delete route**

```typescript
// app/api/projects/[id]/binders/[binderId]/route.ts
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuthAdmin, parseBody, apiSuccess, apiError, handleRouteError } from '@/lib/api'
import { canManageBinders } from '@/lib/binders/permissions'

const UpdateBinderSchema = z.object({
  name: z.string().min(1).optional(),
  sort_order: z.number().int().min(0).optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; binderId: string }> }
) {
  try {
    const { id: projectId, binderId } = await params
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { data: emp } = await auth.admin
      .from('employees')
      .select('role')
      .eq('auth_user_id', auth.user.id)
      .eq('tenant_id', auth.tenantId)
      .single()

    if (!canManageBinders(emp?.role ?? null)) {
      return apiError('Behörighet saknas', 403)
    }

    const body = await parseBody(request, UpdateBinderSchema)
    if (body.error) return body.error

    const { data, error } = await auth.admin
      .from('binders')
      .update({ ...body.data, updated_at: new Date().toISOString() })
      .eq('id', binderId)
      .eq('project_id', projectId)
      .eq('tenant_id', auth.tenantId)
      .select()
      .single()

    if (error) return apiError(error.message, 500)
    if (!data) return apiError('Pärm hittades inte', 404)

    return apiSuccess({ binder: data })
  } catch (err) {
    return handleRouteError(err)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; binderId: string }> }
) {
  try {
    const { id: projectId, binderId } = await params
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { data: emp } = await auth.admin
      .from('employees')
      .select('role')
      .eq('auth_user_id', auth.user.id)
      .eq('tenant_id', auth.tenantId)
      .single()

    if (!canManageBinders(emp?.role ?? null)) {
      return apiError('Behörighet saknas', 403)
    }

    const { error } = await auth.admin
      .from('binders')
      .delete()
      .eq('id', binderId)
      .eq('project_id', projectId)
      .eq('tenant_id', auth.tenantId)

    if (error) return apiError(error.message, 500)

    return apiSuccess({ deleted: true })
  } catch (err) {
    return handleRouteError(err)
  }
}
```

- [ ] **Step 3: Write tab list/create route**

```typescript
// app/api/projects/[id]/binders/[binderId]/tabs/route.ts
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuthAdmin, parseBody, apiSuccess, apiError, handleRouteError } from '@/lib/api'
import { canManageBinders } from '@/lib/binders/permissions'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; binderId: string }> }
) {
  try {
    const { binderId } = await params
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { data, error } = await auth.admin
      .from('binder_tabs')
      .select('id, name, key, sort_order, config')
      .eq('binder_id', binderId)
      .eq('tenant_id', auth.tenantId)
      .order('sort_order', { ascending: true })

    if (error) return apiError(error.message, 500)

    return apiSuccess({ tabs: data || [] })
  } catch (err) {
    return handleRouteError(err)
  }
}

const CreateTabSchema = z.object({
  name: z.string().min(1, 'Tab name required'),
  key: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Key must be lowercase alphanumeric with hyphens'),
  config: z.object({
    icon: z.string().optional(),
    color: z.string().optional(),
    restricted_roles: z.array(z.string()).optional(),
  }).optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; binderId: string }> }
) {
  try {
    const { binderId } = await params
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { data: emp } = await auth.admin
      .from('employees')
      .select('role')
      .eq('auth_user_id', auth.user.id)
      .eq('tenant_id', auth.tenantId)
      .single()

    if (!canManageBinders(emp?.role ?? null)) {
      return apiError('Behörighet saknas', 403)
    }

    const body = await parseBody(request, CreateTabSchema)
    if (body.error) return body.error

    // Get next sort_order
    const { data: existing } = await auth.admin
      .from('binder_tabs')
      .select('sort_order')
      .eq('binder_id', binderId)
      .eq('tenant_id', auth.tenantId)
      .order('sort_order', { ascending: false })
      .limit(1)

    const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0

    const { data, error } = await auth.admin
      .from('binder_tabs')
      .insert({
        tenant_id: auth.tenantId,
        binder_id: binderId,
        name: body.data.name,
        key: body.data.key,
        sort_order: nextOrder,
        config: body.data.config || {},
        created_by: emp?.id || auth.user.id,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') return apiError('En flik med den nyckeln finns redan', 409)
      return apiError(error.message, 500)
    }

    return apiSuccess({ tab: data }, 201)
  } catch (err) {
    return handleRouteError(err)
  }
}
```

- [ ] **Step 4: Write tab update/delete route**

```typescript
// app/api/projects/[id]/binders/[binderId]/tabs/[tabId]/route.ts
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuthAdmin, parseBody, apiSuccess, apiError, handleRouteError } from '@/lib/api'
import { canManageBinders } from '@/lib/binders/permissions'

const UpdateTabSchema = z.object({
  name: z.string().min(1).optional(),
  sort_order: z.number().int().min(0).optional(),
  config: z.object({
    icon: z.string().optional(),
    color: z.string().optional(),
    restricted_roles: z.array(z.string()).optional(),
  }).optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; binderId: string; tabId: string }> }
) {
  try {
    const { binderId, tabId } = await params
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { data: emp } = await auth.admin
      .from('employees')
      .select('role')
      .eq('auth_user_id', auth.user.id)
      .eq('tenant_id', auth.tenantId)
      .single()

    if (!canManageBinders(emp?.role ?? null)) {
      return apiError('Behörighet saknas', 403)
    }

    const body = await parseBody(request, UpdateTabSchema)
    if (body.error) return body.error

    const { data, error } = await auth.admin
      .from('binder_tabs')
      .update(body.data)
      .eq('id', tabId)
      .eq('binder_id', binderId)
      .eq('tenant_id', auth.tenantId)
      .select()
      .single()

    if (error) return apiError(error.message, 500)
    if (!data) return apiError('Flik hittades inte', 404)

    return apiSuccess({ tab: data })
  } catch (err) {
    return handleRouteError(err)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; binderId: string; tabId: string }> }
) {
  try {
    const { binderId, tabId } = await params
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { data: emp } = await auth.admin
      .from('employees')
      .select('role')
      .eq('auth_user_id', auth.user.id)
      .eq('tenant_id', auth.tenantId)
      .single()

    if (!canManageBinders(emp?.role ?? null)) {
      return apiError('Behörighet saknas', 403)
    }

    const { error } = await auth.admin
      .from('binder_tabs')
      .delete()
      .eq('id', tabId)
      .eq('binder_id', binderId)
      .eq('tenant_id', auth.tenantId)

    if (error) return apiError(error.message, 500)

    return apiSuccess({ deleted: true })
  } catch (err) {
    return handleRouteError(err)
  }
}
```

- [ ] **Step 5: Verify build**

Run: `npx next build 2>&1 | grep -i error`
Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add app/api/projects/\[id\]/binders/
git commit -m "feat: add binder and tab CRUD API routes"
```

---

## Task 6: Checklist & Case Helpers

**Files:**
- Create: `app/lib/checklists/templates.ts`
- Create: `app/lib/cases/utils.ts`

- [ ] **Step 1: Write checklist template helper**

```typescript
// app/lib/checklists/templates.ts

import { SupabaseClient } from '@supabase/supabase-js'

export interface ChecklistItemDef {
  label: string
  type: 'yes_no' | 'measurement' | 'dropdown' | 'text'
  config?: Record<string, unknown>
}

export interface ChecklistSection {
  name: string
  items: ChecklistItemDef[]
}

export interface ChecklistTemplateStructure {
  sections: ChecklistSection[]
}

/**
 * Create a checklist instance from a template.
 * Copies the template structure into checklist_items rows.
 */
export async function instantiateChecklist(
  admin: SupabaseClient,
  opts: {
    tenantId: string
    projectId: string
    templateId: string
    assignedTo?: string
    binderTabId?: string
    createdBy: string
  }
): Promise<{ checklistId: string } | { error: string }> {
  // 1. Fetch template
  const { data: template, error: tErr } = await admin
    .from('checklist_templates')
    .select('name, structure')
    .eq('id', opts.templateId)
    .eq('tenant_id', opts.tenantId)
    .single()

  if (tErr || !template) {
    return { error: 'Mall hittades inte' }
  }

  const structure = template.structure as ChecklistTemplateStructure

  // 2. Create checklist instance
  const { data: checklist, error: cErr } = await admin
    .from('checklists')
    .insert({
      tenant_id: opts.tenantId,
      project_id: opts.projectId,
      binder_tab_id: opts.binderTabId || null,
      template_id: opts.templateId,
      name: template.name,
      status: 'draft',
      assigned_to: opts.assignedTo || null,
      created_by: opts.createdBy,
    })
    .select('id')
    .single()

  if (cErr || !checklist) {
    return { error: cErr?.message || 'Kunde inte skapa egenkontroll' }
  }

  // 3. Create items from template sections
  let sortOrder = 0
  const itemRows = structure.sections.flatMap((section) =>
    section.items.map((item) => ({
      checklist_id: checklist.id,
      section: section.name,
      sort_order: sortOrder++,
      label: item.label,
      item_type: item.type,
      config: item.config || {},
      status: 'pending',
    }))
  )

  if (itemRows.length > 0) {
    const { error: iErr } = await admin
      .from('checklist_items')
      .insert(itemRows)

    if (iErr) {
      await admin.from('checklists').delete().eq('id', checklist.id)
      return { error: iErr.message || 'Kunde inte skapa kontrollpunkter' }
    }
  }

  return { checklistId: checklist.id }
}
```

- [ ] **Step 2: Write case utility helpers**

```typescript
// app/lib/cases/utils.ts

import { SupabaseClient } from '@supabase/supabase-js'

export const CASE_STATUSES = ['ny', 'pagaende', 'atgardad', 'godkand'] as const
export type CaseStatus = typeof CASE_STATUSES[number]

export const CASE_PRIORITIES = ['low', 'medium', 'high', 'critical'] as const
export type CasePriority = typeof CASE_PRIORITIES[number]

export const STATUS_LABELS: Record<CaseStatus, string> = {
  ny: 'Ny',
  pagaende: 'Pågående',
  atgardad: 'Åtgärdad',
  godkand: 'Godkänd',
}

export const PRIORITY_LABELS: Record<CasePriority, string> = {
  low: 'Låg',
  medium: 'Medium',
  high: 'Hög',
  critical: 'Kritisk',
}

/**
 * Validate a status transition.
 * Valid transitions: ny → pagaende → atgardad → godkand
 * Also allows: any → ny (reopen)
 */
export function isValidTransition(from: CaseStatus, to: CaseStatus): boolean {
  const idx = CASE_STATUSES.indexOf(from)
  const toIdx = CASE_STATUSES.indexOf(to)
  // Allow forward by one step, or reopen to 'ny'
  return toIdx === idx + 1 || to === 'ny'
}

/**
 * Create a case from a failed checklist item.
 * Links the case back to the checklist item via source_type/source_id.
 */
export async function createCaseFromChecklistItem(
  admin: SupabaseClient,
  opts: {
    tenantId: string
    projectId: string
    checklistItemId: string
    itemLabel: string
    createdBy: string
  }
): Promise<{ caseId: string } | { error: string }> {
  const { data: newCase, error } = await admin
    .from('cases')
    .insert({
      tenant_id: opts.tenantId,
      project_id: opts.projectId,
      title: `Avvikelse: ${opts.itemLabel}`,
      status: 'ny',
      priority: 'medium',
      created_by: opts.createdBy,
      source_type: 'checklist',
      source_id: opts.checklistItemId,
    })
    .select('id')
    .single()

  if (error || !newCase) {
    return { error: error?.message || 'Kunde inte skapa ärende' }
  }

  // Link the case back to the checklist item
  await admin
    .from('checklist_items')
    .update({ case_id: newCase.id })
    .eq('id', opts.checklistItemId)

  return { caseId: newCase.id }
}
```

- [ ] **Step 3: Commit**

```bash
git add app/lib/checklists/templates.ts app/lib/cases/utils.ts
git commit -m "feat: add checklist instantiation and case management helpers"
```

---

## Task 7: Checklist API Routes

**Files:**
- Create: `app/api/projects/[id]/checklists/route.ts`
- Create: `app/api/projects/[id]/checklists/[checklistId]/route.ts`
- Create: `app/api/projects/[id]/checklists/[checklistId]/items/[itemId]/route.ts`

- [ ] **Step 1: Write checklist list/create route**

```typescript
// app/api/projects/[id]/checklists/route.ts
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuthAdmin, parseBody, apiSuccess, apiError, handleRouteError } from '@/lib/api'
import { instantiateChecklist } from '@/lib/checklists/templates'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const assignedTo = url.searchParams.get('assigned_to')

    let query = auth.admin
      .from('checklists')
      .select('id, name, status, assigned_to, template_id, signed_by, signed_at, created_at, updated_at')
      .eq('project_id', projectId)
      .eq('tenant_id', auth.tenantId)
      .order('created_at', { ascending: false })

    if (status) query = query.eq('status', status)
    if (assignedTo) query = query.eq('assigned_to', assignedTo)

    const { data, error } = await query

    if (error) return apiError(error.message, 500)

    return apiSuccess({ checklists: data || [] })
  } catch (err) {
    return handleRouteError(err)
  }
}

const CreateChecklistSchema = z.object({
  templateId: z.string().uuid(),
  assignedTo: z.string().uuid().optional(),
  binderTabId: z.string().uuid().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const body = await parseBody(request, CreateChecklistSchema)
    if (body.error) return body.error

    const { data: emp } = await auth.admin
      .from('employees')
      .select('id')
      .eq('auth_user_id', auth.user.id)
      .eq('tenant_id', auth.tenantId)
      .single()

    const result = await instantiateChecklist(auth.admin, {
      tenantId: auth.tenantId,
      projectId,
      templateId: body.data.templateId,
      assignedTo: body.data.assignedTo,
      binderTabId: body.data.binderTabId,
      createdBy: emp?.id || auth.user.id,
    })

    if ('error' in result) return apiError(result.error, 400)

    return apiSuccess({ checklistId: result.checklistId }, 201)
  } catch (err) {
    return handleRouteError(err)
  }
}
```

- [ ] **Step 2: Write checklist detail/update route**

```typescript
// app/api/projects/[id]/checklists/[checklistId]/route.ts
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuthAdmin, parseBody, apiSuccess, apiError, handleRouteError } from '@/lib/api'
import { canSignOffChecklist } from '@/lib/binders/permissions'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; checklistId: string }> }
) {
  try {
    const { checklistId } = await params
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { data, error } = await auth.admin
      .from('checklists')
      .select(`
        id, name, status, assigned_to, template_id,
        signed_by, signed_at, signature_data, created_at, updated_at,
        checklist_items (
          id, section, sort_order, label, item_type, config,
          value, status, comment, photo_path, case_id
        )
      `)
      .eq('id', checklistId)
      .eq('tenant_id', auth.tenantId)
      .single()

    if (error) return apiError(error.message, 500)
    if (!data) return apiError('Egenkontroll hittades inte', 404)

    // Sort items by sort_order
    if (data.checklist_items) {
      data.checklist_items.sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
    }

    return apiSuccess({ checklist: data })
  } catch (err) {
    return handleRouteError(err)
  }
}

const UpdateChecklistSchema = z.object({
  status: z.enum(['draft', 'in_progress', 'completed', 'signed_off']).optional(),
  name: z.string().min(1).optional(),
  assignedTo: z.string().uuid().nullable().optional(),
  signatureData: z.string().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; checklistId: string }> }
) {
  try {
    const { checklistId } = await params
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const body = await parseBody(request, UpdateChecklistSchema)
    if (body.error) return body.error

    const { data: emp } = await auth.admin
      .from('employees')
      .select('id, role')
      .eq('auth_user_id', auth.user.id)
      .eq('tenant_id', auth.tenantId)
      .single()

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (body.data.name !== undefined) updateData.name = body.data.name
    if (body.data.assignedTo !== undefined) updateData.assigned_to = body.data.assignedTo
    if (body.data.status !== undefined) updateData.status = body.data.status

    // Handle sign-off
    if (body.data.status === 'signed_off') {
      if (!canSignOffChecklist(emp?.role ?? null)) {
        return apiError('Behörighet saknas för signering', 403)
      }
      updateData.signed_by = emp?.id || auth.user.id
      updateData.signed_at = new Date().toISOString()
      if (body.data.signatureData) {
        updateData.signature_data = body.data.signatureData
      }
    }

    const { data, error } = await auth.admin
      .from('checklists')
      .update(updateData)
      .eq('id', checklistId)
      .eq('tenant_id', auth.tenantId)
      .select()
      .single()

    if (error) return apiError(error.message, 500)
    if (!data) return apiError('Egenkontroll hittades inte', 404)

    return apiSuccess({ checklist: data })
  } catch (err) {
    return handleRouteError(err)
  }
}
```

- [ ] **Step 3: Write checklist item update route**

```typescript
// app/api/projects/[id]/checklists/[checklistId]/items/[itemId]/route.ts
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuthAdmin, parseBody, apiSuccess, apiError, handleRouteError } from '@/lib/api'
import { createCaseFromChecklistItem } from '@/lib/cases/utils'

const UpdateItemSchema = z.object({
  value: z.string().nullable().optional(),
  status: z.enum(['pending', 'ok', 'fail', 'na']).optional(),
  comment: z.string().nullable().optional(),
  photoPath: z.string().nullable().optional(),
  createCase: z.boolean().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; checklistId: string; itemId: string }> }
) {
  try {
    const { id: projectId, checklistId, itemId } = await params
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const body = await parseBody(request, UpdateItemSchema)
    if (body.error) return body.error

    // Verify checklist belongs to tenant
    const { data: checklist } = await auth.admin
      .from('checklists')
      .select('id, tenant_id')
      .eq('id', checklistId)
      .eq('tenant_id', auth.tenantId)
      .single()

    if (!checklist) return apiError('Egenkontroll hittades inte', 404)

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (body.data.value !== undefined) updateData.value = body.data.value
    if (body.data.status !== undefined) updateData.status = body.data.status
    if (body.data.comment !== undefined) updateData.comment = body.data.comment
    if (body.data.photoPath !== undefined) updateData.photo_path = body.data.photoPath

    // Auto-create case on failure
    if (body.data.createCase && body.data.status === 'fail') {
      const { data: item } = await auth.admin
        .from('checklist_items')
        .select('label, case_id')
        .eq('id', itemId)
        .single()

      if (item && !item.case_id) {
        const { data: emp } = await auth.admin
          .from('employees')
          .select('id')
          .eq('auth_user_id', auth.user.id)
          .eq('tenant_id', auth.tenantId)
          .single()

        const caseResult = await createCaseFromChecklistItem(auth.admin, {
          tenantId: auth.tenantId,
          projectId,
          checklistItemId: itemId,
          itemLabel: item.label,
          createdBy: emp?.id || auth.user.id,
        })

        if ('caseId' in caseResult) {
          updateData.case_id = caseResult.caseId
        }
      }
    }

    const { data, error } = await auth.admin
      .from('checklist_items')
      .update(updateData)
      .eq('id', itemId)
      .eq('checklist_id', checklistId)
      .select()
      .single()

    if (error) return apiError(error.message, 500)
    if (!data) return apiError('Kontrollpunkt hittades inte', 404)

    return apiSuccess({ item: data })
  } catch (err) {
    return handleRouteError(err)
  }
}
```

- [ ] **Step 4: Verify build**

Run: `npx next build 2>&1 | grep -i error`
Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add app/api/projects/\[id\]/checklists/
git commit -m "feat: add checklist CRUD and item update API routes"
```

---

## Task 8: Case API Routes

**Files:**
- Create: `app/api/projects/[id]/cases/route.ts`
- Create: `app/api/projects/[id]/cases/[caseId]/route.ts`
- Create: `app/api/projects/[id]/cases/[caseId]/comments/route.ts`

- [ ] **Step 1: Write case list/create route**

```typescript
// app/api/projects/[id]/cases/route.ts
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuthAdmin, parseBody, apiSuccess, apiError, handleRouteError } from '@/lib/api'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const priority = url.searchParams.get('priority')
    const assignedTo = url.searchParams.get('assigned_to')

    let query = auth.admin
      .from('cases')
      .select('id, title, description, status, priority, assigned_to, created_by, source_type, source_id, due_date, resolved_at, photos, created_at')
      .eq('project_id', projectId)
      .eq('tenant_id', auth.tenantId)
      .order('created_at', { ascending: false })

    if (status) query = query.eq('status', status)
    if (priority) query = query.eq('priority', priority)
    if (assignedTo) query = query.eq('assigned_to', assignedTo)

    const { data, error } = await query

    if (error) return apiError(error.message, 500)

    return apiSuccess({ cases: data || [] })
  } catch (err) {
    return handleRouteError(err)
  }
}

const CreateCaseSchema = z.object({
  title: z.string().min(1, 'Titel krävs'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  assignedTo: z.string().uuid().optional(),
  dueDate: z.string().optional(),
  photos: z.array(z.string()).optional(),
  sourceType: z.enum(['manual', 'checklist', 'annotation']).default('manual'),
  sourceId: z.string().uuid().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const body = await parseBody(request, CreateCaseSchema)
    if (body.error) return body.error

    const { data: emp } = await auth.admin
      .from('employees')
      .select('id')
      .eq('auth_user_id', auth.user.id)
      .eq('tenant_id', auth.tenantId)
      .single()

    const { data, error } = await auth.admin
      .from('cases')
      .insert({
        tenant_id: auth.tenantId,
        project_id: projectId,
        title: body.data.title,
        description: body.data.description || null,
        status: 'ny',
        priority: body.data.priority,
        assigned_to: body.data.assignedTo || null,
        created_by: emp?.id || auth.user.id,
        source_type: body.data.sourceType,
        source_id: body.data.sourceId || null,
        due_date: body.data.dueDate || null,
        photos: body.data.photos || [],
      })
      .select()
      .single()

    if (error) return apiError(error.message, 500)

    return apiSuccess({ case: data }, 201)
  } catch (err) {
    return handleRouteError(err)
  }
}
```

- [ ] **Step 2: Write case detail/update route**

```typescript
// app/api/projects/[id]/cases/[caseId]/route.ts
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuthAdmin, parseBody, apiSuccess, apiError, handleRouteError } from '@/lib/api'
import { canManageCases, CASE_STATUSES, isValidTransition } from '@/lib/cases/utils'
import type { CaseStatus } from '@/lib/cases/utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; caseId: string }> }
) {
  try {
    const { caseId } = await params
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { data, error } = await auth.admin
      .from('cases')
      .select(`
        id, title, description, status, priority, assigned_to, created_by,
        source_type, source_id, due_date, resolved_at, photos, created_at, updated_at,
        case_comments ( id, author_id, body, photos, created_at )
      `)
      .eq('id', caseId)
      .eq('tenant_id', auth.tenantId)
      .single()

    if (error) return apiError(error.message, 500)
    if (!data) return apiError('Ärende hittades inte', 404)

    // Sort comments by date
    if (data.case_comments) {
      data.case_comments.sort((a: { created_at: string }, b: { created_at: string }) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
    }

    return apiSuccess({ case: data })
  } catch (err) {
    return handleRouteError(err)
  }
}

const UpdateCaseSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  status: z.enum(['ny', 'pagaende', 'atgardad', 'godkand']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  assignedTo: z.string().uuid().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  photos: z.array(z.string()).optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; caseId: string }> }
) {
  try {
    const { caseId } = await params
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const body = await parseBody(request, UpdateCaseSchema)
    if (body.error) return body.error

    const { data: emp } = await auth.admin
      .from('employees')
      .select('id, role')
      .eq('auth_user_id', auth.user.id)
      .eq('tenant_id', auth.tenantId)
      .single()

    // Check permissions for status changes and assignment
    if (body.data.status || body.data.assignedTo !== undefined) {
      if (!canManageCases(emp?.role ?? null)) {
        return apiError('Behörighet saknas', 403)
      }
    }

    // Validate status transition
    if (body.data.status) {
      const { data: current } = await auth.admin
        .from('cases')
        .select('status')
        .eq('id', caseId)
        .eq('tenant_id', auth.tenantId)
        .single()

      if (current && !isValidTransition(current.status as CaseStatus, body.data.status)) {
        return apiError(`Ogiltig statusändring: ${current.status} → ${body.data.status}`, 400)
      }
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (body.data.title !== undefined) updateData.title = body.data.title
    if (body.data.description !== undefined) updateData.description = body.data.description
    if (body.data.status !== undefined) {
      updateData.status = body.data.status
      if (body.data.status === 'atgardad' || body.data.status === 'godkand') {
        updateData.resolved_at = new Date().toISOString()
      }
    }
    if (body.data.priority !== undefined) updateData.priority = body.data.priority
    if (body.data.assignedTo !== undefined) updateData.assigned_to = body.data.assignedTo
    if (body.data.dueDate !== undefined) updateData.due_date = body.data.dueDate
    if (body.data.photos !== undefined) updateData.photos = body.data.photos

    const { data, error } = await auth.admin
      .from('cases')
      .update(updateData)
      .eq('id', caseId)
      .eq('tenant_id', auth.tenantId)
      .select()
      .single()

    if (error) return apiError(error.message, 500)
    if (!data) return apiError('Ärende hittades inte', 404)

    return apiSuccess({ case: data })
  } catch (err) {
    return handleRouteError(err)
  }
}
```

- [ ] **Step 3: Write case comments route**

```typescript
// app/api/projects/[id]/cases/[caseId]/comments/route.ts
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuthAdmin, parseBody, apiSuccess, apiError, handleRouteError } from '@/lib/api'

const CreateCommentSchema = z.object({
  body: z.string().min(1, 'Kommentar krävs'),
  photos: z.array(z.string()).optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; caseId: string }> }
) {
  try {
    const { caseId } = await params
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    // Verify case belongs to tenant
    const { data: caseRecord } = await auth.admin
      .from('cases')
      .select('id')
      .eq('id', caseId)
      .eq('tenant_id', auth.tenantId)
      .single()

    if (!caseRecord) return apiError('Ärende hittades inte', 404)

    const body = await parseBody(request, CreateCommentSchema)
    if (body.error) return body.error

    const { data: emp } = await auth.admin
      .from('employees')
      .select('id')
      .eq('auth_user_id', auth.user.id)
      .eq('tenant_id', auth.tenantId)
      .single()

    const { data, error } = await auth.admin
      .from('case_comments')
      .insert({
        case_id: caseId,
        author_id: emp?.id || auth.user.id,
        body: body.data.body,
        photos: body.data.photos || [],
      })
      .select()
      .single()

    if (error) return apiError(error.message, 500)

    return apiSuccess({ comment: data }, 201)
  } catch (err) {
    return handleRouteError(err)
  }
}
```

- [ ] **Step 4: Verify build**

Run: `npx next build 2>&1 | grep -i error`
Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add app/api/projects/\[id\]/cases/
git commit -m "feat: add case CRUD, status transitions, and comments API routes"
```

---

## Task 9: Template Management API Routes

**Files:**
- Create: `app/api/templates/binders/route.ts`
- Create: `app/api/templates/binders/[id]/route.ts`
- Create: `app/api/templates/checklists/route.ts`
- Create: `app/api/templates/checklists/[id]/route.ts`

- [ ] **Step 1: Write binder templates CRUD**

```typescript
// app/api/templates/binders/route.ts
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuthAdmin, parseBody, apiSuccess, apiError, handleRouteError } from '@/lib/api'
import { canManageTemplates } from '@/lib/binders/permissions'

export async function GET(request: NextRequest) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { data, error } = await auth.admin
      .from('binder_templates')
      .select('id, name, description, structure, is_default, created_at')
      .eq('tenant_id', auth.tenantId)
      .order('name', { ascending: true })

    if (error) return apiError(error.message, 500)

    return apiSuccess({ templates: data || [] })
  } catch (err) {
    return handleRouteError(err)
  }
}

const CreateBinderTemplateSchema = z.object({
  name: z.string().min(1, 'Namn krävs'),
  description: z.string().optional(),
  structure: z.object({
    tabs: z.array(z.object({
      name: z.string().min(1),
      key: z.string().min(1),
      icon: z.string().optional(),
      restricted: z.boolean().default(false),
    })),
  }),
  isDefault: z.boolean().default(false),
})

export async function POST(request: NextRequest) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { data: emp } = await auth.admin
      .from('employees')
      .select('id, role')
      .eq('auth_user_id', auth.user.id)
      .eq('tenant_id', auth.tenantId)
      .single()

    if (!canManageTemplates(emp?.role ?? null)) {
      return apiError('Behörighet saknas', 403)
    }

    const body = await parseBody(request, CreateBinderTemplateSchema)
    if (body.error) return body.error

    // If setting as default, unset existing default
    if (body.data.isDefault) {
      await auth.admin
        .from('binder_templates')
        .update({ is_default: false })
        .eq('tenant_id', auth.tenantId)
        .eq('is_default', true)
    }

    const { data, error } = await auth.admin
      .from('binder_templates')
      .insert({
        tenant_id: auth.tenantId,
        name: body.data.name,
        description: body.data.description || null,
        structure: body.data.structure,
        is_default: body.data.isDefault,
        created_by: emp?.id || auth.user.id,
      })
      .select()
      .single()

    if (error) return apiError(error.message, 500)

    return apiSuccess({ template: data }, 201)
  } catch (err) {
    return handleRouteError(err)
  }
}
```

- [ ] **Step 2: Write binder template update/delete**

```typescript
// app/api/templates/binders/[id]/route.ts
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuthAdmin, parseBody, apiSuccess, apiError, handleRouteError } from '@/lib/api'
import { canManageTemplates } from '@/lib/binders/permissions'

const UpdateBinderTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  structure: z.object({
    tabs: z.array(z.object({
      name: z.string().min(1),
      key: z.string().min(1),
      icon: z.string().optional(),
      restricted: z.boolean().default(false),
    })),
  }).optional(),
  isDefault: z.boolean().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { data: emp } = await auth.admin
      .from('employees')
      .select('id, role')
      .eq('auth_user_id', auth.user.id)
      .eq('tenant_id', auth.tenantId)
      .single()

    if (!canManageTemplates(emp?.role ?? null)) {
      return apiError('Behörighet saknas', 403)
    }

    const body = await parseBody(request, UpdateBinderTemplateSchema)
    if (body.error) return body.error

    if (body.data.isDefault) {
      await auth.admin
        .from('binder_templates')
        .update({ is_default: false })
        .eq('tenant_id', auth.tenantId)
        .eq('is_default', true)
    }

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (body.data.name !== undefined) updateData.name = body.data.name
    if (body.data.description !== undefined) updateData.description = body.data.description
    if (body.data.structure !== undefined) updateData.structure = body.data.structure
    if (body.data.isDefault !== undefined) updateData.is_default = body.data.isDefault

    const { data, error } = await auth.admin
      .from('binder_templates')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', auth.tenantId)
      .select()
      .single()

    if (error) return apiError(error.message, 500)
    if (!data) return apiError('Mall hittades inte', 404)

    return apiSuccess({ template: data })
  } catch (err) {
    return handleRouteError(err)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { data: emp } = await auth.admin
      .from('employees')
      .select('id, role')
      .eq('auth_user_id', auth.user.id)
      .eq('tenant_id', auth.tenantId)
      .single()

    if (!canManageTemplates(emp?.role ?? null)) {
      return apiError('Behörighet saknas', 403)
    }

    const { error } = await auth.admin
      .from('binder_templates')
      .delete()
      .eq('id', id)
      .eq('tenant_id', auth.tenantId)

    if (error) return apiError(error.message, 500)

    return apiSuccess({ deleted: true })
  } catch (err) {
    return handleRouteError(err)
  }
}
```

- [ ] **Step 3: Write checklist templates CRUD**

```typescript
// app/api/templates/checklists/route.ts
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuthAdmin, parseBody, apiSuccess, apiError, handleRouteError } from '@/lib/api'
import { canCreateChecklistTemplates } from '@/lib/binders/permissions'

export async function GET(request: NextRequest) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const url = new URL(request.url)
    const category = url.searchParams.get('category')

    let query = auth.admin
      .from('checklist_templates')
      .select('id, name, description, category, structure, created_at')
      .eq('tenant_id', auth.tenantId)
      .order('category', { ascending: true })

    if (category) query = query.eq('category', category)

    const { data, error } = await query

    if (error) return apiError(error.message, 500)

    return apiSuccess({ templates: data || [] })
  } catch (err) {
    return handleRouteError(err)
  }
}

const CreateChecklistTemplateSchema = z.object({
  name: z.string().min(1, 'Namn krävs'),
  description: z.string().optional(),
  category: z.string().optional(),
  structure: z.object({
    sections: z.array(z.object({
      name: z.string().min(1),
      items: z.array(z.object({
        label: z.string().min(1),
        type: z.enum(['yes_no', 'measurement', 'dropdown', 'text']),
        config: z.record(z.unknown()).optional(),
      })),
    })),
  }),
})

export async function POST(request: NextRequest) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { data: emp } = await auth.admin
      .from('employees')
      .select('id, role')
      .eq('auth_user_id', auth.user.id)
      .eq('tenant_id', auth.tenantId)
      .single()

    if (!canCreateChecklistTemplates(emp?.role ?? null)) {
      return apiError('Behörighet saknas', 403)
    }

    const body = await parseBody(request, CreateChecklistTemplateSchema)
    if (body.error) return body.error

    const { data, error } = await auth.admin
      .from('checklist_templates')
      .insert({
        tenant_id: auth.tenantId,
        name: body.data.name,
        description: body.data.description || null,
        category: body.data.category || null,
        structure: body.data.structure,
        created_by: emp?.id || auth.user.id,
      })
      .select()
      .single()

    if (error) return apiError(error.message, 500)

    return apiSuccess({ template: data }, 201)
  } catch (err) {
    return handleRouteError(err)
  }
}
```

- [ ] **Step 4: Write checklist template update/delete**

```typescript
// app/api/templates/checklists/[id]/route.ts
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuthAdmin, parseBody, apiSuccess, apiError, handleRouteError } from '@/lib/api'
import { canCreateChecklistTemplates } from '@/lib/binders/permissions'

const UpdateChecklistTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  structure: z.object({
    sections: z.array(z.object({
      name: z.string().min(1),
      items: z.array(z.object({
        label: z.string().min(1),
        type: z.enum(['yes_no', 'measurement', 'dropdown', 'text']),
        config: z.record(z.unknown()).optional(),
      })),
    })),
  }).optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { data: emp } = await auth.admin
      .from('employees')
      .select('id, role')
      .eq('auth_user_id', auth.user.id)
      .eq('tenant_id', auth.tenantId)
      .single()

    if (!canCreateChecklistTemplates(emp?.role ?? null)) {
      return apiError('Behörighet saknas', 403)
    }

    const body = await parseBody(request, UpdateChecklistTemplateSchema)
    if (body.error) return body.error

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (body.data.name !== undefined) updateData.name = body.data.name
    if (body.data.description !== undefined) updateData.description = body.data.description
    if (body.data.category !== undefined) updateData.category = body.data.category
    if (body.data.structure !== undefined) updateData.structure = body.data.structure

    const { data, error } = await auth.admin
      .from('checklist_templates')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', auth.tenantId)
      .select()
      .single()

    if (error) return apiError(error.message, 500)
    if (!data) return apiError('Mall hittades inte', 404)

    return apiSuccess({ template: data })
  } catch (err) {
    return handleRouteError(err)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { data: emp } = await auth.admin
      .from('employees')
      .select('id, role')
      .eq('auth_user_id', auth.user.id)
      .eq('tenant_id', auth.tenantId)
      .single()

    if (!canCreateChecklistTemplates(emp?.role ?? null)) {
      return apiError('Behörighet saknas', 403)
    }

    const { error } = await auth.admin
      .from('checklist_templates')
      .delete()
      .eq('id', id)
      .eq('tenant_id', auth.tenantId)

    if (error) return apiError(error.message, 500)

    return apiSuccess({ deleted: true })
  } catch (err) {
    return handleRouteError(err)
  }
}
```

- [ ] **Step 5: Verify build**

Run: `npx next build 2>&1 | grep -i error`
Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add app/api/templates/
git commit -m "feat: add binder and checklist template management API routes"
```

---

## Task 10: Modify Existing Document Routes

**Files:**
- Modify: `app/api/projects/[id]/documents/route.ts`
- Modify: `app/api/projects/[id]/documents/upload/route.ts`

- [ ] **Step 1: Add binder_tab_id filter to documents list**

Read `app/api/projects/[id]/documents/route.ts` and add `binder_tab_id` query parameter support to the GET handler. Find the query builder section and add:

```typescript
const binderTabId = url.searchParams.get('binder_tab_id')
// ... existing query setup ...
if (binderTabId) query = query.eq('binder_tab_id', binderTabId)
```

- [ ] **Step 2: Add binder_tab_id to upload route**

Read `app/api/projects/[id]/documents/upload/route.ts` and add `binder_tab_id` to the document insert. Extract it from the form data or request body and include in the insert:

```typescript
const binderTabId = formData.get('binder_tab_id') as string | null
// ... in the insert object:
binder_tab_id: binderTabId || null,
```

- [ ] **Step 3: Verify build**

Run: `npx next build 2>&1 | grep -i error`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add app/api/projects/\[id\]/documents/
git commit -m "feat: add binder_tab_id support to existing document routes"
```

---

## Task 11: Photo Compression Utility

**Files:**
- Create: `app/lib/photos/compress.ts`

- [ ] **Step 1: Write the client-side image compression utility**

```typescript
// app/lib/photos/compress.ts
'use client'

const MAX_SIZE_BYTES = 2 * 1024 * 1024 // 2MB
const MAX_DIMENSION = 2048

/**
 * Compress an image file to max 2MB using canvas.
 * Returns the compressed file (or original if already small enough).
 */
export async function compressImage(file: File): Promise<File> {
  if (file.size <= MAX_SIZE_BYTES) return file

  const bitmap = await createImageBitmap(file)
  let { width, height } = bitmap

  // Scale down if too large
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height)
    width = Math.round(width * ratio)
    height = Math.round(height * ratio)
  }

  const canvas = new OffscreenCanvas(width, height)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas context not available')

  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  // Try quality levels until under 2MB
  for (const quality of [0.8, 0.6, 0.4, 0.2]) {
    const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality })
    if (blob.size <= MAX_SIZE_BYTES) {
      return new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })
    }
  }

  // Last resort: lowest quality
  const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.1 })
  return new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })
}
```

- [ ] **Step 2: Commit**

```bash
git add app/lib/photos/compress.ts
git commit -m "feat: add client-side image compression utility (max 2MB)"
```

---

## Task 12: Sidebar Navigation Updates

**Files:**
- Modify: `app/components/SidebarClient.tsx`

- [ ] **Step 1: Add new navigation items**

Read `app/components/SidebarClient.tsx` and add these items to the appropriate nav groups:

Under the `'PROJEKT'` group, after the existing "Dokument" item, add:
```typescript
{ label: 'Egenkontroller', href: '/checklists', icon: ClipboardCheck, roles: ['admin', 'supervisor', 'worker'] },
{ label: 'Ärenden', href: '/cases', icon: AlertCircle, roles: ['admin', 'supervisor', 'worker'] },
```

Under the settings-related group (or create one if needed), add:
```typescript
{ label: 'Mallar', href: '/settings/templates', icon: LayoutTemplate, roles: ['admin'] },
```

Add the imports at the top:
```typescript
import { ClipboardCheck, AlertCircle, LayoutTemplate } from 'lucide-react'
```

- [ ] **Step 2: Verify build**

Run: `npx next build 2>&1 | grep -i error`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add app/components/SidebarClient.tsx
git commit -m "feat: add Egenkontroller, Ärenden, and Mallar to sidebar navigation"
```

---

## Task 13: Binder Browser Page (Rework Documents Page)

**Files:**
- Modify: `app/projects/[id]/documents/page.tsx`

- [ ] **Step 1: Rework the documents page to binder browser**

Read the current `app/projects/[id]/documents/page.tsx` and rewrite it. The new layout:

- Left panel: List of binders fetched from `/api/projects/{id}/binders`. Each binder is expandable to show its tabs. Clicking a tab sets it as active.
- Right panel: Documents in the active tab, fetched from `/api/projects/{id}/documents?binder_tab_id={tabId}`. Reuse the existing file list, upload, search, and version history UI.
- Top bar: "Ny pärm" button (opens modal — name + optional template picker), "Från mall" dropdown.
- When no binder exists: show empty state with "Skapa din första pärm" CTA.

Key implementation points:
- Fetch binders on mount: `apiFetch(\`/api/projects/${projectId}/binders\`)`
- State: `activeBinder`, `activeTab`, `documents`, `binders`
- Upload form must include `binder_tab_id` in FormData
- Check `canAccessTab()` from permissions helper for restricted tabs
- Preserve existing document features: drag-drop upload, file type icons, version history modal, search

The page is large (~400 lines currently). Keep the same overall structure but replace the hardcoded `BSAB_FOLDERS` sidebar with the dynamic binder/tab list.

- [ ] **Step 2: Verify build**

Run: `npx next build 2>&1 | grep -i error`
Expected: No errors.

- [ ] **Step 3: Test manually**

Open the app, navigate to a project's documents page. Verify:
- Binders load in the left panel
- Clicking a tab loads documents
- Upload works with binder_tab_id
- Restricted tabs hidden for non-admin users

- [ ] **Step 4: Commit**

```bash
git add app/projects/\[id\]/documents/page.tsx
git commit -m "feat: rework documents page into binder browser with dynamic tabs"
```

---

## Task 14: Checklist Overview Page

**Files:**
- Create: `app/projects/[id]/checklists/page.tsx`

- [ ] **Step 1: Write the checklist overview page**

```typescript
// app/projects/[id]/checklists/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTenant } from '@/context/TenantContext'
import { useAdmin } from '@/hooks/useAdmin'
import { apiFetch } from '@/lib/http/fetcher'
import { toast } from '@/lib/toast'
import Sidebar from '@/components/Sidebar'

interface Checklist {
  id: string
  name: string
  status: 'draft' | 'in_progress' | 'completed' | 'signed_off'
  assigned_to: string | null
  template_id: string | null
  signed_by: string | null
  signed_at: string | null
  created_at: string
}

interface ChecklistTemplate {
  id: string
  name: string
  category: string | null
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: 'Utkast', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
  in_progress: { label: 'Pågående', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  completed: { label: 'Klar', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  signed_off: { label: 'Signerad', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
}

export default function ChecklistsPage() {
  const router = useRouter()
  const { id: projectId } = useParams<{ id: string }>()
  const { tenantId } = useTenant()
  const { isAdmin, role } = useAdmin()

  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('')

  useEffect(() => {
    if (!tenantId || !projectId) return
    fetchChecklists()
    fetchTemplates()
  }, [tenantId, projectId])

  async function fetchChecklists() {
    try {
      const url = statusFilter
        ? `/api/projects/${projectId}/checklists?status=${statusFilter}`
        : `/api/projects/${projectId}/checklists`
      const res = await apiFetch(url)
      setChecklists(res.checklists || [])
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function fetchTemplates() {
    try {
      const res = await apiFetch('/api/templates/checklists')
      setTemplates(res.templates || [])
    } catch {
      // Templates may not exist yet
    }
  }

  async function handleCreateChecklist(templateId: string) {
    try {
      const res = await apiFetch(`/api/projects/${projectId}/checklists`, {
        method: 'POST',
        body: JSON.stringify({ templateId }),
      })
      setShowTemplateModal(false)
      router.push(`/projects/${projectId}/checklists/${res.checklistId}`)
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  useEffect(() => {
    if (tenantId && projectId) fetchChecklists()
  }, [statusFilter])

  if (!tenantId) return null

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      <Sidebar />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Egenkontroller</h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Kvalitetskontroller för projektet</p>
            </div>
            <button
              onClick={() => setShowTemplateModal(true)}
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-[8px] text-sm font-medium transition-colors"
            >
              Ny egenkontroll
            </button>
          </div>

          {/* Status filter */}
          <div className="flex gap-2 mb-6">
            {[
              { value: '', label: 'Alla' },
              { value: 'draft', label: 'Utkast' },
              { value: 'in_progress', label: 'Pågående' },
              { value: 'completed', label: 'Klara' },
              { value: 'signed_off', label: 'Signerade' },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`px-3 py-1.5 text-sm rounded-[8px] transition-colors ${
                  statusFilter === f.value
                    ? 'bg-primary-500 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Loading */}
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mx-auto" />
            </div>
          )}

          {/* Empty state */}
          {!loading && checklists.length === 0 && (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-[8px] border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Inga egenkontroller ännu</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Skapa en ny egenkontroll från en mall</p>
            </div>
          )}

          {/* Checklist list */}
          {!loading && checklists.length > 0 && (
            <div className="space-y-3">
              {checklists.map((cl) => {
                const statusInfo = STATUS_LABELS[cl.status] || STATUS_LABELS.draft
                return (
                  <div
                    key={cl.id}
                    onClick={() => router.push(`/projects/${projectId}/checklists/${cl.id}`)}
                    className="bg-white dark:bg-gray-800 rounded-[8px] border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{cl.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {new Date(cl.created_at).toLocaleDateString('sv-SE')}
                        </p>
                      </div>
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Template picker modal */}
          {showTemplateModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-[8px] p-6 w-full max-w-md mx-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Välj mall</h2>
                {templates.length === 0 ? (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Inga mallar skapade ännu. Skapa en mall under Inställningar → Mallar.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {templates.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => handleCreateChecklist(t.id)}
                        className="w-full text-left p-3 rounded-[8px] border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="font-medium text-gray-900 dark:text-white">{t.name}</div>
                        {t.category && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t.category}</div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="mt-4 w-full py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  Avbryt
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npx next build 2>&1 | grep -i error`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add app/projects/\[id\]/checklists/page.tsx
git commit -m "feat: add checklist overview page with status filters and template picker"
```

---

## Task 15: Checklist Fill-In Page (Mobile-First)

**Files:**
- Create: `app/projects/[id]/checklists/[checklistId]/page.tsx`

- [ ] **Step 1: Write the mobile-first checklist fill-in page**

This is the most complex page. Key features:
- Section-by-section navigation with "Nästa"/"Föregående" buttons
- Large touch-target yes/no/NA toggles (green/red/grey)
- Measurement input with unit label
- Dropdown select
- Camera button per item using `<input type="file" accept="image/*" capture="environment">`
- Expandable comment field per item
- Failed item (Nej) → "Skapa ärende?" prompt
- Sticky bottom bar: progress + "Spara utkast" + "Slutför"
- Sign-off with HTML canvas signature pad
- localStorage draft persistence

Create the page at `app/projects/[id]/checklists/[checklistId]/page.tsx`. The page should:

1. Fetch checklist with items from `GET /api/projects/{projectId}/checklists/{checklistId}`
2. Group items by `section`
3. Track `activeSection` index (0-based)
4. Maintain local state for all item values/statuses
5. Save draft to localStorage on every change: key `checklist-draft-{checklistId}`
6. On load, check localStorage for draft and restore if found
7. On item update, call `PATCH /api/projects/{projectId}/checklists/{checklistId}/items/{itemId}`
8. On "Slutför", update checklist status to `completed`
9. On sign-off, show canvas signature pad, capture as base64, PATCH with `signatureData`

Use `compressImage()` from `app/lib/photos/compress.ts` before uploading photos.

The full page implementation should follow the patterns in `app/clients/page.tsx` for structure (Sidebar, main layout, dark mode) but use a mobile-first card-based layout for the checklist items.

- [ ] **Step 2: Verify build**

Run: `npx next build 2>&1 | grep -i error`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add app/projects/\[id\]/checklists/\[checklistId\]/page.tsx
git commit -m "feat: add mobile-first checklist fill-in page with draft persistence"
```

---

## Task 16: Case Kanban Board Page

**Files:**
- Create: `app/projects/[id]/cases/page.tsx`

- [ ] **Step 1: Write the kanban board page**

Create `app/projects/[id]/cases/page.tsx`. The page shows cases in 4 columns:

- **Ny** (new) — blue-gray header
- **Pågående** (in progress) — blue header
- **Åtgärdad** (resolved) — green header
- **Godkänd** (approved) — gold header

Each column shows case cards with: title, priority badge (color-coded), assignee initials avatar, due date if set, and a small icon indicating source type (clipboard for checklist, pen for annotation, user for manual).

Top bar: "Nytt ärende" button (quick-create modal — title, priority, optional photo), filters for priority and assignee.

Quick-create modal:
- Title input (required)
- Priority dropdown (default: medium)
- Photo capture button
- "Skapa" button

Clicking a card navigates to `/projects/{projectId}/cases/{caseId}`.

Fetch cases from `GET /api/projects/{projectId}/cases`. Group by `status`.

Follow the same page structure pattern (Sidebar + main, dark mode, Tailwind) as the other pages.

Priority badge colors:
- `low`: `bg-gray-100 text-gray-600`
- `medium`: `bg-yellow-100 text-yellow-700`
- `high`: `bg-orange-100 text-orange-700`
- `critical`: `bg-red-100 text-red-700`

- [ ] **Step 2: Verify build**

Run: `npx next build 2>&1 | grep -i error`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add app/projects/\[id\]/cases/page.tsx
git commit -m "feat: add case kanban board page with quick-create and priority filters"
```

---

## Task 17: Case Detail Page

**Files:**
- Create: `app/projects/[id]/cases/[caseId]/page.tsx`

- [ ] **Step 1: Write the case detail page**

Create `app/projects/[id]/cases/[caseId]/page.tsx`. Layout:

**Header section:**
- Title (editable inline for admin/supervisor)
- Status badge with "Nästa steg" button (advances status by one step)
- Priority dropdown
- Assignee dropdown (employees list)
- Due date picker
- Source link (if source_type is `checklist`, link to the checklist item; if `annotation`, link to the document)

**Body section:**
- Description (editable textarea)
- Photos grid (clickable to expand, + button to add more)

**Comment thread:**
- List of comments with author name, timestamp, and body
- "Lägg till kommentar" form at the bottom with text input + optional photo

Fetch case from `GET /api/projects/{projectId}/cases/{caseId}`.
Update via `PATCH /api/projects/{projectId}/cases/{caseId}`.
Add comments via `POST /api/projects/{projectId}/cases/{caseId}/comments`.

Use `canManageCases()` to conditionally show status/assignment controls.

- [ ] **Step 2: Verify build**

Run: `npx next build 2>&1 | grep -i error`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add app/projects/\[id\]/cases/\[caseId\]/page.tsx
git commit -m "feat: add case detail page with status workflow and comment thread"
```

---

## Task 18: Template Management Page

**Files:**
- Create: `app/settings/templates/page.tsx`

- [ ] **Step 1: Write the template management page**

Create `app/settings/templates/page.tsx`. Admin-only page with two tabs:

**Tab 1: Pärmmallar (Binder Templates)**
- List existing templates with name, description, default badge
- "Ny mall" button → editor modal
- Editor: name, description, is_default checkbox, dynamic tab list (add/remove/reorder tabs, each with name, key, icon dropdown, restricted checkbox)
- Edit/Delete buttons per template

**Tab 2: Checklistmallar (Checklist Templates)**
- List existing templates with name, category, item count
- "Ny mall" button → editor modal
- Editor: name, description, category dropdown, dynamic sections (add/remove sections, each with name and dynamic items list — each item has label, type dropdown, and type-specific config)
- Edit/Delete buttons per template

Use `apiFetch` for all CRUD operations against `/api/templates/binders` and `/api/templates/checklists`.

Guard the page with `useAdmin()` — redirect non-admins.

- [ ] **Step 2: Verify build**

Run: `npx next build 2>&1 | grep -i error`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add app/settings/templates/page.tsx
git commit -m "feat: add template management page for binder and checklist templates"
```

---

## Task 19: Deprecate Old Folder System

**Files:**
- Modify: `app/lib/documents/folders.ts`

- [ ] **Step 1: Add deprecation note**

Add a deprecation comment at the top of `app/lib/documents/folders.ts`:

```typescript
/**
 * @deprecated This module is kept for backwards compatibility during migration.
 * New code should use the binder system (app/lib/binders/templates.ts).
 * The BSAB folder structure is now managed as a binder template in the database.
 */
```

- [ ] **Step 2: Commit**

```bash
git add app/lib/documents/folders.ts
git commit -m "chore: deprecate hardcoded BSAB folder system in favor of binder templates"
```

---

## Task 20: Final Build Verification & Integration Test

- [ ] **Step 1: Run full build**

Run: `npx next build`
Expected: Build succeeds with no errors.

- [ ] **Step 2: Verify all new routes exist**

Run: `npx next build 2>&1 | grep -E "(binders|checklists|cases|templates)"`
Expected: All new routes appear in the build output.

- [ ] **Step 3: Check for TypeScript errors**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors.

- [ ] **Step 4: Run existing tests**

Run: `npm test 2>&1 | tail -20`
Expected: Existing tests pass. New functionality doesn't break anything.

- [ ] **Step 5: Commit any remaining changes**

```bash
git status
# Stage and commit any leftover changes
```
