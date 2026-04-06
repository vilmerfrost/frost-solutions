# Contracts Feature Rebuild — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the placeholder contracts page with a fully functional contract management system — database-backed CRUD, line items, editable legal templates, PDF generation, and BankID signing.

**Architecture:** New `contracts` + `contract_items` tables following the quotes pattern. API routes using `resolveAuthAdmin()` + `parseBody()` + `apiSuccess()`/`apiError()` helpers. React pages with `apiFetch` and `useCallback`/`useState` hooks (matching the existing non-React-Query pattern used on the current contracts page). PDF via `@react-pdf/renderer`.

**Tech Stack:** Next.js 16, Supabase (Postgres + RLS), Zod, react-pdf, Idura/Criipto signing, TypeScript

**Note:** Run `supabase db push` after creating migration files to apply them to the remote database.

---

## Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/20260407200000_contracts_system.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- Contracts system: contracts + contract_items tables

-- contracts table
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id),
  client_id UUID REFERENCES clients(id),
  contract_type TEXT NOT NULL CHECK (contract_type IN ('client', 'subcontractor')),
  template_id TEXT,
  contract_number TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  sections JSONB DEFAULT '[]'::jsonb,
  counterparty_name TEXT,
  subtotal NUMERIC(12,2) DEFAULT 0,
  tax_amount NUMERIC(12,2) DEFAULT 0,
  total_amount NUMERIC(12,2) DEFAULT 0,
  start_date DATE,
  end_date DATE,
  valid_until DATE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','signed','active','completed','cancelled')),
  signed_pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY contracts_select ON contracts FOR SELECT
  USING (tenant_id = (current_setting('request.jwt.claims', true)::json ->> 'tenant_id')::uuid);
CREATE POLICY contracts_insert ON contracts FOR INSERT
  WITH CHECK (tenant_id = (current_setting('request.jwt.claims', true)::json ->> 'tenant_id')::uuid);
CREATE POLICY contracts_update ON contracts FOR UPDATE
  USING (tenant_id = (current_setting('request.jwt.claims', true)::json ->> 'tenant_id')::uuid);
CREATE POLICY contracts_delete ON contracts FOR DELETE
  USING (tenant_id = (current_setting('request.jwt.claims', true)::json ->> 'tenant_id')::uuid);

-- Indexes
CREATE INDEX idx_contracts_tenant ON contracts(tenant_id);
CREATE INDEX idx_contracts_tenant_status ON contracts(tenant_id, status);
CREATE INDEX idx_contracts_project ON contracts(project_id);
CREATE INDEX idx_contracts_client ON contracts(client_id);

-- contract_items table
CREATE TABLE IF NOT EXISTS contract_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL DEFAULT 'labor' CHECK (item_type IN ('material','labor','other')),
  description TEXT NOT NULL,
  quantity NUMERIC(10,2) DEFAULT 1,
  unit TEXT DEFAULT 'st',
  unit_price NUMERIC(12,2) DEFAULT 0,
  vat_rate NUMERIC(5,2) DEFAULT 25.00,
  line_total NUMERIC(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE contract_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY contract_items_select ON contract_items FOR SELECT
  USING (contract_id IN (SELECT id FROM contracts WHERE tenant_id = (current_setting('request.jwt.claims', true)::json ->> 'tenant_id')::uuid));
CREATE POLICY contract_items_insert ON contract_items FOR INSERT
  WITH CHECK (contract_id IN (SELECT id FROM contracts WHERE tenant_id = (current_setting('request.jwt.claims', true)::json ->> 'tenant_id')::uuid));
CREATE POLICY contract_items_update ON contract_items FOR UPDATE
  USING (contract_id IN (SELECT id FROM contracts WHERE tenant_id = (current_setting('request.jwt.claims', true)::json ->> 'tenant_id')::uuid));
CREATE POLICY contract_items_delete ON contract_items FOR DELETE
  USING (contract_id IN (SELECT id FROM contracts WHERE tenant_id = (current_setting('request.jwt.claims', true)::json ->> 'tenant_id')::uuid));

CREATE INDEX idx_contract_items_contract ON contract_items(contract_id);

-- Auto-generate contract numbers
CREATE OR REPLACE FUNCTION generate_contract_number(p_tenant_id UUID)
RETURNS TEXT AS $$
DECLARE
  current_year TEXT;
  seq_num INT;
BEGIN
  current_year := to_char(now(), 'YYYY');
  SELECT COALESCE(MAX(
    CAST(NULLIF(regexp_replace(contract_number, '^AVT-' || current_year || '-', ''), contract_number) AS INT)
  ), 0) + 1
  INTO seq_num
  FROM contracts
  WHERE tenant_id = p_tenant_id
    AND contract_number LIKE 'AVT-' || current_year || '-%';
  RETURN 'AVT-' || current_year || '-' || LPAD(seq_num::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;
```

- [ ] **Step 2: Push migration to Supabase**

Run: `supabase db push`
Expected: Migration applied successfully.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260407200000_contracts_system.sql
git commit -m "feat: add contracts and contract_items database tables"
```

---

## Task 2: TypeScript Types

**Files:**
- Create: `app/types/contracts.ts`

- [ ] **Step 1: Create types file**

```typescript
// app/types/contracts.ts

export type ContractStatus = 'draft' | 'sent' | 'signed' | 'active' | 'completed' | 'cancelled'

export type ContractType = 'client' | 'subcontractor'

export type ContractItemType = 'material' | 'labor' | 'other'

export interface ContractSection {
  title: string
  content: string
}

export interface Contract {
  id: string
  tenant_id: string
  project_id?: string | null
  client_id?: string | null
  contract_type: ContractType
  template_id?: string | null
  contract_number: string
  title: string
  description?: string | null
  sections: ContractSection[]
  counterparty_name?: string | null
  subtotal: number
  tax_amount: number
  total_amount: number
  start_date?: string | null
  end_date?: string | null
  valid_until?: string | null
  status: ContractStatus
  signed_pdf_url?: string | null
  created_at: string
  updated_at: string

  // Relations (loaded via select joins)
  items?: ContractItem[]
  client?: { id: string; name: string; email?: string } | null
  project?: { id: string; name: string } | null
}

export interface ContractItem {
  id: string
  contract_id: string
  item_type: ContractItemType
  description: string
  quantity: number
  unit: string
  unit_price: number
  vat_rate: number
  line_total?: number
  sort_order: number
  created_at?: string
}

export interface ContractFilters {
  status?: ContractStatus
  contract_type?: ContractType
  search?: string
  page?: number
  limit?: number
}

export interface ContractMeta {
  page: number
  limit: number
  count: number
  totalPages?: number
}
```

- [ ] **Step 2: Commit**

```bash
git add app/types/contracts.ts
git commit -m "feat: add contract TypeScript types"
```

---

## Task 3: Contract Templates (update existing)

**Files:**
- Modify: `app/lib/ata/contract-templates.ts`

- [ ] **Step 1: Add the two new practical templates to the existing file**

Append after the `CONSUMER_TEMPLATE` constant and before the `CONTRACT_TEMPLATES` array:

```typescript
// ---------------------------------------------------------------------------
// Simple Client Contract — Enkel kundavtal
// ---------------------------------------------------------------------------

export const SIMPLE_CLIENT_TEMPLATE: ContractTemplate = {
  id: 'simple-client',
  name: 'Enkel kundavtal',
  standard: 'consumer',
  description:
    'Forenklat avtal for kund-uppdrag. Omfattar parter, arbetsbeskrivning, pris, tidplan och garanti.',
  sections: [
    {
      title: '1. Parter',
      content:
        'Bestallare: {{client_name}}\n' +
        'Entreprenor: {{contractor_name}}\n\n' +
        'Projektet avser: {{project_name}}',
      required: true,
    },
    {
      title: '2. Arbetsbeskrivning',
      content:
        'Entreprenoren ska utfora foljande arbeten:\n\n' +
        '[Beskriv arbetet har — material, metod, omfattning]\n\n' +
        'Arbetet utfors pa: [adress]',
      required: true,
    },
    {
      title: '3. Pris och betalning',
      content:
        'Overenskommet pris: {{contract_sum}} SEK exklusive moms.\n\n' +
        'Betalningsvillkor:\n' +
        '- 30% vid kontraktsskrivning\n' +
        '- 40% vid halvfardigt arbete\n' +
        '- 30% vid godkand slutbesiktning\n\n' +
        'Betalning sker inom 30 dagar fran fakturadatum.',
      required: true,
    },
    {
      title: '4. Tidplan',
      content:
        'Arbetet paborjas: {{start_date}}\n' +
        'Beraknad fardighallning: {{end_date}}\n\n' +
        'Vid forsening som inte beror pa bestallaren har bestallaren ratt till skadestand.',
      required: true,
    },
    {
      title: '5. Garanti',
      content:
        'Entreprenoren garanterar utfort arbete i tva (2) ar fran godkand slutbesiktning.\n' +
        'Garantin omfattar bade arbete och material.\n' +
        'Reklamation ska ske skriftligen inom skalig tid fran det att felet upptacktes.',
      required: true,
    },
    {
      title: '6. Ovrigt',
      content:
        'Andringar och tillagg till detta avtal ska godkannas skriftligen av bada parter.\n' +
        'Tvister avgorande sker genom forhandling i forsta hand, darefter allman domstol.',
      required: true,
    },
  ],
}

// ---------------------------------------------------------------------------
// Subcontractor Agreement — Underentreprenorsavtal
// ---------------------------------------------------------------------------

export const SUBCONTRACTOR_TEMPLATE: ContractTemplate = {
  id: 'subcontractor',
  name: 'Underentreprenorsavtal',
  standard: 'AB04',
  description:
    'Avtal for underentreprenorer. Omfattar uppdrag, ersattning, forsakring, arbetsmiljo och uppsagning.',
  sections: [
    {
      title: '1. Parter',
      content:
        'Huvudentreprenor: {{contractor_name}}\n' +
        'Underentreprenor: [UE-foretag]\n' +
        'Org.nr: [UE org.nr]\n\n' +
        'Projektet avser: {{project_name}}\n' +
        'Bestallare: {{client_name}}',
      required: true,
    },
    {
      title: '2. Uppdragsbeskrivning',
      content:
        'Underentreprenoren ska utfora foljande arbeten:\n\n' +
        '[Beskriv uppdraget i detalj — ytor, material, metoder]\n\n' +
        'Arbetet ska utforas fackmannamassigt och i enlighet med gaellande branschregler.',
      required: true,
    },
    {
      title: '3. Ersattning och betalning',
      content:
        'Overenskommen ersattning: {{contract_sum}} SEK exklusive moms.\n\n' +
        'Fakturering sker manadsvis baserat pa utfort arbete.\n' +
        'Betalningsvillkor: 30 dagar netto.\n' +
        'Underentreprenoren ska ha godkand F-skattsedel.',
      required: true,
    },
    {
      title: '4. Tid och tillganglighet',
      content:
        'Arbetet paborjas: {{start_date}}\n' +
        'Beraknad fardighallning: {{end_date}}\n\n' +
        'Underentreprenoren ska folja huvudentreprenarens tidplan.\n' +
        'Forsening ska meddelas omedelbart och kan medfora viteskrav.',
      required: true,
    },
    {
      title: '5. Forsakring och ansvar',
      content:
        'Underentreprenoren ska inneha:\n' +
        '- Ansvarsforsakring (minst 5 MSEK)\n' +
        '- Allriskforsakring for eget arbete och material\n' +
        '- Olycksfallsforsakring for egen personal\n\n' +
        'Bevis pa forsakring ska uppvisas fore arbetets start.',
      required: true,
    },
    {
      title: '6. Arbetsmiljo och KMA',
      content:
        'Underentreprenoren ska:\n' +
        '- Folja huvudentreprenarens arbetsmiljoplan\n' +
        '- Tillhandahalla egen skyddsutrustning\n' +
        '- Delta i skyddsronder och byggmoten\n' +
        '- Rapportera tillbud och olyckor omedelbart\n' +
        '- Ha ID06-kort for all personal pa arbetsplatsen',
      required: true,
    },
    {
      title: '7. Uppsagning',
      content:
        'Avtalet kan sagas upp med 14 dagars skriftligt varsel.\n' +
        'Vid uppsagning har underentreprenoren ratt till ersattning for utfort arbete.\n' +
        'Huvudentreprenoren har ratt att hava avtalet med omedelbar verkan vid vasentligt avtalsbrott.',
      required: true,
    },
  ],
}
```

Then update the `CONTRACT_TEMPLATES` array:

```typescript
export const CONTRACT_TEMPLATES: ContractTemplate[] = [
  AB04_TEMPLATE,
  ABT06_TEMPLATE,
  CONSUMER_TEMPLATE,
  SIMPLE_CLIENT_TEMPLATE,
  SUBCONTRACTOR_TEMPLATE,
]
```

- [ ] **Step 2: Commit**

```bash
git add app/lib/ata/contract-templates.ts
git commit -m "feat: add simple client and subcontractor contract templates"
```

---

## Task 4: API Client

**Files:**
- Create: `app/lib/api/contracts.ts`

- [ ] **Step 1: Create API client class**

```typescript
// app/lib/api/contracts.ts
import { apiFetch } from '@/lib/http/fetcher'
import type { Contract, ContractItem, ContractFilters, ContractMeta } from '@/types/contracts'

interface ApiResponse<T> {
  success?: boolean
  data?: T
  meta?: ContractMeta
  error?: string
}

export class ContractsAPI {
  static async list(filters?: ContractFilters): Promise<{ data: Contract[]; meta: ContractMeta }> {
    const params = new URLSearchParams()
    if (filters?.status) params.set('status', filters.status)
    if (filters?.contract_type) params.set('contract_type', filters.contract_type)
    if (filters?.search) params.set('search', filters.search)
    if (filters?.page) params.set('page', String(filters.page))
    if (filters?.limit) params.set('limit', String(filters.limit))

    const result = await apiFetch<ApiResponse<Contract[]>>(`/api/contracts?${params}`)
    return {
      data: result.data || [],
      meta: result.meta || { page: 1, limit: 20, count: 0 },
    }
  }

  static async get(id: string): Promise<Contract> {
    const result = await apiFetch<ApiResponse<Contract>>(`/api/contracts/${id}`)
    if (!result.data) throw new Error('No contract data returned')
    return result.data
  }

  static async create(data: Partial<Contract> & { items?: Partial<ContractItem>[] }): Promise<Contract> {
    const result = await apiFetch<ApiResponse<Contract>>('/api/contracts', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    if (!result.data) throw new Error('No contract data returned')
    return result.data
  }

  static async update(id: string, data: Partial<Contract>): Promise<Contract> {
    const result = await apiFetch<ApiResponse<Contract>>(`/api/contracts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    if (!result.data) throw new Error('No contract data returned')
    return result.data
  }

  static async remove(id: string): Promise<void> {
    await apiFetch(`/api/contracts/${id}`, { method: 'DELETE' })
  }

  static async addItem(contractId: string, item: Partial<ContractItem>): Promise<ContractItem> {
    const result = await apiFetch<ApiResponse<ContractItem>>(`/api/contracts/${contractId}/items`, {
      method: 'POST',
      body: JSON.stringify(item),
    })
    if (!result.data) throw new Error('No item data returned')
    return result.data
  }

  static async updateItem(contractId: string, item: Partial<ContractItem> & { id: string }): Promise<ContractItem> {
    const result = await apiFetch<ApiResponse<ContractItem>>(`/api/contracts/${contractId}/items`, {
      method: 'PUT',
      body: JSON.stringify(item),
    })
    if (!result.data) throw new Error('No item data returned')
    return result.data
  }

  static async deleteItem(contractId: string, itemId: string): Promise<void> {
    await apiFetch(`/api/contracts/${contractId}/items`, {
      method: 'DELETE',
      body: JSON.stringify({ itemId }),
    })
  }

  static async send(id: string, signatories?: Array<{ reference: string }>): Promise<{
    orderId: string
    signatories: Array<{ id: string; reference: string; signingUrl: string }>
  }> {
    const result = await apiFetch<ApiResponse<any>>(`/api/contracts/${id}/send`, {
      method: 'POST',
      body: JSON.stringify({ signatories }),
    })
    if (!result.data) throw new Error('Failed to send for signing')
    return result.data
  }

  static pdfUrl(id: string): string {
    return `/api/contracts/${id}/pdf`
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/lib/api/contracts.ts
git commit -m "feat: add contracts API client"
```

---

## Task 5: API Routes — List & Create

**Files:**
- Rewrite: `app/api/contracts/route.ts` (currently exports from templates route — delete old content)
- Delete: `app/api/contracts/generate/route.ts`
- Delete: `app/api/contracts/templates/route.ts`

- [ ] **Step 1: Delete old routes**

```bash
rm app/api/contracts/generate/route.ts app/api/contracts/templates/route.ts
```

Remove the `generate` and `templates` directories if empty.

- [ ] **Step 2: Rewrite `app/api/contracts/route.ts`**

```typescript
// app/api/contracts/route.ts
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuthAdmin, apiSuccess, apiError, handleRouteError } from '@/lib/api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ListSchema = z.object({
  status: z.string().optional(),
  contract_type: z.enum(['client', 'subcontractor']).optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
})

const CreateSchema = z.object({
  contract_type: z.enum(['client', 'subcontractor']),
  template_id: z.string().optional().nullable(),
  title: z.string().min(1, 'Titel kravs'),
  description: z.string().optional().nullable(),
  sections: z.array(z.object({ title: z.string(), content: z.string() })).optional().default([]),
  project_id: z.string().uuid().optional().nullable(),
  client_id: z.string().uuid().optional().nullable(),
  counterparty_name: z.string().optional().nullable(),
  subtotal: z.number().optional().default(0),
  tax_amount: z.number().optional().default(0),
  total_amount: z.number().optional().default(0),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  valid_until: z.string().optional().nullable(),
  items: z.array(z.object({
    item_type: z.enum(['material', 'labor', 'other']).default('labor'),
    description: z.string().min(1),
    quantity: z.number().default(1),
    unit: z.string().default('st'),
    unit_price: z.number().default(0),
    vat_rate: z.number().default(25),
    sort_order: z.number().default(0),
  })).optional().default([]),
})

export async function GET(req: NextRequest) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const raw = Object.fromEntries(req.nextUrl.searchParams.entries())
    const parsed = ListSchema.safeParse(raw)
    if (!parsed.success) {
      return apiError('Invalid query parameters', 400, {
        issues: parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`),
      })
    }

    const { status, contract_type, search, page, limit } = parsed.data
    const from = (page - 1) * limit
    const to = from + limit - 1

    let q = auth.admin
      .from('contracts')
      .select('*, client:clients(id, name)', { count: 'exact' })
      .eq('tenant_id', auth.tenantId)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (status) q = q.eq('status', status)
    if (contract_type) q = q.eq('contract_type', contract_type)
    if (search) q = q.or(`title.ilike.%${search}%,contract_number.ilike.%${search}%,counterparty_name.ilike.%${search}%`)

    const { data, error, count } = await q
    if (error) throw error

    return apiSuccess({
      data: data ?? [],
      meta: { page, limit, count: count ?? 0, totalPages: Math.ceil((count ?? 0) / limit) },
    })
  } catch (e) {
    return handleRouteError(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    let body: unknown
    try { body = await req.json() } catch { return apiError('Invalid JSON', 400) }

    const parsed = CreateSchema.safeParse(body)
    if (!parsed.success) {
      return apiError('Validation failed', 400, {
        issues: parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`),
      })
    }

    const { items, ...contractData } = parsed.data

    // Generate contract number
    const { data: numResult } = await auth.admin.rpc('generate_contract_number', {
      p_tenant_id: auth.tenantId,
    })
    const contractNumber = numResult || `AVT-${new Date().getFullYear()}-001`

    const { data: contract, error: insertError } = await auth.admin
      .from('contracts')
      .insert({
        ...contractData,
        tenant_id: auth.tenantId,
        contract_number: contractNumber,
        status: 'draft',
      })
      .select()
      .single()

    if (insertError) throw insertError

    // Insert items if provided
    if (items.length > 0) {
      const itemRows = items.map((item, i) => ({
        contract_id: contract.id,
        item_type: item.item_type,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unit_price,
        vat_rate: item.vat_rate,
        sort_order: item.sort_order ?? i,
      }))

      const { error: itemsError } = await auth.admin
        .from('contract_items')
        .insert(itemRows)

      if (itemsError) {
        console.error('Failed to insert contract items:', itemsError)
      }
    }

    // Fetch complete contract with items
    const { data: complete } = await auth.admin
      .from('contracts')
      .select('*, client:clients(id, name), items:contract_items(*)')
      .eq('id', contract.id)
      .single()

    return apiSuccess(complete ?? contract, 201)
  } catch (e) {
    return handleRouteError(e)
  }
}
```

- [ ] **Step 3: Verify build**

Run: `npx next build --no-lint 2>&1 | head -30` (or just check for TypeScript errors)
Expected: No errors in the contracts route.

- [ ] **Step 4: Commit**

```bash
git add -A app/api/contracts/
git commit -m "feat: add contracts list and create API routes"
```

---

## Task 6: API Routes — Single Contract CRUD

**Files:**
- Create: `app/api/contracts/[id]/route.ts`

- [ ] **Step 1: Create the route**

```typescript
// app/api/contracts/[id]/route.ts
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuthAdmin, apiSuccess, apiError, handleRouteError } from '@/lib/api'

export const runtime = 'nodejs'

const UpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  sections: z.array(z.object({ title: z.string(), content: z.string() })).optional(),
  contract_type: z.enum(['client', 'subcontractor']).optional(),
  project_id: z.string().uuid().nullable().optional(),
  client_id: z.string().uuid().nullable().optional(),
  counterparty_name: z.string().nullable().optional(),
  subtotal: z.number().optional(),
  tax_amount: z.number().optional(),
  total_amount: z.number().optional(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  valid_until: z.string().nullable().optional(),
  status: z.enum(['draft', 'sent', 'signed', 'active', 'completed', 'cancelled']).optional(),
}).strict()

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { data: contract, error } = await auth.admin
      .from('contracts')
      .select('*, client:clients(id, name, email), project:projects(id, name)')
      .eq('id', id)
      .eq('tenant_id', auth.tenantId)
      .maybeSingle()

    if (error) throw error
    if (!contract) return apiError('Contract not found', 404)

    // Fetch items
    const { data: items } = await auth.admin
      .from('contract_items')
      .select('*')
      .eq('contract_id', id)
      .order('sort_order', { ascending: true })

    return apiSuccess({ ...contract, items: items ?? [] })
  } catch (e) {
    return handleRouteError(e)
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    let body: unknown
    try { body = await req.json() } catch { return apiError('Invalid JSON', 400) }

    const parsed = UpdateSchema.safeParse(body)
    if (!parsed.success) {
      return apiError('Validation failed', 400, {
        issues: parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`),
      })
    }

    // Verify exists
    const { data: existing } = await auth.admin
      .from('contracts')
      .select('id, status')
      .eq('id', id)
      .eq('tenant_id', auth.tenantId)
      .maybeSingle()

    if (!existing) return apiError('Contract not found', 404)

    // Only allow editing drafts
    if (existing.status !== 'draft' && !parsed.data.status) {
      return apiError('Only draft contracts can be edited', 400)
    }

    const { data: updated, error } = await auth.admin
      .from('contracts')
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('tenant_id', auth.tenantId)
      .select()
      .single()

    if (error) throw error

    return apiSuccess(updated)
  } catch (e) {
    return handleRouteError(e)
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { data: existing } = await auth.admin
      .from('contracts')
      .select('id, status')
      .eq('id', id)
      .eq('tenant_id', auth.tenantId)
      .maybeSingle()

    if (!existing) return apiSuccess({ deleted: true })

    if (existing.status === 'signed' || existing.status === 'active') {
      return apiError('Cannot delete signed or active contracts', 400)
    }

    const { error } = await auth.admin
      .from('contracts')
      .delete()
      .eq('id', id)
      .eq('tenant_id', auth.tenantId)

    if (error) throw error

    return apiSuccess({ deleted: true })
  } catch (e) {
    return handleRouteError(e)
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/contracts/[id]/route.ts
git commit -m "feat: add single contract GET/PUT/DELETE routes"
```

---

## Task 7: API Routes — Contract Items

**Files:**
- Create: `app/api/contracts/[id]/items/route.ts`

- [ ] **Step 1: Create the items route**

```typescript
// app/api/contracts/[id]/items/route.ts
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuthAdmin, apiSuccess, apiError, handleRouteError } from '@/lib/api'

export const runtime = 'nodejs'

const AddItemSchema = z.object({
  item_type: z.enum(['material', 'labor', 'other']).default('labor'),
  description: z.string().min(1, 'Beskrivning kravs'),
  quantity: z.number().default(1),
  unit: z.string().default('st'),
  unit_price: z.number().default(0),
  vat_rate: z.number().default(25),
  sort_order: z.number().default(0),
})

const UpdateItemSchema = z.object({
  id: z.string().uuid(),
  item_type: z.enum(['material', 'labor', 'other']).optional(),
  description: z.string().min(1).optional(),
  quantity: z.number().optional(),
  unit: z.string().optional(),
  unit_price: z.number().optional(),
  vat_rate: z.number().optional(),
  sort_order: z.number().optional(),
})

const DeleteItemSchema = z.object({
  itemId: z.string().uuid(),
})

async function verifyContractOwnership(admin: any, contractId: string, tenantId: string) {
  const { data } = await admin
    .from('contracts')
    .select('id')
    .eq('id', contractId)
    .eq('tenant_id', tenantId)
    .maybeSingle()
  return !!data
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contractId } = await params
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    if (!(await verifyContractOwnership(auth.admin, contractId, auth.tenantId))) {
      return apiError('Contract not found', 404)
    }

    const { data, error } = await auth.admin
      .from('contract_items')
      .select('*')
      .eq('contract_id', contractId)
      .order('sort_order', { ascending: true })

    if (error) throw error

    return apiSuccess(data ?? [])
  } catch (e) {
    return handleRouteError(e)
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contractId } = await params
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    if (!(await verifyContractOwnership(auth.admin, contractId, auth.tenantId))) {
      return apiError('Contract not found', 404)
    }

    let body: unknown
    try { body = await req.json() } catch { return apiError('Invalid JSON', 400) }

    const parsed = AddItemSchema.safeParse(body)
    if (!parsed.success) {
      return apiError('Validation failed', 400, {
        issues: parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`),
      })
    }

    const { data, error } = await auth.admin
      .from('contract_items')
      .insert({ ...parsed.data, contract_id: contractId })
      .select()
      .single()

    if (error) throw error

    return apiSuccess(data, 201)
  } catch (e) {
    return handleRouteError(e)
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contractId } = await params
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    if (!(await verifyContractOwnership(auth.admin, contractId, auth.tenantId))) {
      return apiError('Contract not found', 404)
    }

    let body: unknown
    try { body = await req.json() } catch { return apiError('Invalid JSON', 400) }

    const parsed = UpdateItemSchema.safeParse(body)
    if (!parsed.success) {
      return apiError('Validation failed', 400, {
        issues: parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`),
      })
    }

    const { id: itemId, ...updateData } = parsed.data

    const { data, error } = await auth.admin
      .from('contract_items')
      .update(updateData)
      .eq('id', itemId)
      .eq('contract_id', contractId)
      .select()
      .single()

    if (error) throw error

    return apiSuccess(data)
  } catch (e) {
    return handleRouteError(e)
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contractId } = await params
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    let body: unknown
    try { body = await req.json() } catch { return apiError('Invalid JSON', 400) }

    const parsed = DeleteItemSchema.safeParse(body)
    if (!parsed.success) {
      return apiError('Validation failed', 400)
    }

    const { error } = await auth.admin
      .from('contract_items')
      .delete()
      .eq('id', parsed.data.itemId)
      .eq('contract_id', contractId)

    if (error) throw error

    return apiSuccess({ deleted: true })
  } catch (e) {
    return handleRouteError(e)
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/contracts/[id]/items/route.ts
git commit -m "feat: add contract items CRUD API route"
```

---

## Task 8: PDF Template & Route

**Files:**
- Create: `app/lib/pdf/contract-template.tsx`
- Create: `app/api/contracts/[id]/pdf/route.ts`

- [ ] **Step 1: Create the react-pdf template**

```tsx
// app/lib/pdf/contract-template.tsx
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica' },
  header: { marginBottom: 24 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 11, color: '#666', marginBottom: 16 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  metaLabel: { fontWeight: 'bold', width: 130 },
  metaValue: { flex: 1 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', marginTop: 16, marginBottom: 6, borderBottomWidth: 1, borderBottomColor: '#e5e5e5', paddingBottom: 4 },
  sectionBody: { fontSize: 10, lineHeight: 1.5, whiteSpace: 'pre-wrap' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f5f5f5', fontWeight: 'bold', paddingVertical: 6, paddingHorizontal: 4, marginTop: 16 },
  tableRow: { flexDirection: 'row', paddingVertical: 5, paddingHorizontal: 4, borderBottomWidth: 0.5, borderBottomColor: '#eee' },
  colDesc: { flex: 3 },
  colQty: { flex: 1, textAlign: 'right' },
  colUnit: { flex: 1, textAlign: 'center' },
  colPrice: { flex: 1.5, textAlign: 'right' },
  colTotal: { flex: 1.5, textAlign: 'right' },
  totalsRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 },
  totalsLabel: { width: 120, textAlign: 'right', fontWeight: 'bold', paddingRight: 8 },
  totalsValue: { width: 100, textAlign: 'right' },
  totalsFinal: { fontWeight: 'bold', fontSize: 12 },
  signatureBlock: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 48 },
  signatureCol: { width: '45%' },
  signatureLine: { borderBottomWidth: 1, borderBottomColor: '#333', marginTop: 40, marginBottom: 4 },
  signatureLabel: { fontSize: 9, color: '#666' },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, fontSize: 8, color: '#999', textAlign: 'center' },
})

function fmt(n: number): string {
  return new Intl.NumberFormat('sv-SE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
}

function fmtDate(d?: string | null): string {
  if (!d) return '—'
  return new Intl.DateTimeFormat('sv-SE').format(new Date(d))
}

interface ContractPDFProps {
  contract: {
    contract_number: string
    title: string
    description?: string | null
    contract_type: string
    counterparty_name?: string | null
    start_date?: string | null
    end_date?: string | null
    subtotal: number
    tax_amount: number
    total_amount: number
    sections: Array<{ title: string; content: string }>
    client?: { name: string } | null
    project?: { name: string } | null
  }
  items: Array<{
    description: string
    quantity: number
    unit: string
    unit_price: number
    line_total?: number
  }>
  tenantName: string
}

export function ContractPDF({ contract, items, tenantName }: ContractPDFProps) {
  const counterparty = contract.counterparty_name || contract.client?.name || '—'

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{contract.title}</Text>
          <Text style={styles.subtitle}>{contract.contract_number}</Text>

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Entreprenor:</Text>
            <Text style={styles.metaValue}>{tenantName}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>
              {contract.contract_type === 'subcontractor' ? 'Underentreprenor:' : 'Bestallare:'}
            </Text>
            <Text style={styles.metaValue}>{counterparty}</Text>
          </View>
          {contract.project && (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Projekt:</Text>
              <Text style={styles.metaValue}>{contract.project.name}</Text>
            </View>
          )}
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Startdatum:</Text>
            <Text style={styles.metaValue}>{fmtDate(contract.start_date)}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Slutdatum:</Text>
            <Text style={styles.metaValue}>{fmtDate(contract.end_date)}</Text>
          </View>
        </View>

        {/* Description */}
        {contract.description && (
          <View>
            <Text style={styles.sectionTitle}>Arbetsbeskrivning</Text>
            <Text style={styles.sectionBody}>{contract.description}</Text>
          </View>
        )}

        {/* Line Items */}
        {items.length > 0 && (
          <View>
            <View style={styles.tableHeader}>
              <Text style={styles.colDesc}>Beskrivning</Text>
              <Text style={styles.colQty}>Antal</Text>
              <Text style={styles.colUnit}>Enhet</Text>
              <Text style={styles.colPrice}>A-pris</Text>
              <Text style={styles.colTotal}>Summa</Text>
            </View>
            {items.map((item, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={styles.colDesc}>{item.description}</Text>
                <Text style={styles.colQty}>{item.quantity}</Text>
                <Text style={styles.colUnit}>{item.unit}</Text>
                <Text style={styles.colPrice}>{fmt(item.unit_price)}</Text>
                <Text style={styles.colTotal}>{fmt(item.line_total ?? item.quantity * item.unit_price)}</Text>
              </View>
            ))}

            {/* Totals */}
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Netto:</Text>
              <Text style={styles.totalsValue}>{fmt(contract.subtotal)} SEK</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Moms:</Text>
              <Text style={styles.totalsValue}>{fmt(contract.tax_amount)} SEK</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={[styles.totalsLabel, styles.totalsFinal]}>Totalt:</Text>
              <Text style={[styles.totalsValue, styles.totalsFinal]}>{fmt(contract.total_amount)} SEK</Text>
            </View>
          </View>
        )}

        {/* Legal Sections */}
        {contract.sections.map((sec, i) => (
          <View key={i}>
            <Text style={styles.sectionTitle}>{sec.title}</Text>
            <Text style={styles.sectionBody}>{sec.content}</Text>
          </View>
        ))}

        {/* Signature Blocks */}
        <View style={styles.signatureBlock}>
          <View style={styles.signatureCol}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>{tenantName}</Text>
            <Text style={styles.signatureLabel}>Datum: _______________</Text>
          </View>
          <View style={styles.signatureCol}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>{counterparty}</Text>
            <Text style={styles.signatureLabel}>Datum: _______________</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          {contract.contract_number} | Genererad {fmtDate(new Date().toISOString())}
        </Text>
      </Page>
    </Document>
  )
}
```

- [ ] **Step 2: Create the PDF API route**

```typescript
// app/api/contracts/[id]/pdf/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { resolveAuthAdmin, apiError, handleRouteError } from '@/lib/api'
import { ContractPDF } from '@/lib/pdf/contract-template'

export const runtime = 'nodejs'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { data: contract, error: cErr } = await auth.admin
      .from('contracts')
      .select('*, client:clients(id, name), project:projects(id, name)')
      .eq('id', id)
      .eq('tenant_id', auth.tenantId)
      .maybeSingle()

    if (cErr || !contract) return apiError('Contract not found', 404)

    const { data: items } = await auth.admin
      .from('contract_items')
      .select('*')
      .eq('contract_id', id)
      .order('sort_order', { ascending: true })

    // Get tenant name
    const { data: tenant } = await auth.admin
      .from('tenants')
      .select('name')
      .eq('id', auth.tenantId)
      .single()

    const pdfBuffer = await renderToBuffer(
      <ContractPDF
        contract={contract}
        items={items ?? []}
        tenantName={tenant?.name ?? 'Foretag'}
      />
    )

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="avtal-${contract.contract_number}.pdf"`,
      },
    })
  } catch (e) {
    return handleRouteError(e)
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add app/lib/pdf/contract-template.tsx app/api/contracts/[id]/pdf/route.ts
git commit -m "feat: add contract PDF template and download route"
```

---

## Task 9: Signing Route

**Files:**
- Create: `app/api/contracts/[id]/send/route.ts`
- Modify: `app/api/signing/webhook/route.ts`

- [ ] **Step 1: Create the send-for-signing route**

```typescript
// app/api/contracts/[id]/send/route.ts
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { renderToBuffer } from '@react-pdf/renderer'
import { resolveAuthAdmin, apiSuccess, apiError, handleRouteError } from '@/lib/api'
import { createSigningOrder } from '@/lib/signing/idura-client'
import { ContractPDF } from '@/lib/pdf/contract-template'

export const runtime = 'nodejs'

const SendSchema = z.object({
  signatories: z.array(z.object({ reference: z.string().min(1) })).min(1),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    let body: unknown
    try { body = await req.json() } catch { return apiError('Invalid JSON', 400) }

    const parsed = SendSchema.safeParse(body)
    if (!parsed.success) {
      return apiError('Ange minst en mottagare', 400)
    }

    // Fetch contract
    const { data: contract, error: cErr } = await auth.admin
      .from('contracts')
      .select('*, client:clients(id, name), project:projects(id, name)')
      .eq('id', id)
      .eq('tenant_id', auth.tenantId)
      .maybeSingle()

    if (cErr || !contract) return apiError('Contract not found', 404)
    if (contract.status !== 'draft') {
      return apiError('Only draft contracts can be sent for signing', 400)
    }

    // Fetch items
    const { data: items } = await auth.admin
      .from('contract_items')
      .select('*')
      .eq('contract_id', id)
      .order('sort_order', { ascending: true })

    // Get tenant name
    const { data: tenant } = await auth.admin
      .from('tenants')
      .select('name')
      .eq('id', auth.tenantId)
      .single()

    // Generate PDF
    const pdfBuffer = await renderToBuffer(
      <ContractPDF
        contract={contract}
        items={items ?? []}
        tenantName={tenant?.name ?? 'Foretag'}
      />
    )

    const pdfBase64 = Buffer.from(pdfBuffer).toString('base64')
    const appUrl = process.env.NEXT_PUBLIC_APP_URL
      ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

    // Create Idura signing order
    const order = await createSigningOrder({
      documentTitle: `Avtal ${contract.contract_number} — ${contract.title}`,
      documentPdfBase64: pdfBase64,
      signatories: parsed.data.signatories,
      webhookUrl: `${appUrl}/api/signing/webhook`,
    })

    // Save signing order
    await auth.admin.from('signing_orders').insert({
      tenant_id: auth.tenantId,
      document_type: 'contract',
      document_id: id,
      idura_order_id: order.id,
      status: 'pending',
      signatories: order.signatories.map((s: any) => ({
        id: s.id,
        reference: s.reference,
        status: s.status,
        href: s.href,
      })),
    })

    // Update contract status
    await auth.admin
      .from('contracts')
      .update({ status: 'sent', updated_at: new Date().toISOString() })
      .eq('id', id)

    return apiSuccess({
      orderId: order.id,
      signatories: order.signatories.map((s: any) => ({
        id: s.id,
        reference: s.reference,
        signingUrl: s.href,
      })),
    })
  } catch (e) {
    return handleRouteError(e)
  }
}
```

- [ ] **Step 2: Update webhook to sync contract status**

In `app/api/signing/webhook/route.ts`, after the line `await admin.from('signing_orders').update({...}).eq('id', order.id)` in the `SIGNATORY_SIGNED` case where `allSigned` is true, add contract status sync:

```typescript
        // After updating signing_orders to 'signed' status:
        // Sync contract status if this is a contract signing
        if (order.document_type === 'contract') {
          await admin
            .from('contracts')
            .update({
              status: 'signed',
              signed_pdf_url: signedPdfUrl,
              updated_at: new Date().toISOString(),
            })
            .eq('id', order.document_id)
        }
```

And in the `SIGNATORY_REJECTED` case, after updating signing_orders:

```typescript
        if (order.document_type === 'contract') {
          await admin
            .from('contracts')
            .update({
              status: 'draft',
              updated_at: new Date().toISOString(),
            })
            .eq('id', order.document_id)
        }
```

And in the `SIGNATURE_ORDER_EXPIRED` case:

```typescript
        if (order.document_type === 'contract') {
          await admin
            .from('contracts')
            .update({
              status: 'draft',
              updated_at: new Date().toISOString(),
            })
            .eq('id', order.document_id)
        }
```

- [ ] **Step 3: Commit**

```bash
git add app/api/contracts/[id]/send/route.ts app/api/signing/webhook/route.ts
git commit -m "feat: add contract signing route and webhook sync"
```

---

## Task 10: Contracts List Page

**Files:**
- Rewrite: `app/contracts/page.tsx`

- [ ] **Step 1: Rewrite the contracts list page**

```tsx
// app/contracts/page.tsx
'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { useTenant } from '@/context/TenantContext'
import { ContractsAPI } from '@/lib/api/contracts'
import type { Contract, ContractFilters, ContractMeta, ContractStatus } from '@/types/contracts'
import { toast } from '@/lib/toast'
import {
  PenTool,
  Plus,
  Search,
  Loader2,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  Send,
  Users,
  HardHat,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

function statusBadge(status: ContractStatus) {
  const map: Record<ContractStatus, { icon: React.ReactNode; label: string; cls: string }> = {
    draft: { icon: <FileText className="w-3 h-3" />, label: 'Utkast', cls: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300' },
    sent: { icon: <Send className="w-3 h-3" />, label: 'Skickad', cls: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' },
    signed: { icon: <CheckCircle2 className="w-3 h-3" />, label: 'Signerad', cls: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' },
    active: { icon: <CheckCircle2 className="w-3 h-3" />, label: 'Aktiv', cls: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' },
    completed: { icon: <CheckCircle2 className="w-3 h-3" />, label: 'Avslutad', cls: 'bg-stone-100 dark:bg-stone-900/30 text-stone-700 dark:text-stone-300' },
    cancelled: { icon: <XCircle className="w-3 h-3" />, label: 'Avbruten', cls: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' },
  }
  const s = map[status] || map.draft
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${s.cls}`}>
      {s.icon} {s.label}
    </span>
  )
}

function typeBadge(type: string) {
  if (type === 'subcontractor') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
        <HardHat className="w-3 h-3" /> UE
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
      <Users className="w-3 h-3" /> Kund
    </span>
  )
}

function formatDate(d: string) {
  return new Intl.DateTimeFormat('sv-SE', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(d))
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 0 }).format(n)
}

export default function ContractsPage() {
  const { tenantId } = useTenant()
  const router = useRouter()

  const [contracts, setContracts] = useState<Contract[]>([])
  const [meta, setMeta] = useState<ContractMeta>({ page: 1, limit: 20, count: 0 })
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<ContractFilters>({ page: 1, limit: 20 })
  const [search, setSearch] = useState('')

  const fetchContracts = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    try {
      const result = await ContractsAPI.list({ ...filters, search: search || undefined })
      setContracts(result.data)
      setMeta(result.meta)
    } catch (err: any) {
      toast.error(err.message || 'Kunde inte ladda avtal')
    } finally {
      setLoading(false)
    }
  }, [tenantId, filters, search])

  useEffect(() => { fetchContracts() }, [fetchContracts])

  const totalPages = meta.totalPages || Math.ceil(meta.count / (filters.limit || 20))

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
      <Sidebar />
      <main className="flex-1 w-full lg:ml-0 overflow-x-hidden">
        <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary-500 rounded-lg shadow-md">
                <PenTool className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Avtal</h1>
                <p className="text-gray-600 dark:text-gray-400">Hantera kund- och underentreprenoravtal</p>
              </div>
            </div>
            <Link href="/contracts/new">
              <button className="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-gray-900 rounded-lg font-semibold shadow-md hover:shadow-xl transition-all flex items-center gap-2">
                <Plus className="w-5 h-5" /> Nytt avtal
              </button>
            </Link>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Sok avtal..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setFilters(f => ({ ...f, page: 1 })) }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <select
                value={filters.status || ''}
                onChange={(e) => setFilters(f => ({ ...f, status: (e.target.value || undefined) as any, page: 1 }))}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              >
                <option value="">Alla statusar</option>
                <option value="draft">Utkast</option>
                <option value="sent">Skickad</option>
                <option value="signed">Signerad</option>
                <option value="active">Aktiv</option>
                <option value="completed">Avslutad</option>
                <option value="cancelled">Avbruten</option>
              </select>
              <select
                value={filters.contract_type || ''}
                onChange={(e) => setFilters(f => ({ ...f, contract_type: (e.target.value || undefined) as any, page: 1 }))}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              >
                <option value="">Alla typer</option>
                <option value="client">Kundavtal</option>
                <option value="subcontractor">UE-avtal</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
            {loading ? (
              <div className="p-12 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary-500 mx-auto" />
              </div>
            ) : contracts.length === 0 ? (
              <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="font-medium">Inga avtal</p>
                <p className="text-sm mt-1">Skapa ditt forsta avtal for att komma igang</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                        <th className="px-6 py-3">Avtalsnr</th>
                        <th className="px-6 py-3">Titel</th>
                        <th className="px-6 py-3">Motpart</th>
                        <th className="px-6 py-3">Typ</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3 text-right">Belopp</th>
                        <th className="px-6 py-3">Skapad</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {contracts.map((c) => (
                        <tr
                          key={c.id}
                          onClick={() => router.push(`/contracts/${c.id}`)}
                          className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors cursor-pointer"
                        >
                          <td className="px-6 py-3 font-mono text-xs text-gray-500 dark:text-gray-400">{c.contract_number}</td>
                          <td className="px-6 py-3 font-medium text-gray-900 dark:text-white">{c.title}</td>
                          <td className="px-6 py-3 text-gray-600 dark:text-gray-400">{c.counterparty_name || (c.client as any)?.name || '—'}</td>
                          <td className="px-6 py-3">{typeBadge(c.contract_type)}</td>
                          <td className="px-6 py-3">{statusBadge(c.status)}</td>
                          <td className="px-6 py-3 text-right font-medium text-gray-900 dark:text-white">{formatCurrency(c.total_amount)}</td>
                          <td className="px-6 py-3 text-gray-500 dark:text-gray-400">{formatDate(c.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {meta.count} avtal totalt
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setFilters(f => ({ ...f, page: (f.page || 1) - 1 }))}
                        disabled={!filters.page || filters.page <= 1}
                        className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Sida {filters.page || 1} av {totalPages}
                      </span>
                      <button
                        onClick={() => setFilters(f => ({ ...f, page: (f.page || 1) + 1 }))}
                        disabled={(filters.page || 1) >= totalPages}
                        className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/contracts/page.tsx
git commit -m "feat: rewrite contracts list page with filters and table"
```

---

## Task 11: Create Contract Page

**Files:**
- Create: `app/contracts/new/page.tsx`

- [ ] **Step 1: Create the new contract page**

```tsx
// app/contracts/new/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { useTenant } from '@/context/TenantContext'
import { ContractsAPI } from '@/lib/api/contracts'
import { CONTRACT_TEMPLATES } from '@/lib/ata/contract-templates'
import { apiFetch } from '@/lib/http/fetcher'
import { toast } from '@/lib/toast'
import type { ContractType, ContractSection, ContractItem } from '@/types/contracts'
import {
  Scale,
  HardHat,
  Home,
  FileText,
  Users,
  Plus,
  Trash2,
  Loader2,
  ArrowLeft,
  ChevronDown,
} from 'lucide-react'

interface ProjectOption { id: string; name: string }
interface ClientOption { id: string; name: string }

const TEMPLATE_ICONS: Record<string, React.ReactNode> = {
  ab04: <Scale className="w-6 h-6" />,
  abt06: <HardHat className="w-6 h-6" />,
  consumer: <Home className="w-6 h-6" />,
  'simple-client': <Users className="w-6 h-6" />,
  subcontractor: <HardHat className="w-6 h-6" />,
}

type ItemDraft = {
  item_type: 'material' | 'labor' | 'other'
  description: string
  quantity: number
  unit: string
  unit_price: number
  vat_rate: number
}

export default function NewContractPage() {
  const router = useRouter()
  const { tenantId } = useTenant()

  // Step state
  const [contractType, setContractType] = useState<ContractType | null>(null)
  const [templateId, setTemplateId] = useState<string | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [projectId, setProjectId] = useState('')
  const [clientId, setClientId] = useState('')
  const [counterpartyName, setCounterpartyName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [sections, setSections] = useState<ContractSection[]>([])
  const [items, setItems] = useState<ItemDraft[]>([])

  // Options
  const [projects, setProjects] = useState<ProjectOption[]>([])
  const [clients, setClients] = useState<ClientOption[]>([])

  const [saving, setSaving] = useState(false)

  // Load projects and clients
  useEffect(() => {
    if (!tenantId) return
    apiFetch<{ projects?: ProjectOption[] }>(`/api/projects/list?tenantId=${tenantId}`)
      .then(r => setProjects(r.projects ?? []))
      .catch(() => {})
    apiFetch<{ data?: ClientOption[] }>('/api/clients?limit=100')
      .then(r => setClients(r.data ?? []))
      .catch(() => {})
  }, [tenantId])

  // When template is selected, load sections
  useEffect(() => {
    if (!templateId) return
    const tpl = CONTRACT_TEMPLATES.find(t => t.id === templateId)
    if (tpl) {
      setSections(tpl.sections.map(s => ({ title: s.title, content: s.content })))
    }
  }, [templateId])

  // Filter templates by contract type
  const filteredTemplates = CONTRACT_TEMPLATES.filter(t => {
    if (!contractType) return true
    if (contractType === 'subcontractor') return t.id === 'subcontractor' || t.id === 'ab04' || t.id === 'abt06'
    return t.id !== 'subcontractor'
  })

  function addItem() {
    setItems([...items, { item_type: 'labor', description: '', quantity: 1, unit: 'st', unit_price: 0, vat_rate: 25 }])
  }

  function updateItem(index: number, field: keyof ItemDraft, value: any) {
    setItems(items.map((item, i) => i === index ? { ...item, [field]: value } : item))
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index))
  }

  function updateSection(index: number, content: string) {
    setSections(sections.map((s, i) => i === index ? { ...s, content } : s))
  }

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
  const taxAmount = items.reduce((sum, item) => sum + item.quantity * item.unit_price * (item.vat_rate / 100), 0)
  const totalAmount = subtotal + taxAmount

  async function handleSave() {
    if (!contractType) { toast.error('Valj avtalstyp'); return }
    if (!title.trim()) { toast.error('Ange en titel'); return }

    setSaving(true)
    try {
      const contract = await ContractsAPI.create({
        contract_type: contractType,
        template_id: templateId,
        title,
        description: description || null,
        sections,
        project_id: projectId || null,
        client_id: clientId || null,
        counterparty_name: counterpartyName || null,
        start_date: startDate || null,
        end_date: endDate || null,
        subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        items: items.filter(i => i.description.trim()).map((item, idx) => ({
          ...item,
          sort_order: idx,
        })),
      } as any)

      toast.success('Avtal skapat!')
      router.push(`/contracts/${contract.id}`)
    } catch (err: any) {
      toast.error(err.message || 'Kunde inte skapa avtal')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
      <Sidebar />
      <main className="flex-1 w-full lg:ml-0 overflow-x-hidden">
        <div className="p-4 sm:p-6 lg:p-10 max-w-4xl mx-auto w-full">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <button onClick={() => router.push('/contracts')} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Nytt avtal</h1>
              <p className="text-gray-600 dark:text-gray-400">Skapa ett nytt kund- eller underentreprenoravtal</p>
            </div>
          </div>

          {/* Step 1: Contract Type */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">1. Avtalstyp</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { type: 'client' as const, icon: <Users className="w-8 h-8" />, label: 'Kundavtal', desc: 'Avtal med kund for ett projekt' },
                { type: 'subcontractor' as const, icon: <HardHat className="w-8 h-8" />, label: 'UE-avtal', desc: 'Avtal med underentreprenor' },
              ].map(opt => (
                <button
                  key={opt.type}
                  onClick={() => { setContractType(opt.type); setTemplateId(null); setSections([]) }}
                  className={`text-left p-5 rounded-xl border-2 transition-all ${
                    contractType === opt.type
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-md'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className={contractType === opt.type ? 'text-primary-600 dark:text-primary-400 mb-2' : 'text-gray-400 mb-2'}>{opt.icon}</div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{opt.label}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Template */}
          {contractType && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">2. Mall (valfritt)</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredTemplates.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTemplateId(t.id === templateId ? null : t.id)}
                    className={`text-left p-4 rounded-lg border-2 transition-all ${
                      templateId === t.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className={`mb-2 ${templateId === t.id ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'}`}>
                      {TEMPLATE_ICONS[t.id] || <FileText className="w-6 h-6" />}
                    </div>
                    <h3 className="font-medium text-sm text-gray-900 dark:text-white">{t.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{t.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Details */}
          {contractType && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">3. Detaljer</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Titel *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="t.ex. Badrumsrenovering Villa Andersson"
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Projekt</label>
                    <select
                      value={projectId}
                      onChange={e => setProjectId(e.target.value)}
                      className="w-full appearance-none px-4 py-2.5 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    >
                      <option value="">Valj projekt...</option>
                      {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-9 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>

                  {contractType === 'client' ? (
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kund</label>
                      <select
                        value={clientId}
                        onChange={e => {
                          setClientId(e.target.value)
                          const client = clients.find(c => c.id === e.target.value)
                          if (client) setCounterpartyName(client.name)
                        }}
                        className="w-full appearance-none px-4 py-2.5 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                      >
                        <option value="">Valj kund...</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-9 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Underentreprenor</label>
                      <input
                        type="text"
                        value={counterpartyName}
                        onChange={e => setCounterpartyName(e.target.value)}
                        placeholder="Foretag AB"
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Startdatum</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Slutdatum</label>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Arbetsbeskrivning</label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={4}
                    placeholder="Beskriv arbetets omfattning..."
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white resize-y"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Line Items */}
          {contractType && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">4. Poster</h2>
                <button onClick={addItem} className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg flex items-center gap-1 transition-colors">
                  <Plus className="w-4 h-4" /> Lagg till
                </button>
              </div>

              {items.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">Inga poster tillagda. Klicka &quot;Lagg till&quot; for att borja.</p>
              ) : (
                <div className="space-y-3">
                  {items.map((item, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-end p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                      <div className="col-span-12 sm:col-span-4">
                        <label className="block text-xs text-gray-500 mb-1">Beskrivning</label>
                        <input type="text" value={item.description} onChange={e => updateItem(i, 'description', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
                      </div>
                      <div className="col-span-3 sm:col-span-1">
                        <label className="block text-xs text-gray-500 mb-1">Antal</label>
                        <input type="number" value={item.quantity} onChange={e => updateItem(i, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
                      </div>
                      <div className="col-span-3 sm:col-span-1">
                        <label className="block text-xs text-gray-500 mb-1">Enhet</label>
                        <input type="text" value={item.unit} onChange={e => updateItem(i, 'unit', e.target.value)}
                          className="w-full px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
                      </div>
                      <div className="col-span-3 sm:col-span-2">
                        <label className="block text-xs text-gray-500 mb-1">A-pris (SEK)</label>
                        <input type="number" value={item.unit_price} onChange={e => updateItem(i, 'unit_price', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
                      </div>
                      <div className="col-span-4 sm:col-span-2">
                        <label className="block text-xs text-gray-500 mb-1">Typ</label>
                        <select value={item.item_type} onChange={e => updateItem(i, 'item_type', e.target.value)}
                          className="w-full px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
                          <option value="labor">Arbete</option>
                          <option value="material">Material</option>
                          <option value="other">Ovrigt</option>
                        </select>
                      </div>
                      <div className="col-span-4 sm:col-span-1 text-right">
                        <label className="block text-xs text-gray-500 mb-1">Summa</label>
                        <p className="py-2 text-sm font-medium text-gray-900 dark:text-white">
                          {new Intl.NumberFormat('sv-SE').format(item.quantity * item.unit_price)}
                        </p>
                      </div>
                      <div className="col-span-2 sm:col-span-1 flex justify-end">
                        <button onClick={() => removeItem(i)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Totals */}
                  <div className="flex justify-end pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between gap-8">
                        <span className="text-gray-500">Netto:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{new Intl.NumberFormat('sv-SE').format(subtotal)} SEK</span>
                      </div>
                      <div className="flex justify-between gap-8">
                        <span className="text-gray-500">Moms (25%):</span>
                        <span className="text-gray-900 dark:text-white">{new Intl.NumberFormat('sv-SE').format(taxAmount)} SEK</span>
                      </div>
                      <div className="flex justify-between gap-8 text-base font-bold">
                        <span>Totalt:</span>
                        <span className="text-gray-900 dark:text-white">{new Intl.NumberFormat('sv-SE').format(totalAmount)} SEK</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 5: Sections (from template) */}
          {sections.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">5. Avtalsvillkor</h2>
              <div className="space-y-4">
                {sections.map((sec, i) => (
                  <div key={i}>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{sec.title}</label>
                    <textarea
                      value={sec.content}
                      onChange={e => updateSection(i, e.target.value)}
                      rows={4}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm resize-y"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Save */}
          {contractType && (
            <div className="flex justify-end gap-3 mb-12">
              <button
                onClick={() => router.push('/contracts')}
                className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Avbryt
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !title.trim()}
                className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-gray-900 rounded-lg font-semibold shadow-md hover:shadow-xl transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Spara utkast
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/contracts/new/page.tsx
git commit -m "feat: add create contract page with template picker and line items"
```

---

## Task 12: Contract Detail Page

**Files:**
- Create: `app/contracts/[id]/page.tsx`

- [ ] **Step 1: Create the detail/edit page**

```tsx
// app/contracts/[id]/page.tsx
'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { useTenant } from '@/context/TenantContext'
import { ContractsAPI } from '@/lib/api/contracts'
import { toast } from '@/lib/toast'
import type { Contract, ContractItem, ContractSection } from '@/types/contracts'
import {
  ArrowLeft,
  FileText,
  Download,
  Send,
  Save,
  Loader2,
  CheckCircle2,
  Clock,
  XCircle,
  Trash2,
  Plus,
  HardHat,
  Users,
  FileSignature,
} from 'lucide-react'

function statusBadge(status: string) {
  const map: Record<string, { icon: React.ReactNode; label: string; cls: string }> = {
    draft: { icon: <FileText className="w-3.5 h-3.5" />, label: 'Utkast', cls: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300' },
    sent: { icon: <Send className="w-3.5 h-3.5" />, label: 'Skickad for signering', cls: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' },
    signed: { icon: <CheckCircle2 className="w-3.5 h-3.5" />, label: 'Signerad', cls: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' },
    active: { icon: <CheckCircle2 className="w-3.5 h-3.5" />, label: 'Aktiv', cls: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' },
    completed: { icon: <CheckCircle2 className="w-3.5 h-3.5" />, label: 'Avslutad', cls: 'bg-stone-100 dark:bg-stone-900/30 text-stone-600 dark:text-stone-300' },
    cancelled: { icon: <XCircle className="w-3.5 h-3.5" />, label: 'Avbruten', cls: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' },
  }
  const s = map[status] || map.draft
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${s.cls}`}>
      {s.icon} {s.label}
    </span>
  )
}

function fmt(n: number) {
  return new Intl.NumberFormat('sv-SE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
}

function fmtCurrency(n: number) {
  return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 0 }).format(n)
}

export default function ContractDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { tenantId } = useTenant()

  const [contract, setContract] = useState<Contract | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)

  // Editable state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [counterpartyName, setCounterpartyName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [sections, setSections] = useState<ContractSection[]>([])
  const [items, setItems] = useState<ContractItem[]>([])
  const [signatoryEmail, setSignatoryEmail] = useState('')

  const isDraft = contract?.status === 'draft'

  const fetchContract = useCallback(async () => {
    if (!id || !tenantId) return
    setLoading(true)
    try {
      const data = await ContractsAPI.get(id)
      setContract(data)
      setTitle(data.title)
      setDescription(data.description || '')
      setCounterpartyName(data.counterparty_name || '')
      setStartDate(data.start_date?.split('T')[0] || '')
      setEndDate(data.end_date?.split('T')[0] || '')
      setSections(data.sections || [])
      setItems(data.items || [])
    } catch (err: any) {
      toast.error(err.message || 'Kunde inte ladda avtal')
    } finally {
      setLoading(false)
    }
  }, [id, tenantId])

  useEffect(() => { fetchContract() }, [fetchContract])

  async function handleSave() {
    if (!contract) return
    setSaving(true)
    try {
      const subtotal = items.reduce((sum, i) => sum + (i.line_total ?? i.quantity * i.unit_price), 0)
      const taxAmount = items.reduce((sum, i) => sum + i.quantity * i.unit_price * (i.vat_rate / 100), 0)

      await ContractsAPI.update(contract.id, {
        title,
        description: description || null,
        counterparty_name: counterpartyName || null,
        start_date: startDate || null,
        end_date: endDate || null,
        sections,
        subtotal,
        tax_amount: taxAmount,
        total_amount: subtotal + taxAmount,
      })
      toast.success('Avtal sparat!')
      fetchContract()
    } catch (err: any) {
      toast.error(err.message || 'Kunde inte spara')
    } finally {
      setSaving(false)
    }
  }

  async function handleSend() {
    if (!contract || !signatoryEmail.trim()) {
      toast.error('Ange motpartens e-post for signering')
      return
    }
    setSending(true)
    try {
      const result = await ContractsAPI.send(contract.id, [{ reference: signatoryEmail }])
      toast.success('Avtal skickat for signering!')
      fetchContract()
    } catch (err: any) {
      toast.error(err.message || 'Kunde inte skicka for signering')
    } finally {
      setSending(false)
    }
  }

  async function handleDelete() {
    if (!contract) return
    if (!confirm('Ar du saker pa att du vill radera detta avtal?')) return
    try {
      await ContractsAPI.remove(contract.id)
      toast.success('Avtal raderat')
      router.push('/contracts')
    } catch (err: any) {
      toast.error(err.message || 'Kunde inte radera')
    }
  }

  async function handleAddItem() {
    if (!contract) return
    try {
      const item = await ContractsAPI.addItem(contract.id, {
        description: 'Ny post',
        item_type: 'labor',
        quantity: 1,
        unit: 'st',
        unit_price: 0,
        vat_rate: 25,
        sort_order: items.length,
      })
      setItems([...items, item])
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  async function handleUpdateItem(item: ContractItem) {
    if (!contract) return
    try {
      await ContractsAPI.updateItem(contract.id, item)
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  async function handleDeleteItem(itemId: string) {
    if (!contract) return
    try {
      await ContractsAPI.deleteItem(contract.id, itemId)
      setItems(items.filter(i => i.id !== itemId))
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </main>
      </div>
    )
  }

  if (!contract) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Avtal hittades inte</p>
        </main>
      </div>
    )
  }

  const subtotal = items.reduce((sum, i) => sum + (i.line_total ?? i.quantity * i.unit_price), 0)
  const taxAmount = items.reduce((sum, i) => sum + i.quantity * i.unit_price * (i.vat_rate / 100), 0)
  const totalAmount = subtotal + taxAmount

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
      <Sidebar />
      <main className="flex-1 w-full lg:ml-0 overflow-x-hidden">
        <div className="p-4 sm:p-6 lg:p-10 max-w-4xl mx-auto w-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button onClick={() => router.push('/contracts')} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{contract.contract_number}</h1>
                  {statusBadge(contract.status)}
                  {contract.contract_type === 'subcontractor' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                      <HardHat className="w-3 h-3" /> UE
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                      <Users className="w-3 h-3" /> Kund
                    </span>
                  )}
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{contract.title}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <a
                href={ContractsAPI.pdfUrl(contract.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" /> PDF
              </a>
              {isDraft && (
                <>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-gray-900 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Spara
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-3 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Radera avtal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Avtalsinformation</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Titel</label>
                {isDraft ? (
                  <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
                ) : (
                  <p className="text-gray-900 dark:text-white">{title}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Motpart</label>
                  {isDraft ? (
                    <input type="text" value={counterpartyName} onChange={e => setCounterpartyName(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
                  ) : (
                    <p className="text-gray-900 dark:text-white">{counterpartyName || '—'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Projekt</label>
                  <p className="text-gray-900 dark:text-white">{contract.project?.name || '—'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Startdatum</label>
                  {isDraft ? (
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
                  ) : (
                    <p className="text-gray-900 dark:text-white">{startDate || '—'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Slutdatum</label>
                  {isDraft ? (
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
                  ) : (
                    <p className="text-gray-900 dark:text-white">{endDate || '—'}</p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Arbetsbeskrivning</label>
                {isDraft ? (
                  <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white resize-y" />
                ) : (
                  <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{description || '—'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Poster</h2>
              {isDraft && (
                <button onClick={handleAddItem} className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg flex items-center gap-1">
                  <Plus className="w-4 h-4" /> Lagg till
                </button>
              )}
            </div>

            {items.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">Inga poster</p>
            ) : (
              <>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs font-medium text-gray-500 uppercase border-b border-gray-200 dark:border-gray-700">
                      <th className="pb-2">Beskrivning</th>
                      <th className="pb-2 text-right">Antal</th>
                      <th className="pb-2 text-center">Enhet</th>
                      <th className="pb-2 text-right">A-pris</th>
                      <th className="pb-2 text-right">Summa</th>
                      {isDraft && <th className="pb-2 w-10"></th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {items.map((item) => (
                      <tr key={item.id}>
                        <td className="py-2">
                          {isDraft ? (
                            <input type="text" value={item.description}
                              onChange={e => setItems(items.map(i => i.id === item.id ? { ...i, description: e.target.value } : i))}
                              onBlur={() => handleUpdateItem(item)}
                              className="w-full px-2 py-1 text-sm border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
                          ) : (
                            <span className="text-gray-900 dark:text-white">{item.description}</span>
                          )}
                        </td>
                        <td className="py-2 text-right">
                          {isDraft ? (
                            <input type="number" value={item.quantity}
                              onChange={e => setItems(items.map(i => i.id === item.id ? { ...i, quantity: parseFloat(e.target.value) || 0 } : i))}
                              onBlur={() => handleUpdateItem(item)}
                              className="w-20 px-2 py-1 text-sm text-right border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
                          ) : (
                            <span>{item.quantity}</span>
                          )}
                        </td>
                        <td className="py-2 text-center text-gray-500">{item.unit}</td>
                        <td className="py-2 text-right">
                          {isDraft ? (
                            <input type="number" value={item.unit_price}
                              onChange={e => setItems(items.map(i => i.id === item.id ? { ...i, unit_price: parseFloat(e.target.value) || 0 } : i))}
                              onBlur={() => handleUpdateItem(item)}
                              className="w-24 px-2 py-1 text-sm text-right border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
                          ) : (
                            <span>{fmt(item.unit_price)}</span>
                          )}
                        </td>
                        <td className="py-2 text-right font-medium text-gray-900 dark:text-white">
                          {fmt(item.line_total ?? item.quantity * item.unit_price)}
                        </td>
                        {isDraft && (
                          <td className="py-2">
                            <button onClick={() => handleDeleteItem(item.id)} className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="flex justify-end pt-3 mt-3 border-t border-gray-200 dark:border-gray-700 space-y-1">
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between gap-8"><span className="text-gray-500">Netto:</span><span>{fmt(subtotal)} SEK</span></div>
                    <div className="flex justify-between gap-8"><span className="text-gray-500">Moms:</span><span>{fmt(taxAmount)} SEK</span></div>
                    <div className="flex justify-between gap-8 text-base font-bold"><span>Totalt:</span><span>{fmtCurrency(totalAmount)}</span></div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Sections */}
          {sections.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Avtalsvillkor</h2>
              <div className="space-y-4">
                {sections.map((sec, i) => (
                  <div key={i}>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{sec.title}</h3>
                    {isDraft ? (
                      <textarea
                        value={sec.content}
                        onChange={e => setSections(sections.map((s, j) => j === i ? { ...s, content: e.target.value } : s))}
                        rows={3}
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm resize-y"
                      />
                    ) : (
                      <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{sec.content}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Signing */}
          {isDraft && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 mb-12">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                <FileSignature className="w-5 h-5 inline mr-2" />
                Skicka for signering
              </h2>
              <div className="flex gap-3">
                <input
                  type="email"
                  value={signatoryEmail}
                  onChange={e => setSignatoryEmail(e.target.value)}
                  placeholder="Motpartens e-postadress"
                  className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
                <button
                  onClick={handleSend}
                  disabled={sending || !signatoryEmail.trim()}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Skicka
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Avtalet genereras som PDF och skickas for BankID-signering via Criipto/Idura.
              </p>
            </div>
          )}

          {/* Signed PDF link */}
          {contract.signed_pdf_url && (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <div>
                  <p className="font-medium text-emerald-800 dark:text-emerald-300">Avtal signerat</p>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400">Det signerade avtalet finns lagrat.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/contracts/[id]/page.tsx
git commit -m "feat: add contract detail page with edit, PDF, and signing"
```

---

## Task 13: Build Verification & Final Commit

- [ ] **Step 1: Run the build to check for errors**

Run: `npx next build --no-lint 2>&1 | tail -40`
Expected: Build succeeds or only has warnings. Fix any TypeScript errors that come up.

- [ ] **Step 2: Verify migration was pushed**

Run: `supabase db push`
Expected: Migration applied (or already applied).

- [ ] **Step 3: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: resolve build errors in contracts feature"
```
