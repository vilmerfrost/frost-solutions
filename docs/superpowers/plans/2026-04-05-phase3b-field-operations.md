# Phase 3B: Field & Operations — Drawing Markup, Safety, Scheduling, Subcontractors

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 4 field-worker modules: drawing markup (Bluebeam Lite), safety & compliance (SSG replacement), team scheduling, and subcontractor management.

**Architecture:** Drawing markup stores annotations as JSON on project_documents. Safety uses new tables for certificates, incidents, and site inductions. Scheduling builds on existing schedules table. Subcontractors are a new entity with F-skatt verification.

**Tech Stack:** Next.js 16, Supabase, Zod, PDF.js (drawing viewer — frontend, future task)

---

## Task 1: Database Schema

**Files:**
- Create: `supabase/migrations/phase3b_field_operations.sql`

- [ ] **Step 1: Create migration with all 4 module tables**

```sql
-- Phase 3B: Field & Operations

-- Drawing annotations on documents
CREATE TABLE IF NOT EXISTS public.document_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  document_id UUID NOT NULL REFERENCES public.project_documents(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL DEFAULT 1,
  annotation_type TEXT NOT NULL CHECK (annotation_type IN ('cloud', 'arrow', 'text', 'highlight', 'measurement', 'pin')),
  data JSONB NOT NULL,
  created_by UUID REFERENCES public.employees(id),
  work_order_id UUID REFERENCES public.work_orders(id),
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_doc_annotations_doc ON public.document_annotations(document_id);
ALTER TABLE public.document_annotations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation" ON public.document_annotations FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);
CREATE POLICY "Service role" ON public.document_annotations FOR ALL USING (auth.role() = 'service_role');

-- Employee certificates (safety compliance)
CREATE TABLE IF NOT EXISTS public.employee_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  employee_id UUID NOT NULL REFERENCES public.employees(id),
  certificate_type TEXT NOT NULL,
  certificate_name TEXT NOT NULL,
  issuer TEXT,
  issued_date DATE,
  expiry_date DATE,
  document_url TEXT,
  status TEXT NOT NULL DEFAULT 'valid' CHECK (status IN ('valid', 'expiring_soon', 'expired', 'revoked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_certs_employee ON public.employee_certificates(employee_id);
CREATE INDEX idx_certs_expiry ON public.employee_certificates(expiry_date);
ALTER TABLE public.employee_certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation" ON public.employee_certificates FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);
CREATE POLICY "Service role" ON public.employee_certificates FOR ALL USING (auth.role() = 'service_role');

-- Safety incidents
CREATE TABLE IF NOT EXISTS public.safety_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  project_id UUID REFERENCES public.projects(id),
  reported_by UUID NOT NULL REFERENCES public.employees(id),
  incident_type TEXT NOT NULL CHECK (incident_type IN ('accident', 'near_miss', 'hazard', 'observation')),
  severity TEXT NOT NULL DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,
  location TEXT,
  photos TEXT[] DEFAULT '{}',
  corrective_actions TEXT,
  status TEXT NOT NULL DEFAULT 'reported' CHECK (status IN ('reported', 'investigating', 'resolved', 'closed')),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.employees(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_incidents_project ON public.safety_incidents(project_id);
ALTER TABLE public.safety_incidents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation" ON public.safety_incidents FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);
CREATE POLICY "Service role" ON public.safety_incidents FOR ALL USING (auth.role() = 'service_role');

-- Site inductions
CREATE TABLE IF NOT EXISTS public.site_inductions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  project_id UUID NOT NULL REFERENCES public.projects(id),
  employee_id UUID NOT NULL REFERENCES public.employees(id),
  inducted_by UUID REFERENCES public.employees(id),
  signed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, employee_id)
);
ALTER TABLE public.site_inductions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation" ON public.site_inductions FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);
CREATE POLICY "Service role" ON public.site_inductions FOR ALL USING (auth.role() = 'service_role');

-- Subcontractors
CREATE TABLE IF NOT EXISTS public.subcontractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  company_name TEXT NOT NULL,
  org_number TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  f_skatt_verified BOOLEAN DEFAULT false,
  f_skatt_verified_at TIMESTAMPTZ,
  insurance_verified BOOLEAN DEFAULT false,
  insurance_expiry DATE,
  notes TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.subcontractors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation" ON public.subcontractors FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);
CREATE POLICY "Service role" ON public.subcontractors FOR ALL USING (auth.role() = 'service_role');

-- Subcontractor project assignments
CREATE TABLE IF NOT EXISTS public.subcontractor_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  subcontractor_id UUID NOT NULL REFERENCES public.subcontractors(id),
  project_id UUID NOT NULL REFERENCES public.projects(id),
  scope TEXT,
  budget_sek NUMERIC(12,2),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'terminated')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(subcontractor_id, project_id)
);
ALTER TABLE public.subcontractor_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation" ON public.subcontractor_assignments FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);
CREATE POLICY "Service role" ON public.subcontractor_assignments FOR ALL USING (auth.role() = 'service_role');

-- Extend schedules with conflict detection fields
ALTER TABLE public.schedules
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id),
  ADD COLUMN IF NOT EXISTS shift_type TEXT DEFAULT 'regular' CHECK (shift_type IN ('regular', 'overtime', 'on_call'));
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/phase3b_field_operations.sql
git commit -m "feat: Phase 3B database schema — annotations, safety, scheduling, subcontractors"
```

---

## Task 2: Drawing Markup API

Store and retrieve annotations on project documents. Frontend rendering (PDF.js) is a future task — this is the data layer.

**Files:**
- Create: `app/api/projects/[id]/documents/[docId]/annotations/route.ts`

- [ ] **Step 1: Create annotations CRUD**

GET: list annotations for document (optionally filter by page)
POST: create annotation with Zod validation

```typescript
const AnnotationSchema = z.object({
  page_number: z.number().int().positive().default(1),
  annotation_type: z.enum(['cloud', 'arrow', 'text', 'highlight', 'measurement', 'pin']),
  data: z.record(z.unknown()),  // position, dimensions, text content, measurement values
  work_order_id: z.string().uuid().optional(),
})
```

DELETE: remove annotation by ID (same route with annotation_id param)

- [ ] **Step 2: Commit**

```bash
git add app/api/projects/[id]/documents/[docId]/annotations/
git commit -m "feat: drawing markup annotations API (cloud, arrow, text, pin, measurement)"
```

---

## Task 3: Safety & Compliance API

Certificate tracking, incident reporting, site inductions.

**Files:**
- Create: `app/api/safety/certificates/route.ts`
- Create: `app/api/safety/certificates/[id]/route.ts`
- Create: `app/api/safety/certificates/expiring/route.ts`
- Create: `app/api/safety/incidents/route.ts`
- Create: `app/api/safety/incidents/[id]/route.ts`
- Create: `app/api/projects/[id]/inductions/route.ts`

- [ ] **Step 1: Certificate CRUD**

GET/POST `/api/safety/certificates` — list/create employee certificates
GET/PUT/DELETE `/api/safety/certificates/[id]` — single certificate ops
GET `/api/safety/certificates/expiring` — certificates expiring within 30 days

Auto-update status: if expiry_date < now → 'expired', if expiry_date < now+30d → 'expiring_soon'

- [ ] **Step 2: Incident reporting**

GET/POST `/api/safety/incidents` — list/report incidents with photos
GET/PUT `/api/safety/incidents/[id]` — view/update (resolve, add corrective actions)

- [ ] **Step 3: Site inductions**

GET/POST `/api/projects/[id]/inductions` — list who's inducted, sign new induction
Check: employee can't be double-inducted (UNIQUE constraint handles this)

- [ ] **Step 4: Commit**

```bash
git add app/api/safety/ app/api/projects/[id]/inductions/
git commit -m "feat: safety & compliance — certificates, incidents, site inductions"
```

---

## Task 4: Team Scheduling API

Drag-and-drop scheduling with conflict detection.

**Files:**
- Modify: `app/api/schedules/route.ts` (add conflict detection)
- Create: `app/api/schedules/conflicts/check/route.ts`

- [ ] **Step 1: Add conflict detection**

Create `app/api/schedules/conflicts/check/route.ts`:
POST with `{ employee_id, start_date, end_date, exclude_schedule_id? }` — returns conflicting schedules.

- [ ] **Step 2: Modify schedule creation to check conflicts**

In `/api/schedules/route.ts` POST handler, before inserting:
- Query existing schedules for the same employee overlapping the date range
- If conflicts found, return `apiError('Schedule conflict', 409, { conflicts })` 
- Allow override with `force: true` in body

- [ ] **Step 3: Commit**

```bash
git add app/api/schedules/
git commit -m "feat: team scheduling with conflict detection"
```

---

## Task 5: Subcontractor Management API

CRUD + F-skatt verification + project assignment.

**Files:**
- Create: `app/api/subcontractors/route.ts`
- Create: `app/api/subcontractors/[id]/route.ts`
- Create: `app/api/subcontractors/[id]/assignments/route.ts`
- Create: `app/api/subcontractors/[id]/verify-fskatt/route.ts`

- [ ] **Step 1: Subcontractor CRUD**

GET/POST `/api/subcontractors` — list/create
GET/PUT/DELETE `/api/subcontractors/[id]` — single ops

- [ ] **Step 2: Project assignments**

GET/POST `/api/subcontractors/[id]/assignments` — assign to project with scope and budget

- [ ] **Step 3: F-skatt verification stub**

POST `/api/subcontractors/[id]/verify-fskatt` — currently returns a stub response (Skatteverket F-skatt API requires organizational certificate). Mark `f_skatt_verified` and `f_skatt_verified_at` in DB. Log result.

- [ ] **Step 4: Commit**

```bash
git add app/api/subcontractors/
git commit -m "feat: subcontractor management with assignments and F-skatt verification stub"
```

---

## Completion Criteria

- [ ] 7 new tables with RLS (annotations, certificates, incidents, inductions, subcontractors, assignments, + schedule extensions)
- [ ] Drawing annotations CRUD on project documents
- [ ] Certificate tracking with expiry alerts
- [ ] Incident reporting with severity levels
- [ ] Site induction sign-off per project/employee
- [ ] Schedule conflict detection
- [ ] Subcontractor CRUD + project assignments
- [ ] F-skatt verification stub
- [ ] `pnpm typecheck` and `pnpm test` pass
