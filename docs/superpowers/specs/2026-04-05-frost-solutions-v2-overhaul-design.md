# Frost Solutions V2 — Complete Platform Overhaul

**Date:** 2026-04-05
**Author:** Vilmer Frost + Claude
**Status:** Approved

---

## Vision

**"One tool that replaces everything a Swedish construction company uses."**

Frost Solutions becomes the all-in-one platform: project management, time tracking, invoicing, payroll, ROT-avdrag, document management, drawing markup, safety compliance, material procurement, legal protection, and accounting integration — all in one place.

**Sales hook:** "Missa aldrig en ÄTA-faktura igen" (Never miss an ÄTA invoice again)

**Competitive moat:** Legal Fortress (ÄTA protection), first-to-market Skatteverket/BankID/PEPPOL, material price engine (no competitor has this), unlimited users per project (vs Bygglet's per-user model).

---

## Approach

Phased overhaul — three phases that interleave quality with features. No shortcuts. Every piece done properly. No active users currently, so we can restructure freely.

- **Phase 1:** Foundation hardening — make what exists production-grade
- **Phase 2:** Complete the moat — finish the differentiating integrations
- **Phase 3:** Expand to all-in-one — add every module that replaces a competitor

---

## Phase 1 — Foundation Hardening

Goal: every existing feature becomes production-grade. When this phase is done, you could hand the app to a paying customer and sleep well.

### 1.1 Code Quality Overhaul

- Audit every API route (162+) — validate error handling, Zod input validation on every endpoint, proper HTTP status codes, consistent response shapes
- Split DashboardClient.tsx (~26KB) into focused, testable sub-components: stats widget, activity feed, quick actions, charts — each independent
- Remove all legacy code — localStorage tenant fallback, dead imports, unused stubs
- Consistent API route pattern: auth check -> input validation -> business logic -> response. No exceptions.
- TypeScript strictness — eliminate all `any` types, remove all `@ts-ignore`

### 1.2 Stripe Hardening

- Webhook idempotency — deduplicate events using Stripe event ID stored in a `stripe_events` table, check before processing
- Replace hardcoded payment link with dynamic Stripe Checkout session creation
- Fix API version — use latest stable, not test version (`2025-12-15.clover`)
- Dead letter handling — log failed webhook payloads for manual replay
- Idempotency keys on all outbound Stripe calls
- Grace period fix — use dedicated `past_due_since` column, not `updated_at`
- Yearly vs monthly toggle with clear savings displayed

### 1.3 AI Provider Consolidation

- OpenRouter as single provider (Gemini Flash 3.1 Preview as default model)
- One SDK, one API key, model selection per task type
- Keep Tesseract.js for offline/client-side OCR fallback only
- Remove Gemini SDK, Groq SDK, OpenAI SDK direct imports (migration already in progress by another agent)
- Standardize AI response handling — consistent error handling, retry with backoff, timeout management, cost tracking per call

### 1.4 Testing

- Unit tests for all business logic — payroll calculations, OB type determination, ROT rules, budget calculations
- Integration tests for critical API routes — auth flows, Stripe webhooks, time entry CRUD, invoice creation
- E2E tests for core user journeys — signup -> onboarding -> create project -> log time -> generate invoice -> export payroll
- No mocking the database — test against real Supabase (local or test project)

### 1.5 Security Audit

- Verify RLS policies on every table — test that tenant A cannot read tenant B's data
- Rate limiting on all public-facing endpoints
- Input sanitization — verify no XSS vectors in user-generated content
- API route auth — verify every route checks authentication
- Dependency audit — check for known vulnerabilities in npm packages

---

## Phase 2 — Complete the Moat

Goal: finish the features that make Frost Solutions impossible to dismiss. First-to-market on Skatteverket, BankID, and PEPPOL in this segment.

### 2.1 BankID Integration

- Provider: Idura (API-first, lower startup cost than direct BankID integration)
- Digital signing for contracts, quotes, invoices, work orders, and ÄTA approvals
- Customer receives signing request -> opens BankID on phone -> document is legally signed
- Store signature proof (transaction ID, timestamp, personnummer hash) for legal compliance
- Integrate into customer portal — no account needed to sign
- Support both Swedish BankID and mobile BankID
- Fallback: Freja eID and simple email-link signing for non-BankID users

### 2.2 PEPPOL E-Invoicing

- Send and receive electronic invoices via the PEPPOL network
- Auto-generate PEPPOL-compliant XML (BIS Billing 3.0) from existing invoice data
- Integrate with a Swedish access point provider (InExchange or Pagero)
- Receive inbound e-invoices directly into supplier invoice module
- Automatic matching: inbound PEPPOL invoice -> existing project/supplier -> ready for approval
- Replaces a separate e-invoicing tool many companies pay for

### 2.3 Skatteverket Direct Submission

- ROT/RUT applications submitted directly to Skatteverket's API — no manual filing
- Real-time status polling (already stubbed, needs completion)
- Auto-fill from project data: property designation, worker personnummer, labor costs
- Validation against Skatteverket rules before submission
- Support for corrections and appeals through the API
- Audit trail of all submissions with timestamps and response codes

### 2.4 Fortnox & Visma Hardening

- Full bidirectional sync — push and pull changes (accountant edits in Fortnox -> reflects in Frost)
- Conflict resolution: detect when same record modified in both systems
- Sync health dashboard: last sync time, error count, records pending, manual retry for failed syncs
- Fortnox modules: invoices, customers, articles, bookkeeping entries
- Visma payroll export: PAXML format, employer contributions, tax tables

### 2.5 Subscription & Billing Polish

- Dynamic Stripe Checkout — no hardcoded links
- Yearly vs monthly toggle with savings displayed
- AI credit purchase flow cleaned up — clear balance display, usage history, low-balance alerts
- Proper invoice history with downloadable PDFs
- Upgrade/downgrade flow ready for tier expansion

---

## Phase 3 — The All-in-One That Kills Every Competitor

Goal: every tool a Swedish construction company currently pays for separately gets replaced by Frost Solutions. Broken into sub-phases, each delivering a shippable module.

### 3.1 Legal Fortress — ÄTA Protection Engine

The core differentiator. Swedish construction companies lose an estimated 2-3 billion SEK annually to undocumented extra work. No competitor does this properly.

**Mandatory ÄTA workflow:**
1. Worker identifies change -> creates ÄTA with photos (mandatory for unforeseen types)
2. Admin reviews -> sets pricing, timeline impact
3. Push notification to customer with approval link
4. Customer approval via digital signature (BankID preferred)
5. Work authorized -> execution tracked
6. Invoice auto-generated with all documentation attached

**Legal shield:**
- Every step timestamped, hashed, with IP/device/geolocation
- Immutable audit trail (blockchain-style hash chain)
- AB04/ABT06 compliant contract templates auto-filled from project data
- All documentation attached to invoice for payment proof — legally defensible in court

**Pre-project credit checks:**
- Integration with Roaring.io or SCB + Allabolag APIs
- Automatic risk scoring: GREEN (>70, normal terms), YELLOW (40-70, require 50% upfront), RED (<40, block or require full prepayment)
- Credit check results stored and factored into project setup

### 3.2 Document Management / Binder (iBinder Replacement)

Digital project binders with standardized structure per BSAB/CoClass:
- 01-Ritningar (Drawings): A/K/E/VS subdivisions
- 02-Beskrivningar (Specifications)
- 03-Administrativt (Admin): permits, meeting notes, schedules
- 04-Avtal (Contracts) — restricted access
- 05-Ekonomi (Finance) — restricted access
- 06-Foton (Photos): before/during/after
- 07-KMA (Quality/Safety)

**Features:**
- Automatic versioning: upload same filename = auto v1, v2, v3 with full history
- RBAC permissions: Admin/PM (full), Site Supervisor (read/write except contracts/finance), Worker (read-only + photo upload), Subcontractor (view drawings/specs only), Client (view-only specific folders)
- External sharing: secure links with expiry + password, QR codes for on-site access
- Required document checklists: project can't close until all required docs uploaded
- AI auto-tagging and categorization of uploaded documents
- Full-text search powered by AI (OCR PDFs, extract text, index everything)
- Unlimited free collaborators (iBinder's model — viral adoption)
- Mobile upload: snap photo on-site, lands in correct project folder
- Drag & drop, right-click context menu, online/offline support

### 3.3 Drawing Markup (Bluebeam Lite)

Not full Bluebeam (overkill), but the features construction PMs use daily:

- PDF.js viewer with cloud, arrow, text, highlight annotations
- Scale-accurate measurement: length, area, count after calibration
- Revision comparison: overlay two drawing versions, highlight differences
- Issue pinning: drop a pin on a location, create a work order from it
- Markup-to-task: annotations become actionable items assigned to workers
- Mobile support: view and annotate on-site from phone/tablet

### 3.4 Safety & Compliance (SSG Replacement)

Replace the SSG card + scattered compliance tools:

- Certificate tracking per employee: Heta Arbeten, lift certs, ID06, first aid — with automatic expiry alerts
- Digital site induction (arbetsplatsintroduktion): required sign-off before first day on site
- Incident/near-miss reporting from mobile with photos, location, timestamp
- Risk assessment templates per work type
- Personalliggare integration: digital check-in/check-out log (Skatteverket requirement)
- Multi-language support: critical for Swedish construction's international workforce
- Compliance export: Arbetsmiljöverket-ready reports
- QR/NFC-based site check-in (modernize SSG's card reader approach)

### 3.5 Material Price Engine (Blue Ocean — No Competitor Has This)

There is no real-time B2B price comparison tool for Swedish construction materials today. Fyndabyggvaror is dead, Byggvarulistan is a blog.

- Nightly scraper: crawl public catalog prices from Byggmax (Magento 2), Beijer, XL-Bygg, Ahlsell, K-Rauta
- Cron job at 23:59 — scrape, normalize, store in `supplier_price_lists` / `supplier_items` tables (already specced in FEATURE_SPECIFICATIONS.md)
- Material list builder: user builds a project material list, system shows cheapest source per item
- Price alerts: "plywood dropped 15% at Byggmax" notification
- Link to project budgets: material costs flow directly into project cost tracking
- Supplier price list upload: contractors upload their negotiated contract prices (CSV), system compares against public prices
- OCR receipts: snap a photo of a material receipt, auto-extract items and prices into the project
- Fuzzy matching against supplier items using Levenshtein distance (already specced)
- Future: API partnerships with retailers (Ahlsell has the most sophisticated platform) for real contract prices

### 3.6 Team Scheduling & Resource Planning

- Weekly/monthly calendar view: drag-and-drop assignment of workers to projects
- Conflict detection: can't double-book a worker
- Capacity overview: who's overbooked, who has availability
- Scheduled vs actual: compare planned hours against time entries
- Absence integration: vacation, sick leave, parental leave visible on schedule
- GPS clock-in/out with 500m geofencing (already partially built)
- Working time compliance: automatic Arbetstidslagen checks (max hours, mandatory rest periods)
- Shift swap: workers request trades, manager approves

### 3.7 Customer Portal & Communication

Expand existing public links into a full customer portal:

- Customer login: see all their projects, invoices, documents, progress
- Progress updates: PM posts update with photos, customer notified
- Project message thread: structured communication, replaces email
- Quote approval: review in portal, approve, sign with BankID
- ÄTA approval: the critical flow — customer approves change orders here with full legal documentation
- Invoice payment: pay directly via Stripe or Swish
- Dagbok (daily log): automated prompts to PM, visible to customer
- Satisfaction survey after project completion

### 3.8 Subcontractor Management

- Registry with org.nr, F-skatt verification against Skatteverket (automated check before engaging)
- Assign to projects with defined scope and budget
- Subcontractor portal: limited access to upload timesheets and invoices
- Insurance & certification verification
- Payment tracking: invoiced vs paid vs outstanding

### 3.9 Reporting & Business Intelligence

- Dashboard overhaul: real-time KPIs — revenue, margins, utilization rate, project profitability
- Custom report builder: select metrics, date range, filters, export as PDF/Excel
- Profitability per project, per client, per employee
- Cash flow forecasting: based on outstanding invoices + upcoming payroll + planned expenses
- AI-powered predictions: budget overrun risk, delay probability, client payment patterns
- Comparison reports: this month vs last month, this year vs last year
- Automated monthly reports emailed to company owner/manager

### 3.10 Mobile App (React Native / Expo)

Native app for field workers:

- Framework: Expo React Native with Expo Router
- State: Zustand
- Offline: WatermelonDB for sync when on-site with no signal
- Camera integration: ÄTA photos, receipt scanning, material identification
- Push notifications: ÄTA approvals, schedule changes, budget alerts
- GPS geofencing: automatic clock-in when arriving at job site
- Voice-to-ÄTA: Whisper speech-to-text for hands-free reporting
- Bottom nav: Home | Projects | + (New ÄTA) | Time | Profile

---

## Pricing Model

Shift from flat 499 SEK/month to per-project pricing with free tier:

| Tier | Price | Includes |
|------|-------|----------|
| FREE | 0 SEK | 1 active project, unlimited users, 2GB storage, basic ÄTA, email signing |
| PRO | 499 SEK/project/month | Unlimited projects, 5GB/project, BankID, SMS, full audit trail, all integrations |
| ENTERPRISE | Custom | Credit checks, API access, SSO, dedicated support |

**Rationale:** Construction companies hate per-user pricing (won't add apprentices). Per-project justifies cost directly. Unlimited users per project drives viral adoption within companies. Free tier creates trial funnel.

---

## Estimated Monthly Infrastructure Costs

| Service | Cost |
|---------|------|
| Supabase Pro | ~260 SEK |
| Vercel Pro | ~210 SEK |
| Idura (BankID) | 500-1,000 SEK |
| Bird (SMS) | 50-200 SEK |
| OpenRouter (AI) | Variable, usage-based |
| Material scraper compute | Minimal (cron job) |
| **Total Phase 1-2** | **~1,200-2,000 SEK/month** |
| **Total Phase 3+** (with credit scoring) | **~2,700-4,000 SEK/month** |

---

## Tech Decisions

| Component | Choice | Rationale |
|-----------|--------|-----------|
| AI Provider | OpenRouter (Gemini Flash 3.1 Preview) | One SDK, one key, all models |
| E-signing | Idura | API-first, cheaper than direct BankID |
| SMS | Bird | Cheapest in Sweden (0.20 kr/SMS) |
| Credit Checks | Roaring.io / SCB + Allabolag | Free API for MVP, paid for scale |
| Voice-to-text | OpenAI Whisper (via OpenRouter) | Best accuracy for Swedish |
| Drawing Viewer | PDF.js + canvas annotations | No Bluebeam licensing, good enough |
| Mobile App | Expo React Native | Native camera, offline, push |
| Offline DB (mobile) | WatermelonDB | Best offline-first for RN |
| PEPPOL Access Point | InExchange or Pagero | Swedish providers, established |
| Material Scraping | Custom scrapers per retailer | No existing API partnerships |

---

## Competitors Replaced

| Tool | What it does | Frost Solutions module |
|------|-------------|----------------------|
| iBinder | Document management | 3.2 Binder/DMS |
| Bluebeam | Drawing markup | 3.3 Drawing Markup |
| SSG Entre | Safety compliance | 3.4 Safety & Compliance |
| Bygglet | Project management | Existing + enhancements |
| Planday | Scheduling | 3.6 Scheduling |
| Fortnox | Accounting | Phase 2 integration |
| Visma | Payroll | Phase 2 integration |
| Separate ROT tool | Tax deductions | Existing + Skatteverket direct |
| Excel | Everything else | Eliminated |

---

## What Already Exists vs What Needs Building

| Module | Current State | Work Needed |
|--------|--------------|-------------|
| Time Tracking | Fully implemented | Polish, GPS hardening |
| Projects | Fully implemented | Add Legal Fortress layer |
| Invoicing | Fully implemented | Add PEPPOL, BankID signing |
| Payroll | Fully implemented | Harden Visma export |
| ROT-avdrag | Mostly complete | Complete Skatteverket API |
| ÄTA/Change Orders | Basic CRUD exists | Full Legal Fortress workflow |
| Supplier Invoices | Fully implemented with OCR | Add PEPPOL inbound |
| Materials | Basic CRUD | Add price engine, scraper |
| Fortnox Integration | Working | Harden, add bidirectional sync |
| Visma Integration | Working | Harden, add bidirectional sync |
| Stripe | Functional, has reliability gaps | Phase 1 hardening |
| Binder/DMS | Not implemented | Full build from spec |
| Drawing Markup | Not implemented | Full build |
| Safety/Compliance | Basic KMA exists | Expand to full SSG replacement |
| BankID | Stub only | Full build via Idura |
| PEPPOL | Stub only | Full build via access point |
| Scheduling | Partial | Full build |
| Credit Checks | Not implemented | Full build |
| Customer Portal | Basic public links | Full expansion |
| Mobile App | PWA only | React Native build |
| Material Price Engine | Not implemented | Full build |
| Subcontractor Mgmt | Not implemented | Full build |
| Reporting/BI | Basic | Dashboard overhaul + report builder |

---

## Non-Goals (Explicitly Out of Scope)

- Full BIM/3D modeling integration (too complex, low ROI for target segment)
- ERP-level accounting (Fortnox/Visma handles this, we sync)
- Custom workflow builder (predefined workflows cover 95% of cases)
- White-labeling / multi-brand
- Non-Swedish markets (focus on Sweden first, Nordic expansion later)
