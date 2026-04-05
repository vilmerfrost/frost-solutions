# Phase 2B: BankID + PEPPOL + Skatteverket ROT

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add BankID digital signing (via Idura), PEPPOL e-invoicing (via peppol.sh), and fix Skatteverket ROT XML generation to match the official schema.

**Architecture:** BankID uses Idura's GraphQL API for document signing with webhook callbacks. PEPPOL uses the peppol.sh TypeScript SDK for sending/receiving e-invoices. Skatteverket ROT generates valid Begaran.xsd v6 XML for manual upload (no API exists).

**Tech Stack:** Idura GraphQL API, peppol.sh SDK, XML generation (template strings), Zod validation

**Spec:** `docs/superpowers/specs/2026-04-05-frost-solutions-v2-overhaul-design.md` (Phase 2, Sections 2.1-2.3)

---

## Task 1: BankID Signing — Idura Client

Create a shared Idura client for BankID document signing.

**Files:**
- Create: `app/lib/signing/idura-client.ts`
- Create: `app/lib/signing/types.ts`
- Create: `__tests__/lib/signing/idura-client.test.ts`

- [ ] **Step 1: Define types**

Create `app/lib/signing/types.ts`:

```typescript
export interface SigningRequest {
  documentTitle: string
  documentPdfBase64: string
  signatories: Array<{
    reference: string  // e.g. customer name or ID
  }>
  webhookUrl: string
  callbackUrl?: string  // where to redirect user after signing
}

export interface SigningOrder {
  id: string
  status: 'OPEN' | 'CLOSED' | 'CANCELLED' | 'EXPIRED'
  documents: Array<{ id: string; title: string }>
  signatories: Array<{
    id: string
    reference: string
    status: 'OPEN' | 'SIGNED' | 'REJECTED' | 'ERROR'
    href: string  // signing URL for this person
  }>
}

export interface SigningWebhookEvent {
  event: 'SIGNATORY_SIGNED' | 'SIGNATORY_REJECTED' | 'SIGNATURE_ORDER_EXPIRED'
  signatureOrderId: string
  signatoryId: string
}

export interface SignedDocument {
  id: string
  title: string
  blob: string  // base64 signed PDF
}
```

- [ ] **Step 2: Write tests for the client**

Create `__tests__/lib/signing/idura-client.test.ts` testing:
- `createSigningOrder()` constructs correct GraphQL mutation
- `getSigningOrder()` constructs correct query
- `closeSigningOrder()` returns signed documents
- Throws on missing credentials

Mock `fetch` globally.

- [ ] **Step 3: Implement the Idura client**

Create `app/lib/signing/idura-client.ts`:

```typescript
import { SigningRequest, SigningOrder, SignedDocument } from './types'

const IDURA_API = 'https://signatures-api.criipto.com/v1/graphql'

function getAuth(): string {
  const clientId = process.env.IDURA_CLIENT_ID
  const clientSecret = process.env.IDURA_CLIENT_SECRET
  if (!clientId || !clientSecret) throw new Error('IDURA_CLIENT_ID and IDURA_CLIENT_SECRET are required')
  return 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
}

async function graphql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await fetch(IDURA_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': getAuth(),
    },
    body: JSON.stringify({ query, variables }),
  })
  if (!res.ok) throw new Error(`Idura API error: ${res.status} ${await res.text()}`)
  const json = await res.json()
  if (json.errors?.length) throw new Error(`Idura GraphQL error: ${json.errors[0].message}`)
  return json.data
}

export async function createSigningOrder(request: SigningRequest): Promise<SigningOrder> {
  const data = await graphql<{ createSignatureOrder: { signatureOrder: SigningOrder } }>(`
    mutation CreateOrder($input: CreateSignatureOrderInput!) {
      createSignatureOrder(input: $input) {
        signatureOrder {
          id
          status
          documents { id title }
          signatories { id reference status href }
        }
      }
    }
  `, {
    input: {
      documents: [{
        pdf: {
          title: request.documentTitle,
          storageMode: 'Temporary',
          blob: request.documentPdfBase64,
        }
      }],
      signatories: request.signatories.map(s => ({ reference: s.reference })),
      webhook: { uri: request.webhookUrl },
    }
  })
  return data.createSignatureOrder.signatureOrder
}

export async function getSigningOrder(orderId: string): Promise<SigningOrder> {
  const data = await graphql<{ signatureOrder: SigningOrder }>(`
    query GetOrder($id: ID!) {
      signatureOrder(id: $id) {
        id status
        documents { id title }
        signatories { id reference status href }
      }
    }
  `, { id: orderId })
  return data.signatureOrder
}

export async function closeSigningOrder(orderId: string): Promise<SignedDocument[]> {
  const data = await graphql<{ closeSignatureOrder: { signatureOrder: { documents: SignedDocument[] } } }>(`
    mutation CloseOrder($input: CloseSignatureOrderInput!) {
      closeSignatureOrder(input: $input) {
        signatureOrder {
          documents { id title blob }
        }
      }
    }
  `, { input: { signatureOrderId: orderId } })
  return data.closeSignatureOrder.signatureOrder.documents
}

export async function cancelSigningOrder(orderId: string): Promise<void> {
  await graphql(`
    mutation CancelOrder($input: CancelSignatureOrderInput!) {
      cancelSignatureOrder(input: $input) {
        signatureOrder { id status }
      }
    }
  `, { input: { signatureOrderId: orderId } })
}
```

- [ ] **Step 4: Run tests, verify pass**
- [ ] **Step 5: Commit**

```bash
git add app/lib/signing/ __tests__/lib/signing/
git commit -m "feat: add Idura/BankID signing client with GraphQL API"
```

---

## Task 2: BankID Signing — API Routes + Webhook

**Files:**
- Create: `app/api/signing/create/route.ts`
- Create: `app/api/signing/[orderId]/route.ts`
- Create: `app/api/signing/webhook/route.ts`
- Create: `supabase/migrations/phase2_signing.sql`

- [ ] **Step 1: Create signing table migration**

```sql
CREATE TABLE IF NOT EXISTS public.signing_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  idura_order_id TEXT NOT NULL UNIQUE,
  document_type TEXT NOT NULL CHECK (document_type IN ('quote', 'invoice', 'contract', 'ata')),
  document_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'signed', 'rejected', 'expired', 'cancelled')),
  signatories JSONB DEFAULT '[]',
  signed_pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_signing_orders_idura ON public.signing_orders(idura_order_id);
CREATE INDEX idx_signing_orders_document ON public.signing_orders(document_type, document_id);
ALTER TABLE public.signing_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation" ON public.signing_orders
  FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);
CREATE POLICY "Service role full access" ON public.signing_orders
  FOR ALL USING (auth.role() = 'service_role');
```

- [ ] **Step 2: Create signing API route**

`app/api/signing/create/route.ts` — accepts `{ documentType, documentId }`, generates PDF, creates Idura order, stores in DB, returns signing URLs.

- [ ] **Step 3: Create webhook handler**

`app/api/signing/webhook/route.ts` — receives Idura webhook events, updates signing_orders table, closes order and stores signed PDF when all signatories have signed.

- [ ] **Step 4: Create status endpoint**

`app/api/signing/[orderId]/route.ts` — returns current signing order status.

- [ ] **Step 5: Update .env.example**

Add `IDURA_CLIENT_ID` and `IDURA_CLIENT_SECRET`.

- [ ] **Step 6: Commit**

```bash
git add app/api/signing/ supabase/migrations/phase2_signing.sql .env.example
git commit -m "feat: BankID signing API routes with webhook handler"
```

---

## Task 3: PEPPOL E-Invoicing — SDK Setup + Send

**Files:**
- Create: `app/lib/peppol/client.ts`
- Create: `app/lib/peppol/mapper.ts`
- Create: `app/api/invoices/[id]/peppol/route.ts`
- Create: `__tests__/lib/peppol/mapper.test.ts`

- [ ] **Step 1: Install peppol.sh SDK**

```bash
pnpm add @peppol-sh/sdk
```

- [ ] **Step 2: Create PEPPOL client wrapper**

Create `app/lib/peppol/client.ts`:

```typescript
import Peppol from '@peppol-sh/sdk'

let peppolClient: ReturnType<typeof Peppol> | null = null

export function getPeppolClient() {
  if (peppolClient) return peppolClient
  const apiKey = process.env.PEPPOL_API_KEY
  if (!apiKey) throw new Error('PEPPOL_API_KEY is required')
  peppolClient = Peppol({ apiKey })
  return peppolClient
}
```

- [ ] **Step 3: Create invoice-to-PEPPOL mapper with tests**

Create `app/lib/peppol/mapper.ts` that maps a Frost invoice to PEPPOL BIS Billing 3.0 format:

```typescript
export interface PeppolInvoiceInput {
  invoiceNumber: string
  issueDate: string
  dueDate: string
  currency: string  // 'SEK'
  supplier: {
    name: string
    orgNumber: string  // Swedish org number (10 digits)
    vatNumber: string  // SE + org number + 01
    address: { street: string; city: string; zip: string; country: string }
  }
  customer: {
    name: string
    orgNumber: string
    vatNumber?: string
    address: { street: string; city: string; zip: string; country: string }
  }
  lines: Array<{
    description: string
    quantity: number
    unitPrice: number
    vatPercent: number  // 25, 12, 6, or 0
    unitCode?: string   // 'HUR' for hours, 'EA' for each
  }>
}

export function mapToPeppolInvoice(input: PeppolInvoiceInput) {
  // Validate Swedish org numbers
  if (!/^\d{10}$/.test(input.supplier.orgNumber)) {
    throw new Error('Supplier org number must be 10 digits')
  }

  const lines = input.lines.map((line, i) => ({
    id: String(i + 1),
    description: line.description,
    quantity: line.quantity,
    unitCode: line.unitCode ?? 'EA',
    unitPrice: line.unitPrice,
    taxCategory: line.vatPercent === 0 ? 'Z' : 'S',
    taxPercent: line.vatPercent,
    lineAmount: Math.round(line.quantity * line.unitPrice * 100) / 100,
  }))

  const subtotal = lines.reduce((sum, l) => sum + l.lineAmount, 0)
  const taxAmount = Math.round(lines.reduce((sum, l) => sum + l.lineAmount * (l.taxPercent / 100), 0) * 100) / 100

  return {
    invoiceNumber: input.invoiceNumber,
    issueDate: input.issueDate,
    dueDate: input.dueDate,
    currency: input.currency,
    supplier: {
      endpointId: input.supplier.orgNumber,
      endpointScheme: '0007',  // Swedish org number scheme
      name: input.supplier.name,
      vatNumber: input.supplier.vatNumber,
      address: input.supplier.address,
    },
    customer: {
      endpointId: input.customer.orgNumber,
      endpointScheme: '0007',
      name: input.customer.name,
      vatNumber: input.customer.vatNumber,
      address: input.customer.address,
    },
    lines,
    totals: {
      lineExtensionAmount: subtotal,
      taxExclusiveAmount: subtotal,
      taxInclusiveAmount: subtotal + taxAmount,
      payableAmount: subtotal + taxAmount,
      taxAmount,
    },
  }
}
```

Create `__tests__/lib/peppol/mapper.test.ts` testing:
- Valid invoice mapping with correct totals
- Swedish org number validation (rejects non-10-digit)
- Multiple tax rates
- Line amount calculation

- [ ] **Step 4: Create PEPPOL send endpoint**

Create `app/api/invoices/[id]/peppol/route.ts`:

```typescript
import { resolveAuthAdmin, apiSuccess, apiError, handleRouteError } from '@/lib/api'
import { getPeppolClient } from '@/lib/peppol/client'
import { mapToPeppolInvoice } from '@/lib/peppol/mapper'

export async function POST(req, { params }) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error
    const { id } = await params

    // Fetch invoice with client and line items
    const { data: invoice } = await auth.admin
      .from('invoices')
      .select('*, client:clients(*), items:invoice_items(*)')
      .eq('id', id)
      .eq('tenant_id', auth.tenantId)
      .single()

    if (!invoice) return apiError('Invoice not found', 404)

    // Get tenant info for supplier data
    const { data: tenant } = await auth.admin
      .from('tenants')
      .select('name, org_number, vat_number, address, city, zip_code')
      .eq('id', auth.tenantId)
      .single()

    // Map to PEPPOL format
    const peppolInvoice = mapToPeppolInvoice({
      invoiceNumber: invoice.invoice_number,
      issueDate: invoice.issue_date,
      dueDate: invoice.due_date,
      currency: 'SEK',
      supplier: {
        name: tenant.name,
        orgNumber: tenant.org_number,
        vatNumber: tenant.vat_number || `SE${tenant.org_number}01`,
        address: { street: tenant.address, city: tenant.city, zip: tenant.zip_code, country: 'SE' },
      },
      customer: {
        name: invoice.client.name,
        orgNumber: invoice.client.org_number,
        address: { street: invoice.client.address, city: invoice.client.city, zip: invoice.client.zip_code, country: 'SE' },
      },
      lines: invoice.items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        vatPercent: item.vat_percent ?? 25,
        unitCode: item.unit_code ?? 'EA',
      })),
    })

    // Send via PEPPOL
    const peppol = getPeppolClient()
    const result = await peppol.invoices.send(peppolInvoice)

    // Update invoice status
    await auth.admin.from('invoices').update({
      peppol_status: 'sent',
      peppol_id: result.id,
    }).eq('id', id)

    return apiSuccess({ peppolId: result.id, status: 'sent' })
  } catch (error) {
    return handleRouteError(error)
  }
}
```

- [ ] **Step 5: Update .env.example**

Add `PEPPOL_API_KEY`.

- [ ] **Step 6: Commit**

```bash
git add app/lib/peppol/ app/api/invoices/[id]/peppol/ __tests__/lib/peppol/ .env.example
git commit -m "feat: PEPPOL e-invoicing via peppol.sh SDK"
```

---

## Task 4: Skatteverket ROT — Fix XML Generator

The existing XML generators produce invalid XML. Rewrite to match `Begaran.xsd` v6.

**Files:**
- Rewrite: `app/lib/domain/rot/xml-generator.ts`
- Create: `__tests__/lib/rot/xml-generator.test.ts`
- Delete: `app/lib/rot/xml.ts` (old broken generator)

- [ ] **Step 1: Write tests for correct XML structure**

Create `__tests__/lib/rot/xml-generator.test.ts`:

```typescript
import { generateRotXml } from '@/lib/domain/rot/xml-generator'

describe('generateRotXml', () => {
  const validApplication = {
    batchName: 'FROST-2026-04',
    cases: [{
      personnummer: '199001011234',
      paymentDate: '2026-03-15',
      laborCost: 50000,     // PrisForArbete
      amountPaid: 50000,    // BetaltBelopp
      requestedAmount: 15000, // BegartBelopp (30% of labor)
      invoiceNumber: 'F-001',
      propertyDesignation: 'Stockholm Vasastan 1:2',
      workTypes: {
        bygg: { hours: 40, materialCost: 5000 },
        el: { hours: 8, materialCost: 2000 },
      },
    }],
  }

  it('generates valid XML with correct root element', () => {
    const xml = generateRotXml(validApplication)
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>')
    expect(xml).toContain('<Begaran')
    expect(xml).toContain('xmlns="http://xmls.skatteverket.se/se/skatteverket/ht/begaran/6.0"')
  })

  it('includes NamnPaBegaran', () => {
    const xml = generateRotXml(validApplication)
    expect(xml).toContain('<NamnPaBegaran>FROST-2026-04</NamnPaBegaran>')
  })

  it('uses RotBegaran wrapper', () => {
    const xml = generateRotXml(validApplication)
    expect(xml).toContain('<RotBegaran>')
    expect(xml).toContain('<Arenden>')
  })

  it('maps personnummer to Kopare element', () => {
    const xml = generateRotXml(validApplication)
    expect(xml).toContain('<Kopare>199001011234</Kopare>')
  })

  it('maps work types correctly', () => {
    const xml = generateRotXml(validApplication)
    expect(xml).toContain('<Bygg>')
    expect(xml).toContain('<AntalTimmar>40</AntalTimmar>')
    expect(xml).toContain('<Materialkostnad>5000</Materialkostnad>')
    expect(xml).toContain('<El>')
  })

  it('validates batch name length (max 16 chars)', () => {
    expect(() => generateRotXml({
      ...validApplication,
      batchName: 'THIS-IS-TOO-LONG-BATCH-NAME'
    })).toThrow()
  })

  it('validates personnummer is 12 digits', () => {
    expect(() => generateRotXml({
      ...validApplication,
      cases: [{ ...validApplication.cases[0], personnummer: '12345' }]
    })).toThrow()
  })
})
```

- [ ] **Step 2: Rewrite the XML generator**

Rewrite `app/lib/domain/rot/xml-generator.ts` to produce valid Begaran.xsd v6 XML:

```typescript
interface RotCase {
  personnummer: string      // 12 digits YYYYMMDDXXXX
  paymentDate: string       // YYYY-MM-DD
  laborCost: number         // PrisForArbete (integer)
  amountPaid: number        // BetaltBelopp (integer)
  requestedAmount: number   // BegartBelopp (integer)
  invoiceNumber?: string    // max 20 chars
  otherCost?: number        // Ovrigkostnad
  propertyDesignation?: string  // Fastighetsbeteckning
  apartmentNumber?: string  // LagenhetsNr
  brfOrgNumber?: string     // BrfOrgNr
  workTypes: Partial<Record<RotWorkType, { hours: number; materialCost: number }>>
}

type RotWorkType = 'bygg' | 'el' | 'glasPlatarbete' | 'markDraneringarbete' | 'murning' | 'malningTapetsering' | 'vvs'

interface RotBatch {
  batchName: string  // max 16 chars
  cases: RotCase[]
}

const WORK_TYPE_ELEMENTS: Record<RotWorkType, string> = {
  bygg: 'Bygg',
  el: 'El',
  glasPlatarbete: 'GlasPlatarbete',
  markDraneringarbete: 'MarkDraneringarbete',
  murning: 'Murning',
  malningTapetsering: 'MalningTapetsering',
  vvs: 'Vvs',
}

export function generateRotXml(batch: RotBatch): string {
  // Validation
  if (batch.batchName.length > 16) throw new Error('Batch name max 16 characters')
  if (batch.cases.length === 0) throw new Error('At least one case required')
  if (batch.cases.length > 100) throw new Error('Max 100 cases per file')

  for (const c of batch.cases) {
    if (!/^\d{12}$/.test(c.personnummer)) throw new Error(`Invalid personnummer: must be 12 digits`)
    if (c.invoiceNumber && c.invoiceNumber.length > 20) throw new Error('Invoice number max 20 characters')
  }

  const casesXml = batch.cases.map(c => {
    const workXml = Object.entries(c.workTypes)
      .filter(([, v]) => v)
      .map(([type, data]) => {
        const element = WORK_TYPE_ELEMENTS[type as RotWorkType]
        return `<${element}><AntalTimmar>${data!.hours}</AntalTimmar><Materialkostnad>${data!.materialCost}</Materialkostnad></${element}>`
      }).join('')

    return `<Arende>
  <Kopare>${c.personnummer}</Kopare>
  <BetalningsDatum>${c.paymentDate}</BetalningsDatum>
  <PrisForArbete>${Math.round(c.laborCost)}</PrisForArbete>
  <BetaltBelopp>${Math.round(c.amountPaid)}</BetaltBelopp>
  <BegartBelopp>${Math.round(c.requestedAmount)}</BegartBelopp>
  ${c.invoiceNumber ? `<FakturaNr>${escapeXml(c.invoiceNumber)}</FakturaNr>` : ''}
  ${c.otherCost ? `<Ovrigkostnad>${Math.round(c.otherCost)}</Ovrigkostnad>` : ''}
  ${c.propertyDesignation ? `<Fastighetsbeteckning>${escapeXml(c.propertyDesignation)}</Fastighetsbeteckning>` : ''}
  ${c.apartmentNumber ? `<LagenhetsNr>${escapeXml(c.apartmentNumber)}</LagenhetsNr>` : ''}
  ${c.brfOrgNumber ? `<BrfOrgNr>${escapeXml(c.brfOrgNumber)}</BrfOrgNr>` : ''}
  ${workXml ? `<UtfortArbete>${workXml}</UtfortArbete>` : ''}
</Arende>`
  }).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<Begaran xmlns="http://xmls.skatteverket.se/se/skatteverket/ht/begaran/6.0">
  <NamnPaBegaran>${escapeXml(batch.batchName)}</NamnPaBegaran>
  <RotBegaran>
    <Arenden>
      ${casesXml}
    </Arenden>
  </RotBegaran>
</Begaran>`
}

function escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
```

- [ ] **Step 3: Delete old broken generator**

```bash
rm -f app/lib/rot/xml.ts
```

- [ ] **Step 4: Create download endpoint**

Create `app/api/rot/[id]/download-xml/route.ts` that generates the XML and returns it as a downloadable file. Since Skatteverket has no API, the user downloads this XML and uploads it to the Skatteverket portal manually.

```typescript
export async function GET(req, { params }) {
  // ... auth, fetch rot application data ...
  const xml = generateRotXml(rotBatch)
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Content-Disposition': `attachment; filename="rot-begaran-${application.id}.xml"`,
    },
  })
}
```

- [ ] **Step 5: Run tests, commit**

```bash
pnpm test -- __tests__/lib/rot/
git add app/lib/domain/rot/xml-generator.ts app/api/rot/[id]/download-xml/ __tests__/lib/rot/
git commit -m "feat: rewrite ROT XML generator to match Begaran.xsd v6, add download endpoint"
```

---

## Completion Criteria

- [ ] Idura client with `createSigningOrder`, `getSigningOrder`, `closeSigningOrder`, `cancelSigningOrder`
- [ ] Signing API routes (create, status, webhook)
- [ ] `signing_orders` table with RLS
- [ ] PEPPOL mapper with Swedish org number validation and tests
- [ ] PEPPOL send endpoint at `/api/invoices/[id]/peppol`
- [ ] ROT XML generator produces valid `Begaran.xsd` v6 XML
- [ ] ROT download endpoint for manual Skatteverket upload
- [ ] Old broken XML generators deleted
- [ ] `pnpm typecheck` and `pnpm test` pass
