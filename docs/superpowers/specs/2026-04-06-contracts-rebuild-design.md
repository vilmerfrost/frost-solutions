# Contracts Feature — Full Rebuild Design

## Summary

Replace the current placeholder contracts page with a fully functional contract management system. Contracts become a first-class entity (like quotes) with database persistence, CRUD, line items, editable legal templates, PDF generation, and BankID signing via the existing Idura integration.

## Requirements

- **Two contract types:** Client contracts + subcontractor agreements
- **Scope of work:** Free-text description + line items table (materials, labor, other)
- **Templates:** Keep AB 04, ABT 06, Consumer. Add "Enkel kundavtal" + "Underentreprenorsavtal"
- **Full lifecycle:** draft -> sent -> signed -> active -> completed | cancelled
- **PDF export:** react-pdf, downloadable from detail page
- **BankID signing:** Wire into existing Idura/Criipto integration
- **Run migrations:** `supabase db push` after creating migration files

## Database Schema

### `contracts` table

```sql
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  project_id UUID REFERENCES projects(id),
  client_id UUID REFERENCES clients(id),
  contract_type TEXT NOT NULL CHECK (contract_type IN ('client', 'subcontractor')),
  template_id TEXT, -- which template was used (nullable for custom)
  contract_number TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT, -- free-text scope of work
  sections JSONB DEFAULT '[]'::jsonb, -- array of { title, content }
  counterparty_name TEXT, -- the other party
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
CREATE POLICY contracts_tenant ON contracts USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Indexes
CREATE INDEX idx_contracts_tenant ON contracts(tenant_id);
CREATE INDEX idx_contracts_status ON contracts(tenant_id, status);
CREATE INDEX idx_contracts_project ON contracts(project_id);
```

### `contract_items` table

```sql
CREATE TABLE contract_items (
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

-- RLS
ALTER TABLE contract_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY contract_items_tenant ON contract_items
  USING (contract_id IN (SELECT id FROM contracts WHERE tenant_id = current_setting('app.tenant_id')::uuid));

CREATE INDEX idx_contract_items_contract ON contract_items(contract_id);
```

## Templates

Keep existing 3 templates in `app/lib/ata/contract-templates.ts`. Add:

### Enkel kundavtal (Simple Client Contract)
- Parter (parties)
- Arbetsbeskrivning (scope of work — free text)
- Pris och betalning (price and payment)
- Tidplan (timeline)
- Garanti (warranty — 2 years per consumer law)
- Ovrigt (other terms)

### Underentreprenorsavtal (Subcontractor Agreement)
- Parter (parties)
- Uppdragsbeskrivning (scope of work)
- Ersattning och betalning (compensation and payment)
- Tid och tillganglighet (timeline and availability)
- Forsakring och ansvar (insurance and liability)
- Arbetsmiljo och KMA (safety/quality requirements)
- Uppsagning (termination)

## Pages

### `/contracts` — List page
- Table: contract_number, title, counterparty, type badge, status badge, total, date
- Filters: status dropdown, type (client/sub) toggle, search text
- Pagination (same pattern as quotes)
- "Nytt avtal" button -> `/contracts/new`

### `/contracts/new` — Create page
- Type selector (client / subcontractor) with icons
- Template picker (cards like current page, but including new templates)
- Form fields: project (dropdown), counterparty name, title, description, dates
- For client type: client dropdown pre-fills counterparty
- Line items editor: add/remove rows, type/description/qty/unit/price/vat
- Sections editor: pre-filled from template, each section is an editable textarea
- Save as draft button

### `/contracts/[id]` — Detail/edit page
- All fields editable while in draft status
- Read-only view for sent/signed/active contracts
- Line items table with add/edit/remove
- Sections with inline editing
- Action bar: Save, Preview PDF, Download PDF, Send for Signing
- Status timeline
- Signing status panel (from signing_orders table)

## API Routes

All routes follow the quotes pattern: Zod validation, `resolveAuthAdmin()`, tenant isolation, `apiSuccess()`/`apiError()` helpers.

- `GET /api/contracts` — list with filters + pagination
- `POST /api/contracts` — create (accepts full contract + items in one call)
- `GET /api/contracts/[id]` — get single with items
- `PUT /api/contracts/[id]` — update contract fields
- `DELETE /api/contracts/[id]` — soft delete or hard delete drafts
- `GET /api/contracts/[id]/items` — list items
- `POST /api/contracts/[id]/items` — add item
- `PUT /api/contracts/[id]/items` — update item (itemId in body)
- `DELETE /api/contracts/[id]/items` — delete item (itemId in body)
- `GET /api/contracts/[id]/pdf` — generate and return PDF
- `POST /api/contracts/[id]/send` — create signing order via Idura

## PDF Template

react-pdf document (`app/lib/pdf/contract-template.tsx`):
- A4 page, Helvetica, dark text
- Header: company name, contract number, date
- Parties block: contractor + counterparty details
- Scope section: free-text description
- Line items table: description, qty, unit, price, total — with header row and totals
- Legal sections: rendered from the sections JSONB
- Signature blocks: two columns at bottom for both parties (name, date, signature line)

## Signing Integration

Wire into existing Idura flow at `/api/signing/create`:
- The `/api/contracts/[id]/send` route generates the contract PDF
- Calls the Idura client to create a signature order with `document_type: 'contract'`
- Creates a `signing_orders` row
- Updates contract status to `sent`
- Existing webhook at `/api/signing/webhook` handles status updates
- When signed: update contract status to `signed`, store `signed_pdf_url`

## Client API Wrapper

`app/lib/api/contracts.ts` — static class `ContractsAPI` with methods:
- `list(filters)`, `get(id)`, `create(data)`, `update(id, data)`, `delete(id)`
- `getItems(id)`, `addItem(id, item)`, `updateItem(id, item)`, `deleteItem(id, itemId)`
- `getPdf(id)` — returns blob
- `send(id)` — send for signing

## Types

`app/types/contracts.ts`:
- `Contract`, `ContractItem`, `ContractStatus`, `ContractType`
- `ContractFilters`, `ContractMeta`
- `ContractSection` (reuse from existing)

## Files to Create/Modify

**New files:**
- `supabase/migrations/YYYYMMDD_contracts.sql`
- `app/types/contracts.ts`
- `app/lib/api/contracts.ts`
- `app/lib/pdf/contract-template.tsx`
- `app/api/contracts/route.ts` (replace existing templates route)
- `app/api/contracts/[id]/route.ts`
- `app/api/contracts/[id]/items/route.ts`
- `app/api/contracts/[id]/pdf/route.ts`
- `app/api/contracts/[id]/send/route.ts`
- `app/contracts/page.tsx` (rewrite)
- `app/contracts/new/page.tsx`
- `app/contracts/[id]/page.tsx`

**Modify:**
- `app/lib/ata/contract-templates.ts` — add 2 new templates
- `app/api/signing/create/route.ts` — ensure it handles `document_type: 'contract'`
- `app/api/signing/webhook/route.ts` — update contract status on signed event

**Delete:**
- `app/api/contracts/generate/route.ts` (replaced by new CRUD)
- `app/api/contracts/templates/route.ts` (templates served from create page directly)
