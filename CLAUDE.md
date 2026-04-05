# Frost Solutions - AI-Driven SaaS for Swedish Construction

## What This Is

AI-powered project management, time tracking, invoicing, and payroll platform built for Swedish construction companies ("byggforetag"). Live at **frostsolutions.se** with the app served under **/app** basePath.

**Price:** 499 SEK/month | **Language:** Swedish UI | **Market:** Nordic construction & blue-collar businesses

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, basePath: `/app`) |
| Language | TypeScript 5.6 (strict mode) |
| UI | React 19, Tailwind CSS 3.4, shadcn/ui, Framer Motion |
| State | Zustand + React Query 5 (with offline persistence) |
| Database | Supabase (PostgreSQL 15+, RLS on all tables) |
| Auth | Supabase Auth (Google/Microsoft OAuth + Magic Link) |
| AI | Google Gemini 2.0, Groq Llama 3.3, OpenAI GPT-4 |
| Payments | Stripe |
| Email | Resend |
| Integrations | Fortnox, Visma eAccounting, Skatteverket |
| Monitoring | Sentry |
| Hosting | Vercel (GitHub integration) |
| Package Manager | pnpm |

## Architecture

### Multi-Tenant Isolation
- Every table has `tenant_id` with Row Level Security (RLS)
- Tenant resolution priority: JWT claims -> API -> localStorage -> DB lookup
- `TenantContext` provider wraps the entire app
- Middleware handles session refresh and tenant detection

### basePath: '/app'
- The app is served from `frostsolutions.se/app` (root domain = marketing site)
- Middleware paths are ALREADY stripped of `/app` prefix
- Router.push/replace must NOT include `/app` (Next.js adds it automatically)
- Redirect URLs for OAuth callbacks must include `/app` prefix
- **This is the #1 source of routing bugs** - never double-prefix

### Key Directories
```
app/
  api/           # 162+ API route handlers
  components/    # 149+ React components (shadcn/ui base)
  lib/           # 68 utility/service modules
  hooks/         # 36 custom hooks
  types/         # TypeScript type definitions
  context/       # TenantContext, ThemeContext
  (auth-routes)/ # login, signup, onboarding, password-setup
supabase/
  functions/     # Edge functions (parse-invoice, watchdog, dynamic-api)
  migrations/    # SQL migrations
  rpc/           # PostgreSQL stored procedures
middleware.ts    # Session & tenant middleware
```

## Key Commands

```bash
pnpm dev              # Dev server at localhost:3000/app (uses webpack, NOT turbopack)
pnpm build            # Production build
pnpm lint             # ESLint
pnpm typecheck        # TypeScript strict check
pnpm test             # Jest unit tests
pnpm test:e2e         # Playwright E2E tests
```

## Infrastructure

- **Supabase project ref:** `rwgqyozifwfgsxwyegoz` (West EU - Ireland)
- **Vercel project:** `vilmer-frosts-projects/frost-solutions-1`
- **GitHub repo:** `vilmerfrost/frost-solutions`
- **Supabase CLI:** Already linked to project
- **Vercel CLI:** Already linked to project

## Database (50+ tables)

Core: `tenants`, `employees`, `clients`, `projects`, `time_entries`, `invoices`, `payroll_periods`, `rot_applications`, `materials`, `suppliers`, `work_orders`, `quotes`, `notifications`, `audit_logs`

Integration: `integrations` (encrypted OAuth tokens), `integration_syncs`, `subscription_data`

All tables use RLS. Sensitive data (personnummer) is encrypted for GDPR compliance.

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

## Feature Modules

### Core
- **Time Tracking** - OB types (evening/night/weekend), GPS geofencing, approval workflows, CSV export
- **Projects** - Budget tracking, ROT/RUT property support, AI summaries
- **Invoicing** - OCR-powered processing (Gemini 2.0), PEPPOL stub, PDF generation
- **Payroll** - Swedish 2025 rules, OB calculations, Fortnox/Visma export (PAXML/CSV/JSON)
- **ROT-Avdrag** - Skatteverket integration, personnummer encryption, status polling

### AI (18 endpoints under /api/ai/)
- Invoice/receipt/delivery note OCR
- Material identification from photos
- Budget predictions, project insights
- Payroll validation, KMA suggestions
- Monthly report generation, AI chatbot

### Integrations
- **Fortnox** - OAuth + bidirectional sync
- **Visma eAccounting** - OAuth + payroll
- **Stripe** - Payments + webhook handling
- **Factoring (Resurs)** - Invoice factoring offers

### Other
- Customer portal (public links, no-login access)
- Work orders, quotes, delivery notes
- Materials & supplier management
- KMA checklists, ATA/ÄTA documents
- Notification system (in-app + email via Resend)
- Audit logging (SOC2-ready)

## Coding Conventions

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

## Known Issues & Incomplete Features

- **AWS Textract** - Stubs exist, not fully implemented (using Gemini OCR instead)
- **BankID integration** - Stub ready, not implemented
- **PEPPOL e-invoicing** - Stub ready, not implemented
- **Quote/Material templates** - API route TODOs
- **Legacy localStorage tenant fallback** - Marked for removal
- **DashboardClient.tsx** - Large component (~26KB), should be split
- **Landing page SEO** - Fully client-rendered, no SSR content for crawlers

## CLI Tools Available

| CLI | Purpose |
|-----|---------|
| `supabase` | Linked to project `rwgqyozifwfgsxwyegoz`. Push/pull migrations, generate types |
| `vercel` | Linked to `vilmer-frosts-projects/frost-solutions-1`. Deploy, manage env vars |
| `gh` | GitHub CLI. PRs, issues, Actions |
| `stripe` | Stripe CLI. Listen to webhooks locally, trigger test events, inspect resources |
| `ports` | See what's running on ports, kill orphaned processes |

## Environment Variables

See `.env.example` for all variables. Required:
- Supabase URL + keys
- AI provider keys (OpenRouter — migrating from Gemini/Groq/OpenAI to single provider)
- Stripe keys
- Encryption keys (integration tokens, personnummer)

## Security

- RLS on all tables
- GDPR-compliant personnummer encryption
- Rate limiting on critical endpoints
- Input validation with Zod
- HTTP security headers (X-Frame-Options, CSP, etc.)
- Encrypted integration token storage
- Audit logging for all critical operations
- Console stripping in production (except errors)
