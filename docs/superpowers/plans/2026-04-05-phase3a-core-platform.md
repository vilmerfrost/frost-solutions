# Phase 3A: Core Platform — Legal Fortress, Document Management, Customer Portal

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the three interconnected core features that make Frost Solutions the platform construction companies can't leave: mandatory ÄTA protection workflow (Legal Fortress), project document management (iBinder replacement), and an expanded customer portal with BankID approval.

**Architecture:** Build on the existing rot_applications/ÄTA 2.0 system (working) rather than the broken aeta_requests. Document management uses Supabase Storage with a `project_documents` table for metadata/versioning. Customer portal extends the existing public_links system with a full customer login flow.

**Tech Stack:** Next.js 16, Supabase (Storage + PostgreSQL), Idura/BankID (from Phase 2), Zod, React

---

## Task 1: ÄTA Legal Fortress — Database Schema

Create the database foundation for the mandatory ÄTA workflow with immutable audit trail.

**Files:**
- Create: `supabase/migrations/phase3a_legal_fortress.sql`

- [ ] **Step 1: Create the migration**

```sql
-- Phase 3A: Legal Fortress — ÄTA mandatory workflow + audit trail

-- Extend rot_applications with Legal Fortress fields
ALTER TABLE public.rot_applications
  ADD COLUMN IF NOT EXISTS ata_type TEXT CHECK (ata_type IN ('foreseen', 'unforeseen')),
  ADD COLUMN IF NOT EXISTS urgency TEXT DEFAULT 'normal' CHECK (urgency IN ('normal', 'urgent', 'critical')),
  ADD COLUMN IF NOT EXISTS timeline_impact_days INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS customer_approval_required BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS customer_approval_status TEXT DEFAULT 'pending' CHECK (customer_approval_status IN ('pending', 'sent', 'approved', 'rejected', 'expired')),
  ADD COLUMN IF NOT EXISTS customer_approval_token TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS customer_approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS customer_rejected_reason TEXT,
  ADD COLUMN IF NOT EXISTS signing_order_id UUID REFERENCES public.signing_orders(id),
  ADD COLUMN IF NOT EXISTS admin_pricing_notes TEXT,
  ADD COLUMN IF NOT EXISTS labor_hours NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS labor_rate_sek NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS created_by_employee_id UUID REFERENCES public.employees(id);

-- Immutable audit trail for ÄTA events
CREATE TABLE IF NOT EXISTS public.ata_audit_trail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  ata_id UUID NOT NULL REFERENCES public.rot_applications(id),
  event_type TEXT NOT NULL CHECK (event_type IN (
    'created', 'photos_added', 'admin_reviewed', 'pricing_set',
    'approval_sent', 'customer_approved', 'customer_rejected',
    'work_authorized', 'work_completed', 'invoice_generated',
    'signed_bankid', 'status_changed'
  )),
  actor_id TEXT NOT NULL,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('employee', 'customer', 'system')),
  data JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ata_audit_ata_id ON public.ata_audit_trail(ata_id);
CREATE INDEX idx_ata_audit_created ON public.ata_audit_trail(created_at);
ALTER TABLE public.ata_audit_trail ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation" ON public.ata_audit_trail
  FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);
CREATE POLICY "Service role full access" ON public.ata_audit_trail
  FOR ALL USING (auth.role() = 'service_role');

-- Project documents table for document management
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
  uploaded_by UUID REFERENCES public.employees(id),
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  is_required BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_project_docs_project ON public.project_documents(project_id);
CREATE INDEX idx_project_docs_folder ON public.project_documents(project_id, folder);
ALTER TABLE public.project_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation" ON public.project_documents
  FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);
CREATE POLICY "Service role full access" ON public.project_documents
  FOR ALL USING (auth.role() = 'service_role');

-- Document sharing for external parties
CREATE TABLE IF NOT EXISTS public.document_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  document_id UUID NOT NULL REFERENCES public.project_documents(id),
  access_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  shared_with_email TEXT,
  shared_with_name TEXT,
  permission TEXT NOT NULL DEFAULT 'view' CHECK (permission IN ('view', 'download')),
  expires_at TIMESTAMPTZ,
  password_hash TEXT,
  view_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES public.employees(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.document_shares ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation" ON public.document_shares
  FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);
CREATE POLICY "Service role full access" ON public.document_shares
  FOR ALL USING (auth.role() = 'service_role');

-- Customer portal users
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
CREATE POLICY "Service role full access" ON public.customer_portal_users
  FOR ALL USING (auth.role() = 'service_role');

-- Project messages (customer communication)
CREATE TABLE IF NOT EXISTS public.project_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  project_id UUID NOT NULL REFERENCES public.projects(id),
  sender_type TEXT NOT NULL CHECK (sender_type IN ('employee', 'customer')),
  sender_id UUID NOT NULL,
  sender_name TEXT NOT NULL,
  message TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_project_messages_project ON public.project_messages(project_id);
ALTER TABLE public.project_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation" ON public.project_messages
  FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);
CREATE POLICY "Service role full access" ON public.project_messages
  FOR ALL USING (auth.role() = 'service_role');
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/phase3a_legal_fortress.sql
git commit -m "feat: Phase 3A database schema — Legal Fortress, document management, customer portal"
```

---

## Task 2: ÄTA Legal Fortress — Mandatory Workflow API

Build the 6-step mandatory ÄTA workflow.

**Files:**
- Create: `app/lib/ata/workflow.ts`
- Create: `app/lib/ata/audit.ts`
- Create: `app/api/ata/v2/create/route.ts`
- Create: `app/api/ata/v2/[id]/review/route.ts`
- Create: `app/api/ata/v2/[id]/send-approval/route.ts`
- Create: `app/api/ata/v2/[id]/approve/route.ts`
- Create: `app/api/ata/v2/[id]/generate-invoice/route.ts`
- Create: `__tests__/lib/ata/workflow.test.ts`

- [ ] **Step 1: Create audit trail helper**

`app/lib/ata/audit.ts`:
```typescript
import { createAdminClient } from '@/utils/supabase/admin'

export async function logAtaEvent(params: {
  tenantId: string
  ataId: string
  eventType: string
  actorId: string
  actorType: 'employee' | 'customer' | 'system'
  data?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}) {
  const admin = createAdminClient()
  await admin.from('ata_audit_trail').insert({
    tenant_id: params.tenantId,
    ata_id: params.ataId,
    event_type: params.eventType,
    actor_id: params.actorId,
    actor_type: params.actorType,
    data: params.data ?? {},
    ip_address: params.ipAddress,
    user_agent: params.userAgent,
  })
}
```

- [ ] **Step 2: Create workflow validation**

`app/lib/ata/workflow.ts` — validates ÄTA state transitions:
- `created` → admin can review
- `admin_reviewed` → can send for approval
- `approval_sent` → customer can approve/reject
- `customer_approved` → work authorized
- `work_completed` → can generate invoice
- Unforeseen type REQUIRES at least 1 photo
- All transitions are logged to audit trail

Write tests in `__tests__/lib/ata/workflow.test.ts` covering valid and invalid transitions.

- [ ] **Step 3: Create v2 ÄTA API routes**

All routes use `resolveAuthAdmin` from `@/lib/api` and log to audit trail.

**POST `/api/ata/v2/create`** — Worker creates ÄTA:
- Validates: project_id, description, ata_type (foreseen/unforeseen)
- If unforeseen: requires `photos` array with at least 1 photo
- Creates rot_applications record with status='created'
- Logs 'created' audit event

**POST `/api/ata/v2/[id]/review`** — Admin reviews and sets pricing:
- Validates: labor_hours, labor_rate_sek, material_cost_sek, timeline_impact_days
- Updates rot_applications with pricing
- Logs 'admin_reviewed' + 'pricing_set' audit events

**POST `/api/ata/v2/[id]/send-approval`** — Send for customer approval:
- Generates customer_approval_token (crypto random)
- Creates BankID signing order via Idura (from Phase 2)
- Sends notification (email or public link)
- Updates status to 'approval_sent'
- Logs 'approval_sent' audit event

**POST `/api/ata/v2/[id]/approve`** — Customer approves (public endpoint):
- Token-based auth (customer_approval_token)
- Updates customer_approval_status to 'approved'
- Logs 'customer_approved' with IP, user agent
- If BankID was used, logs 'signed_bankid'

**POST `/api/ata/v2/[id]/generate-invoice`** — Auto-generate invoice:
- Creates invoice from ÄTA data (labor + materials)
- Links to rot_applications via invoice_id
- Attaches all audit trail as documentation
- Logs 'invoice_generated'

- [ ] **Step 4: Run tests, commit**

```bash
pnpm test && pnpm typecheck
git add app/lib/ata/ app/api/ata/v2/ __tests__/lib/ata/
git commit -m "feat: Legal Fortress — mandatory ÄTA workflow with audit trail and BankID"
```

---

## Task 3: Document Management — API

Build BSAB folder structure, file versioning, and search.

**Files:**
- Create: `app/lib/documents/folders.ts`
- Create: `app/api/projects/[id]/documents/route.ts`
- Create: `app/api/projects/[id]/documents/upload/route.ts`
- Create: `app/api/projects/[id]/documents/[docId]/route.ts`
- Create: `app/api/projects/[id]/documents/[docId]/versions/route.ts`
- Create: `app/api/projects/[id]/documents/share/route.ts`

- [ ] **Step 1: Define BSAB folder structure**

`app/lib/documents/folders.ts`:
```typescript
export const BSAB_FOLDERS = [
  { key: '01-Ritningar', name: 'Ritningar', icon: 'blueprint', subfolders: ['A-Arkitekt', 'K-Konstruktion', 'E-El', 'VS-VVS'] },
  { key: '02-Beskrivningar', name: 'Beskrivningar', icon: 'file-text' },
  { key: '03-Administrativt', name: 'Administrativt', icon: 'folder', subfolders: ['Tillstånd', 'Mötesprotokoll', 'Tidplaner'] },
  { key: '04-Avtal', name: 'Avtal', icon: 'file-lock', restricted: true },
  { key: '05-Ekonomi', name: 'Ekonomi', icon: 'banknote', restricted: true },
  { key: '06-Foton', name: 'Foton', icon: 'camera', subfolders: ['Före', 'Under', 'Efter'] },
  { key: '07-KMA', name: 'KMA', icon: 'shield-check' },
] as const

export type FolderKey = typeof BSAB_FOLDERS[number]['key']

export function getFolderConfig(key: string) {
  return BSAB_FOLDERS.find(f => f.key === key)
}

export function isRestrictedFolder(key: string): boolean {
  const folder = getFolderConfig(key)
  return folder ? 'restricted' in folder && folder.restricted === true : false
}
```

- [ ] **Step 2: Create document CRUD routes**

**GET/POST `/api/projects/[id]/documents`** — List documents (with folder filter) and upload metadata.

**GET/DELETE `/api/projects/[id]/documents/[docId]`** — Get/delete document.

**GET `/api/projects/[id]/documents/[docId]/versions`** — List all versions.

**POST `/api/projects/[id]/documents/upload`** — Upload file to Supabase Storage bucket `project-documents`, create project_documents record. On duplicate filename in same folder: auto-increment version, link to previous via `previous_version_id`.

**POST `/api/projects/[id]/documents/share`** — Create document_shares record with access token.

All routes use `resolveAuthAdmin`, validate with Zod, check folder permissions (restricted folders require admin role).

- [ ] **Step 3: Commit**

```bash
git add app/lib/documents/ app/api/projects/[id]/documents/
git commit -m "feat: document management with BSAB folders, versioning, and sharing"
```

---

## Task 4: Customer Portal — Login + Dashboard API

Expand the customer portal from public links to a full login experience.

**Files:**
- Create: `app/api/portal/auth/login/route.ts`
- Create: `app/api/portal/auth/register/route.ts`
- Create: `app/api/portal/dashboard/route.ts`
- Create: `app/api/portal/projects/[id]/route.ts`
- Create: `app/api/portal/projects/[id]/messages/route.ts`
- Create: `app/api/portal/ata/[id]/approve/route.ts`
- Create: `app/lib/portal/auth.ts`

- [ ] **Step 1: Create portal auth**

`app/lib/portal/auth.ts` — simple token-based auth for customer portal users:
- `createPortalSession(email, password)` — verifies credentials, returns JWT
- `verifyPortalSession(token)` — validates JWT, returns customer_portal_user
- Uses bcryptjs for password hashing (already a dependency)

- [ ] **Step 2: Create portal API routes**

**POST `/api/portal/auth/login`** — email + password login, returns session token.

**POST `/api/portal/auth/register`** — register customer (invited by tenant, must have matching client_id).

**GET `/api/portal/dashboard`** — returns all projects for the customer's client_id, with latest status and unread message count.

**GET `/api/portal/projects/[id]`** — project details visible to customer: status, progress, documents (non-restricted folders only), invoices, quotes.

**GET/POST `/api/portal/projects/[id]/messages`** — message thread between contractor and customer.

**POST `/api/portal/ata/[id]/approve`** — approve ÄTA with optional BankID signing (integrates with Idura from Phase 2).

- [ ] **Step 3: Commit**

```bash
git add app/api/portal/ app/lib/portal/
git commit -m "feat: customer portal with login, dashboard, messaging, and ÄTA approval"
```

---

## Task 5: Integration — Wire It All Together

Connect Legal Fortress, documents, and portal so they work as one system.

**Files:**
- Modify: `app/api/ata/v2/[id]/send-approval/route.ts`
- Create: `app/api/ata/v2/[id]/documents/route.ts`

- [ ] **Step 1: ÄTA → Document linking**

Create `app/api/ata/v2/[id]/documents/route.ts`:
- GET: list documents attached to this ÄTA
- POST: attach existing project document or upload new one to ÄTA

When an ÄTA is created, auto-create a folder entry under `07-KMA/ÄTA-{id}` in the project document structure.

- [ ] **Step 2: ÄTA → Portal notification**

When send-approval is called, also create a project_message notifying the customer that an ÄTA needs their approval, with a link to the portal approval page.

- [ ] **Step 3: Final verification**

```bash
pnpm typecheck && pnpm test
```

- [ ] **Step 4: Commit**

```bash
git add app/api/ata/v2/ app/api/portal/
git commit -m "feat: wire Legal Fortress, document management, and customer portal together"
```

---

## Completion Criteria

- [ ] `ata_audit_trail` table exists with RLS
- [ ] `project_documents` table with versioning support
- [ ] `document_shares` table for external sharing
- [ ] `customer_portal_users` table for portal login
- [ ] `project_messages` table for communication
- [ ] ÄTA v2 workflow: create → review → send-approval → approve → generate-invoice
- [ ] Audit trail logs every ÄTA state change with actor, timestamp, IP
- [ ] Unforeseen ÄTA requires photos
- [ ] BankID signing integrated into ÄTA approval flow
- [ ] BSAB folder structure defined
- [ ] Document upload with auto-versioning
- [ ] Document sharing with access tokens
- [ ] Customer portal: login, dashboard, project view, messaging
- [ ] Portal ÄTA approval endpoint
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test` passes
