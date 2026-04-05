# Frost Solutions - AI-Driven SaaS for Swedish Construction

## What This Is

AI-powered all-in-one platform for Swedish construction companies ("byggforetag"): project management, time tracking, invoicing, payroll, ROT-avdrag, and accounting integrations. Live at **frostsolutions.se** with the app served under **/app** basePath.

**Price:** 499 SEK/project/month (shifting from flat rate) | **Language:** Swedish UI | **Market:** Nordic construction & blue-collar

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, basePath: `/app`) |
| Language | TypeScript 5.6 (strict mode, zero errors) |
| UI | React 19, Tailwind CSS 3.4, shadcn/ui, Framer Motion |
| State | Zustand + React Query 5 (with offline persistence via Dexie/IndexedDB) |
| Database | Supabase (PostgreSQL 15+, RLS on all tables) |
| Auth | Supabase Auth (Google/Microsoft OAuth + Magic Link) |
| AI | OpenRouter (Gemini Flash 3.1 Preview) — single provider for all AI features |
| Payments | Stripe (shared client, webhook idempotency, 14-day trial) |
| Email | Resend |
| Integrations | Fortnox, Visma eAccounting (legacy OAuth path) |
| Monitoring | Sentry |
| Hosting | Vercel (GitHub integration) |
| Package Manager | pnpm |

## Architecture

### Multi-Tenant Isolation
- Every table has `tenant_id` with Row Level Security (RLS)
- Tenant resolution: JWT claims -> API -> DB lookup (localStorage fallback removed)
- `TenantContext` provider wraps the entire app
- Middleware handles session refresh and tenant detection

### basePath: '/app'
- The app is served from `frostsolutions.se/app` (root domain = marketing site in separate repo)
- Middleware paths are ALREADY stripped of `/app` prefix
- Router.push/replace must NOT include `/app` (Next.js adds it automatically)
- Redirect URLs for OAuth callbacks must include `/app` prefix
- **This is the #1 source of routing bugs** — never double-prefix

### Shared API Infrastructure (`app/lib/api/`)
All API routes should use the shared helpers:
```typescript
import { resolveAuth, resolveAuthAdmin, parseBody, apiSuccess, apiError, handleRouteError } from '@/lib/api'
```
- `resolveAuth()` — returns `{ user, tenantId }` or `{ error }` (discriminated union)
- `resolveAuthAdmin()` — same + Supabase admin client
- `parseBody(req, zodSchema)` — validates JSON body with Zod
- `parseSearchParams(req, zodSchema)` — validates query params
- `apiSuccess(data, status?)` — `{ success: true, data }`
- `apiError(message, status?, details?)` — `{ success: false, error }`
- `handleRouteError(error)` — catch-all for route handlers

15 core routes are already migrated. Remaining ~170 routes still use old patterns but work fine — migrate as touched.

### Stripe (`app/lib/stripe/`)
- `getStripe()` — singleton Stripe client (shared across all routes)
- Webhook idempotency via `stripe_events` table — duplicates are skipped
- `isEventProcessed()`, `markEventProcessed()`, `markEventFailed()`
- 14-day trial (not 30), dynamic checkout (no hardcoded payment links)

### AI (`app/lib/ai/`)
- `openrouter.ts` — shared OpenRouter client, all AI routes use this
- `chat-tools.ts` — tool definitions for AI chat
- Legacy providers (Gemini SDK, Groq, OpenAI, Claude, HuggingFace) have been deleted
- `OPENROUTER_API_KEY` is the only AI env var needed

### Key Directories
```
app/
  api/             # 185 API route handlers
  components/      # 149+ React components (shadcn/ui base)
  lib/
    api/           # Shared API helpers (auth, response, validate, errors)
    ai/            # OpenRouter client + AI utilities
    stripe/        # Shared Stripe client + idempotency
    payroll/       # Payroll calculations, exporters, validation
    pricing/       # Quote pricing + markup rules
    integrations/  # Fortnox/Visma sync pipeline
    security/      # Rate limiting, webhook verification
  hooks/           # 36 custom hooks
  types/           # TypeScript type definitions
  context/         # TenantContext, ThemeContext
  dashboard/
    components/    # Split dashboard: Stats, Projects, TimeTracking, Header
supabase/
  functions/       # Edge functions (parse-invoice, watchdog, dynamic-api)
  migrations/      # SQL migrations (including phase1_stripe_events)
  rpc/             # PostgreSQL stored procedures
middleware.ts      # Session & tenant middleware
```

## Key Commands

```bash
pnpm dev              # Dev server at localhost:3000/app (uses webpack, NOT turbopack)
pnpm build            # Production build
pnpm lint             # ESLint
pnpm typecheck        # TypeScript strict check (currently zero errors)
pnpm test             # Jest unit tests (56 tests, 7 suites)
pnpm test:e2e         # Playwright E2E tests
```

## Infrastructure

- **Supabase project ref:** `rwgqyozifwfgsxwyegoz` (West EU - Ireland)
- **Vercel project:** `vilmer-frosts-projects/frost-solutions-1`
- **GitHub repo:** `vilmerfrost/frost-solutions`
- **Supabase CLI:** Linked
- **Vercel CLI:** Linked

## CLI Tools Available

| CLI | Purpose |
|-----|---------|
| `supabase` | Linked to project `rwgqyozifwfgsxwyegoz`. Push/pull migrations, generate types |
| `vercel` | Linked to `vilmer-frosts-projects/frost-solutions-1`. Deploy, manage env vars |
| `gh` | GitHub CLI. PRs, issues, Actions |
| `stripe` | Stripe CLI. Listen to webhooks locally, trigger test events, inspect resources |
| `ports` | See what's running on ports, kill orphaned processes |

## Database (50+ tables)

Core: `tenants`, `employees`, `clients`, `projects`, `time_entries`, `invoices`, `payroll_periods`, `rot_applications`, `materials`, `suppliers`, `work_orders`, `quotes`, `notifications`, `audit_logs`, `stripe_events`

Integration: `integrations` (encrypted OAuth tokens), `integration_syncs`, `subscriptions`, `subscription_invoices`, `ai_credits`, `ai_transactions`

All tables use RLS. Sensitive data (personnummer) encrypted for GDPR.

## Cron Jobs (vercel.json)

| Job | Schedule | Path |
|-----|----------|------|
| ROT Status Polling | Every 6h | `/api/rot/poll-status` |
| Payroll Reminders | Mon 8am | `/api/cron/payroll-reminders` |
| Invoice Reminders | Daily 9am | `/api/cron/invoice-reminders` |
| Friday Panic | Fri 2pm | `/api/cron/friday-panic` |
| Budget Alerts | Every 15min | `/api/cron/budget-alerts` |
| Share Link Cleanup | Daily 2am | `/api/cron/share-link-cleanup` |
| Integration Sync | Every 5min | `/api/cron/sync-integrations` |

## Testing

- **56 unit tests** across 7 suites (all passing)
- Tests cover: API response helpers, auth helpers, validation, payroll validation, pricing calculations, error utilities
- **Playwright E2E**: 9 test suites for critical flows, auth, dashboard, security, navigation, mobile
- Test pattern: `__tests__/**/*.[jt]s?(x)` (Jest), `tests/*.spec.ts` (Playwright)

## Security

- RLS on all tables with tenant isolation
- All API routes require authentication (13 previously unprotected routes fixed)
- Stripe webhook signature verification + event idempotency
- Rate limiting on auth, payment, AI, and public endpoints
- Input validation with Zod on all migrated routes
- GDPR-compliant personnummer encryption
- HTTP security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy)
- Console stripping in production (except errors)
- Audit logging for critical operations

## Coding Conventions

- **API routes:** Use shared helpers from `@/lib/api` (resolveAuth, parseBody, apiSuccess, etc.)
- **Validation:** Zod schemas at API boundaries
- **Forms:** React Hook Form + @hookform/resolvers
- **Icons:** Lucide React
- **Toasts:** Sonner
- **Dates:** date-fns 2.x
- **PDF:** jsPDF + html2canvas, @react-pdf/renderer
- **Drag & drop:** @dnd-kit
- **Charts:** Recharts
- **Animations:** Framer Motion

## Design System

- **Primary:** Nordic Blue `#007AFF`
- **Accent:** Frost Gold `#FFD700`
- **Font:** Inter (400-700)
- **Components:** shadcn/ui base with custom wrappers
- **Effects:** Glassmorphism/frosted glass, micro-interactions
- **Dark mode:** Supported via ThemeContext
- **Mobile:** Bottom navigation, PWA with service worker + IndexedDB

## Project Status (All 3 Phases Complete — 2026-04-05)

### Phase 1 — Foundation Hardening (Complete)
- Shared API infrastructure (`app/lib/api/`)
- 15 core routes migrated to shared helpers with Zod validation
- Stripe hardened (`app/lib/stripe/` — idempotency, dynamic checkout, 14-day trial)
- AI consolidated to OpenRouter (`app/lib/ai/openrouter.ts`)
- Dead code removed, dashboard split, security audit + 13 fixes

### Phase 2 — The Moat (Complete)
- **BankID** via Idura GraphQL (`app/lib/signing/`) — signing routes + webhook
- **PEPPOL** via peppol.sh REST (`app/lib/peppol/`) — send endpoint at `/api/invoices/[id]/peppol`
- **Skatteverket ROT** — valid Begaran.xsd v6 XML, download at `/api/rot/[id]/download-xml`
- **Fortnox/Visma** — update support, mapper validation, health dashboard, OAuth CSRF

### Phase 3A — Core Platform (Complete)
- **Legal Fortress** — mandatory 6-step ÄTA workflow (`app/api/ata/v2/`) with immutable audit trail (`ata_audit_trail`), BankID approval, auto-invoice generation
- **Document Management** — BSAB/CoClass folders (`app/lib/documents/folders.ts`), versioning, sharing, upload to Supabase Storage (`project-documents` bucket)
- **Customer Portal** — JWT login (`app/lib/portal/auth.ts`), dashboard, project view, messaging, ÄTA approval

### Phase 3B — Field & Operations (Complete)
- **Drawing Markup** — annotation CRUD on documents (cloud, arrow, text, pin, measurement)
- **Safety & Compliance** — certificate tracking with expiry alerts, incident reporting, site inductions
- **Team Scheduling** — conflict detection, force override
- **Subcontractor Management** — CRUD, project assignments, F-skatt verification stub

### Phase 3C — Intelligence & Mobile (Complete)
- **Material Price Engine** — Byggmax scraper with cheerio, nightly cron, full-text search, price comparison, tenant alerts
- **Reporting & BI** — profitability, utilization, cash flow forecast, saved reports, JSON/CSV export
- **React Native Mobile** — Expo foundation (`mobile/`), tab navigation, auth store, API client (placeholder screens)

### Stats
- **119 unit tests**, 11 suites, all passing
- **TypeScript strict**: zero errors
- **51 commits** across all phases
- **Cron jobs**: 8 scheduled (original 7 + nightly price scraper)

### What's Next
- Frontend UI for new Phase 3 features (ÄTA workflow pages, document browser, safety dashboard, etc.)
- PDF.js drawing viewer integration (frontend for annotation data layer)
- Mobile app screen implementation (beyond placeholders)
- Remaining ~170 API routes to migrate to shared helpers (as touched)
- Deploy migrations to Supabase production
- End-to-end testing for new workflows

See `docs/superpowers/specs/2026-04-05-frost-solutions-v2-overhaul-design.md` for full spec.

## Environment Variables

See `.env.example` for all variables. Required:
- Supabase URL + keys
- `OPENROUTER_API_KEY` (single AI provider)
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID`
- `IDURA_CLIENT_ID`, `IDURA_CLIENT_SECRET`, `IDURA_WEBHOOK_SECRET` (BankID signing)
- `PEPPOL_API_KEY` (e-invoicing)
- Encryption keys (integration tokens, personnummer)
