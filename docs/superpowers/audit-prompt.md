# Full Platform Audit Prompt — Frost Solutions

> Give this entire file to a fresh agent to audit everything built in the 2026-04-05 session.

---

## Context

Frost Solutions is an AI-driven SaaS for Swedish construction companies. In a single session on 2026-04-05, the entire platform was overhauled across 3 phases + frontend + production fixes — roughly **100 commits, 330+ files changed, 38K+ lines added, 10K+ removed**.

The codebase is at `/Users/vilmerfrost/Projects/frost-solutions-1`. It's a Next.js 16 App Router project with Supabase, TypeScript strict, Tailwind CSS, deployed on Vercel.

**Your job:** Audit every piece of work listed below. For each item, read the actual code, verify it works correctly, and report issues. Do NOT trust summaries — verify independently.

---

## What to Audit

### Phase 1 — Foundation Hardening

**1.1 Shared API Infrastructure (`app/lib/api/`)**
- Read: `response.ts`, `auth.ts`, `validate.ts`, `errors.ts`, `index.ts`
- Verify: `resolveAuth()` returns proper discriminated union, `resolveAuthAdmin()` includes admin client, `parseBody()` validates with Zod, `apiSuccess()`/`apiError()` return correct shapes
- Tests: `__tests__/lib/api/` — 4 test files, do they cover edge cases?

**1.2 Stripe Hardening (`app/lib/stripe/`)**
- Read: `client.ts` (shared singleton), `idempotency.ts` (event dedup)
- Read: `app/api/stripe/webhook/route.ts` — is idempotency check BEFORE event processing?
- Read: `app/api/stripe/create-payment-intent/route.ts` — are idempotency keys on outbound calls?
- Read: `app/api/subscriptions/checkout/route.ts` — dynamic checkout, no hardcoded links?
- Migration: `supabase/migrations/20260405100000_phase1_stripe_events.sql` — `stripe_events` table exists?
- Verify: `past_due_since` column added to subscriptions

**1.3 AI Provider (`app/lib/ai/openrouter.ts`)**
- Read the client — does it call OpenRouter correctly?
- Verify NO files import from `@google/generative-ai`, `groq`, or direct `openai` SDK
- Verify `app/lib/ai/claude.ts`, `huggingface.ts`, `openai-client.ts`, `ai.service.ts` are ALL deleted

**1.4 Dashboard Split (`app/dashboard/`)**
- Read `DashboardClient.tsx` — should be <100 lines, thin layout only
- Read each component in `app/dashboard/components/` — DashboardStats, DashboardProjects, DashboardTimeTracking, DashboardHeader
- Verify: no `as any` casts, proper loading states, API responses correctly unwrapped

**1.5 Security**
- Check these 13 routes have auth: `frost-ai`, `create-tenant`, `create-project`, `onboard-new-tenant`, `ai/rot-summary`, `onboarding/create-client`, `onboarding/create-project`, `onboarding/update-admin`, `onboarding/seed-demo-data`, `clients/create`, `ai/summarize`, `time-report/offline`, `projects/list`
- Verify: each calls `resolveAuth()`, `resolveAuthAdmin()`, or `supabase.auth.getUser()`

**1.6 Testing**
- Run: `pnpm test` — should be 126+ tests passing
- Check test quality: `__tests__/lib/payroll/validation.test.ts`, `__tests__/lib/pricing/calculateQuoteTotal.test.ts`

**1.7 Legacy Cleanup**
- Verify: `localStorage.getItem('tenant_id')` does NOT appear in `app/context/TenantContext.tsx`
- Verify: `app/utils/tenant/fetchWithTenant.ts` is deleted
- Verify: no `base_rate_sek` → `default_rate_sek` backward compat mapping in employee routes

---

### Phase 2 — The Moat

**2.1 BankID / Idura (`app/lib/signing/`)**
- Read: `types.ts`, `idura-client.ts` — GraphQL client hitting `signatures-api.criipto.com`
- Verify: `createSigningOrder`, `getSigningOrder`, `closeSigningOrder`, `cancelSigningOrder` exist
- Verify: supports `allowedEids` with Freja eID fallback
- Read: `app/api/signing/create/route.ts`, `app/api/signing/webhook/route.ts`, `app/api/signing/[orderId]/route.ts`
- Migration: `supabase/migrations/20260405100100_phase2_signing.sql` — `signing_orders` table with RLS

**2.2 PEPPOL (`app/lib/peppol/`)**
- Read: `client.ts` (REST client to peppol.sh), `mapper.ts` (invoice → PEPPOL format)
- Verify: Swedish org number validation (10 digits, scheme 0007)
- Read: `app/api/invoices/[id]/peppol/route.ts` — send endpoint
- Read: `app/api/peppol/receive/route.ts` — inbound webhook
- Tests: `__tests__/lib/peppol/mapper.test.ts`

**2.3 Skatteverket ROT (`app/lib/domain/rot/xml-generator.ts`)**
- Read the generator — does it produce valid `Begaran.xsd` v6 XML?
- Check: root element `<Begaran xmlns="...begaran/6.0">`, `<NamnPaBegaran>`, `<RotBegaran><Arenden>`
- Check: all 7 work types (Bygg, El, GlasPlatarbete, MarkDraneringarbete, Murning, MalningTapetsering, Vvs)
- Check: personnummer validation (12 digits), batch name max 16 chars
- Verify: `app/lib/rot/xml.ts` (old broken generator) is DELETED
- Read: `app/api/rot/[id]/download-xml/route.ts` — returns downloadable XML
- Tests: `__tests__/lib/rot/xml-generator.test.ts`

**2.4 Fortnox/Visma**
- Read: `app/lib/integrations/sync/export.ts` — does it support UPDATE (not just create)?
- Read: `app/lib/integrations/sync/mappers.ts` — input validation present?
- Read: `app/api/integrations/[id]/health/route.ts` — sync health dashboard
- Verify: OAuth CSRF state validation in `app/api/integrations/fortnox/callback/route.ts` and visma equivalent
- Verify: `ConflictResolver.ts`, `SyncQueue.ts`, `IdempotencyManager.ts` are DELETED
- Tests: `__tests__/lib/integrations/mappers.test.ts`

---

### Phase 3A — Core Platform

**3.1 Legal Fortress / ÄTA**
- Migration: `supabase/migrations/20260405100200_phase3a_legal_fortress.sql` — `ata_audit_trail`, `project_documents`, `document_shares`, `customer_portal_users`, `project_messages` tables
- Read: `app/lib/ata/workflow.ts` — state machine (created→admin_reviewed→approval_sent→customer_approved→work_completed→invoice_generated)
- Read: `app/lib/ata/audit.ts` — `logAtaEvent()` with SHA-256 hash chain (`computeEventHash`)
- Read ALL routes: `app/api/ata/v2/create`, `[id]/review`, `[id]/send-approval`, `[id]/approve`, `[id]/generate-invoice`, `[id]/verify-chain`, `[id]/documents`, `list`
- Read: `app/lib/ata/contract-templates.ts` — AB04, ABT06, consumer templates
- Read: `app/lib/credit/check.ts` — risk scoring (GREEN/YELLOW/RED)
- Tests: `__tests__/lib/ata/workflow.test.ts`, `__tests__/lib/ata/audit.test.ts`

**3.2 Document Management**
- Read: `app/lib/documents/folders.ts` — BSAB_FOLDERS (7 folders), `isRestrictedFolder()`
- Read ALL routes: `app/api/projects/[id]/documents/` — CRUD, upload, search, share, checklist, auto-tag, versions
- Verify: restricted folders (04-Avtal, 05-Ekonomi) require admin role in routes

**3.3 Customer Portal**
- Read: `app/lib/portal/auth.ts` — JWT auth separate from Supabase
- Read ALL routes: `app/api/portal/` — login, register, dashboard, project view, messages, ÄTA approve
- Read: `app/api/portal/invoices/[id]/pay/route.ts` — Stripe payment
- Read: `app/api/portal/subcontractor/` — dashboard, timesheets

---

### Phase 3B — Field & Operations

**3.4 Safety & Compliance**
- Migration: `supabase/migrations/20260405100500_phase3b_field_operations.sql`
- Read: `app/api/safety/certificates/route.ts` — CRUD + expiring endpoint
- Read: `app/api/safety/incidents/route.ts` — incident reporting
- Read: `app/api/projects/[id]/inductions/route.ts` — site inductions
- Read: `app/lib/safety/risk-templates.ts` — 5 work type templates
- Read: `app/api/safety/risk-assessments/route.ts`

**3.5 Personalliggare**
- Migration: `supabase/migrations/20260405100600_phase3_personalliggare.sql` — `site_attendance` table
- Read: `app/api/projects/[id]/attendance/route.ts` — check-in/out
- Read: `app/api/projects/[id]/attendance/export/route.ts` — CSV export

**3.6 Subcontractors**
- Read ALL: `app/api/subcontractors/` — CRUD, assignments, verify-fskatt, payments

**3.7 Scheduling**
- Read: `app/api/schedules/conflicts/check/route.ts`
- Read: `app/lib/scheduling/compliance.ts` — Arbetstidslagen checks
- Read: `app/api/schedules/route.ts` — conflict detection before insert

**3.8 Drawing Markup**
- Read: `app/api/projects/[id]/documents/[docId]/annotations/route.ts`

---

### Phase 3C — Intelligence & Mobile

**3.9 Material Price Engine**
- Read: `app/lib/scraper/suppliers.ts` — 4 scrapers (Byggmax, Beijer, XL-Bygg, Ahlsell)
- Read: `app/api/cron/scrape-prices/route.ts` — nightly cron
- Read: `app/api/materials/prices/route.ts` — search, compare, alerts, upload
- Verify in `vercel.json`: cron entry for `scrape-prices` at `59 23 * * *`

**3.10 Reporting**
- Read: `app/api/reports/profitability/route.ts` — includes AI predictions?
- Read: `app/api/reports/utilization/route.ts`, `cashflow/route.ts`, `saved/route.ts`, `export/route.ts`
- Read: `app/api/cron/monthly-reports/route.ts` — sends emails via Resend?
- Verify in `vercel.json`: cron entry for `monthly-reports`

**3.11 Daily Logs (Dagbok)**
- Migration: `supabase/migrations/20260405100700_phase3_dagbok.sql`
- Read: `app/api/projects/[id]/daily-log/route.ts`

**3.12 Contracts**
- Read: `app/api/contracts/templates/route.ts`, `generate/route.ts`

**3.13 Mobile Foundation**
- Check: `mobile/` directory exists with `package.json`, `app.json`, tab screens, auth store, API client

---

### Frontend Overhaul

**Design System**
- Read: `tailwind.config.js` — primary = amber (#F59E0B), gray = stone (#FAFAF9-#1C1917)?
- Read: `app/globals.css` — CSS vars updated? Header says "FROST DESIGN SYSTEM" not "LOVABLE"?
- Read: `app/components/ui/button.tsx` — primary variant uses `text-gray-900` not `text-white`?
- Read: `app/layout.tsx` — themeColor = `#D97706`?
- Spot-check 5 random pages for hardcoded `text-white` on `bg-primary-*` backgrounds

**Sidebar**
- Read: `app/components/SidebarClient.tsx` — NAV_GROUPS with role-based filtering?
- Verify: workers see subset, admins see everything

**10 New Pages (read each, verify they load)**
1. `app/ata/page.tsx` — Kanban pipeline
2. `app/projects/[id]/documents/page.tsx` — two-pane document browser
3. `app/safety/page.tsx` — 5-tab dashboard
4. `app/scheduling/page.tsx` — weekly calendar
5. `app/subcontractors/page.tsx` + `[id]/page.tsx` — list + detail
6. `app/materials/prices/page.tsx` — search + material list tabs
7. `app/reports/page.tsx` — 4-tab dashboard with Recharts
8. `app/contracts/page.tsx` — template picker + signing
9. `app/settings/integrations/page.tsx` — health cards
10. `app/portal/` — layout, login, dashboard, project view, ÄTA approval, survey

**Critical frontend pattern:** All pages using `apiFetch` must unwrap `{ success, data }` responses. Check that every `apiFetch` call correctly accesses `.data` when the API uses `apiSuccess()`.

---

### Production Issues Fixed

- Duplicate Vercel project `frost-solutions-1` deleted (was causing failure emails)
- `/documents` 404 → created project picker page
- `/api/reports/profitability` 500 → fixed column names (invoice_date→issue_date, hours→hours_total)
- Polling spam → intervals increased from 30s to 120s
- 3 pages using direct Supabase client → replaced with `apiFetch`
- 7 pages with wrong API response unwrapping → fixed `.data` extraction
- `useSchedules.ts` and `useEmployees.ts` → unwrap `{ success, data }` wrapper
- `WeeklySchedulesComponent.tsx` and `NotificationCenter.tsx` → `Array.isArray()` guards
- Feedback link → fixed basePath handling

---

## Verification Commands

```bash
pnpm test          # Should be 126+ tests, 13+ suites, all passing
pnpm typecheck     # Should be zero errors
pnpm build         # Should succeed (test this!)
```

## Report Format

For each section, report:
- **PASS** — code is correct, no issues
- **ISSUE** — describe the problem with file:line reference
- **MISSING** — expected file/feature doesn't exist
- **RISK** — code works but has a potential problem (security, performance, correctness)

End with a summary: total items checked, pass count, issue count, and prioritized fix list.
