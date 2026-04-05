# Phase 2A: Fortnox/Visma Hardening + Subscription Polish

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Fortnox/Visma integrations production-grade with bidirectional sync, proper conflict resolution, and update/delete support. Clean up dead integration code.

**Architecture:** Keep the working legacy OAuth path. Add update/delete operations to the sync pipeline. Improve mappers with validation. Clean up 5 dead infrastructure files. Add sync health dashboard API.

**Tech Stack:** Next.js 16, Supabase, Fortnox API v3, Visma eAccounting API, Bottleneck (rate limiting)

**Spec:** `docs/superpowers/specs/2026-04-05-frost-solutions-v2-overhaul-design.md` (Phase 2, Section 2.4-2.5)

---

## Task 1: Clean up dead integration code

Remove unused infrastructure that adds confusion without value.

**Files:**
- Delete: `app/lib/integrations/sync/ConflictResolver.ts`
- Delete: `app/lib/integrations/sync/SyncQueue.ts`
- Delete: `app/lib/integrations/sync/IdempotencyManager.ts`
- Delete: `app/lib/ai/openai-client.ts` (if still exists)

- [ ] **Step 1: Verify no imports reference these files**

Run:
```bash
grep -rn "ConflictResolver\|SyncQueue\|IdempotencyManager" app/ --include="*.ts" --include="*.tsx" | grep -v "node_modules" | grep -v ".test."
```
Expected: Zero matches (or only self-references)

- [ ] **Step 2: Delete the files**

```bash
rm -f app/lib/integrations/sync/ConflictResolver.ts
rm -f app/lib/integrations/sync/SyncQueue.ts
rm -f app/lib/integrations/sync/IdempotencyManager.ts
rm -f app/lib/ai/openai-client.ts
```

- [ ] **Step 3: Run typecheck**

```bash
pnpm typecheck
```
Expected: Zero errors

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: delete dead integration infrastructure (ConflictResolver, SyncQueue, IdempotencyManager)"
```

---

## Task 2: Improve data mappers with validation

Add input validation and missing fields to Fortnox/Visma mappers.

**Files:**
- Modify: `app/lib/integrations/sync/mappers.ts`
- Create: `__tests__/lib/integrations/mappers.test.ts`

- [ ] **Step 1: Write tests for mapper functions**

Create `__tests__/lib/integrations/mappers.test.ts`:

```typescript
import { mapFrostInvoiceToFortnox, mapFrostCustomerToFortnox, mapFortnoxInvoiceToFrost, mapFortnoxCustomerToFrost } from '@/lib/integrations/sync/mappers'

describe('mapFrostInvoiceToFortnox', () => {
  it('maps required fields correctly', () => {
    const invoice = {
      id: 'inv-1',
      invoice_number: 'F-001',
      client_id: 'client-1',
      total_amount: 10000,
      vat_amount: 2500,
      status: 'sent',
      due_date: '2026-05-01',
      items: [
        { description: 'Byggarbete', quantity: 10, unit_price: 750, vat_percent: 25 }
      ]
    }
    const result = mapFrostInvoiceToFortnox(invoice)
    expect(result.Invoice).toBeDefined()
    expect(result.Invoice.InvoiceRows).toHaveLength(1)
    expect(result.Invoice.InvoiceRows[0].DeliveredQuantity).toBe(10)
  })

  it('throws on missing required fields', () => {
    expect(() => mapFrostInvoiceToFortnox({})).toThrow()
  })
})

describe('mapFrostCustomerToFortnox', () => {
  it('maps customer with all fields', () => {
    const client = {
      id: 'c-1',
      name: 'Test AB',
      email: 'test@test.se',
      org_number: '5566778899',
      address: 'Storgatan 1',
      zip_code: '11122',
      city: 'Stockholm',
      country: 'SE'
    }
    const result = mapFrostCustomerToFortnox(client)
    expect(result.Customer.Name).toBe('Test AB')
    expect(result.Customer.OrganisationNumber).toBe('5566778899')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm test -- __tests__/lib/integrations/mappers.test.ts
```

- [ ] **Step 3: Update mappers.ts with validation and missing fields**

In `app/lib/integrations/sync/mappers.ts`, add:
- Input validation (throw if required fields missing)
- `OrganisationNumber` mapping for customers
- `City` field for customers
- Payment terms mapping
- Better null handling (no unsafe fallback chains)

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm test -- __tests__/lib/integrations/mappers.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add app/lib/integrations/sync/mappers.ts __tests__/lib/integrations/
git commit -m "feat: improve integration mappers with validation and missing fields"
```

---

## Task 3: Add update/delete support to sync export

Currently export only creates records — never updates or deletes. Add update capability using integration_mappings.

**Files:**
- Modify: `app/lib/integrations/sync/export.ts`

- [ ] **Step 1: Add update logic to exportInvoice**

In `app/lib/integrations/sync/export.ts`, modify the export functions:

```typescript
// Check if we already have a mapping for this entity
const { data: existingMapping } = await admin
  .from('integration_mappings')
  .select('remote_id')
  .eq('integration_id', integrationId)
  .eq('local_id', invoice.id)
  .eq('entity_type', 'invoice')
  .maybeSingle()

if (existingMapping?.remote_id) {
  // UPDATE existing remote record
  const result = await client.updateInvoice(existingMapping.remote_id, mappedData)
  // ... log update
} else {
  // CREATE new remote record
  const result = await client.createInvoice(mappedData)
  // ... store mapping
}
```

Apply the same pattern for customers.

- [ ] **Step 2: Add job types for updates**

In the cron processor, handle `update_invoice` and `update_customer` job types in addition to `export_invoice` and `export_customer`.

- [ ] **Step 3: Verify typecheck passes**

```bash
pnpm typecheck
```

- [ ] **Step 4: Commit**

```bash
git add app/lib/integrations/sync/export.ts app/api/cron/sync-integrations/route.ts
git commit -m "feat: add update support to Fortnox/Visma sync export"
```

---

## Task 4: Add sync health dashboard API

Create an endpoint that returns sync status — last sync time, error count, pending jobs, failed jobs.

**Files:**
- Create: `app/api/integrations/[id]/health/route.ts`

- [ ] **Step 1: Create the health endpoint**

```typescript
import { NextRequest } from 'next/server'
import { resolveAuthAdmin, apiSuccess, handleRouteError } from '@/lib/api'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error
    const { id } = await params

    // Get last successful sync
    const { data: lastSync } = await auth.admin
      .from('sync_logs')
      .select('created_at, status, details')
      .eq('integration_id', id)
      .eq('tenant_id', auth.tenantId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // Get pending/failed job counts
    const { count: pendingCount } = await auth.admin
      .from('integration_jobs')
      .select('id', { count: 'exact', head: true })
      .eq('integration_id', id)
      .eq('tenant_id', auth.tenantId)
      .in('status', ['queued', 'running'])

    const { count: failedCount } = await auth.admin
      .from('integration_jobs')
      .select('id', { count: 'exact', head: true })
      .eq('integration_id', id)
      .eq('tenant_id', auth.tenantId)
      .eq('status', 'failed')

    // Get recent errors
    const { data: recentErrors } = await auth.admin
      .from('sync_logs')
      .select('created_at, status, details')
      .eq('integration_id', id)
      .eq('tenant_id', auth.tenantId)
      .eq('status', 'error')
      .order('created_at', { ascending: false })
      .limit(5)

    return apiSuccess({
      lastSync: lastSync?.created_at ?? null,
      lastSyncStatus: lastSync?.status ?? null,
      pendingJobs: pendingCount ?? 0,
      failedJobs: failedCount ?? 0,
      recentErrors: recentErrors ?? [],
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/integrations/[id]/health/
git commit -m "feat: add integration sync health dashboard endpoint"
```

---

## Task 5: Fix OAuth security (CSRF state validation)

Add proper state validation to OAuth callbacks.

**Files:**
- Modify: `app/api/integrations/fortnox/connect/route.ts`
- Modify: `app/api/integrations/fortnox/callback/route.ts`
- Modify: `app/api/integrations/visma/connect/route.ts`
- Modify: `app/api/integrations/visma/callback/route.ts`

- [ ] **Step 1: Generate secure state in connect routes**

In the connect routes, generate a random state and store it:

```typescript
import { randomUUID } from 'crypto'

// Generate secure state
const state = randomUUID()

// Store state in integration record for validation in callback
await admin.from('integrations').update({ 
  metadata: { ...existingMetadata, oauth_state: state }
}).eq('id', integrationId)
```

- [ ] **Step 2: Validate state in callback routes**

In the callback routes, verify the state matches:

```typescript
const state = searchParams.get('state')

// Look up integration by state
const { data: integration } = await admin
  .from('integrations')
  .select('id, metadata')
  .eq('tenant_id', tenantId)
  .maybeSingle()

if (!integration || integration.metadata?.oauth_state !== state) {
  return apiError('Invalid OAuth state — possible CSRF attack', 403)
}

// Clear state after use
await admin.from('integrations').update({
  metadata: { ...integration.metadata, oauth_state: null }
}).eq('id', integration.id)
```

- [ ] **Step 3: Commit**

```bash
git add app/api/integrations/
git commit -m "security: add CSRF state validation to OAuth callbacks"
```

---

## Completion Criteria

- [ ] Dead integration code deleted (ConflictResolver, SyncQueue, IdempotencyManager)
- [ ] Mappers have input validation and test coverage
- [ ] Export supports update (not just create)
- [ ] Sync health endpoint exists
- [ ] OAuth callbacks validate state parameter
- [ ] `pnpm typecheck` passes clean
- [ ] `pnpm test` passes (56+ tests)
