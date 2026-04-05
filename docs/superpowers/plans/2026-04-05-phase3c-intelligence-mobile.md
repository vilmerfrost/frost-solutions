# Phase 3C: Intelligence & Mobile — Material Prices, Reporting, Mobile App Foundation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the material price comparison engine (blue ocean — no competitor has this), business intelligence reporting, and the React Native mobile app foundation.

**Architecture:** Material price engine uses a nightly cron scraper storing prices in `supplier_catalog_items`. Reporting aggregates data across all modules via dedicated query endpoints. Mobile app is an Expo React Native project in a `/mobile` directory sharing types with the web app.

**Tech Stack:** Next.js 16, Supabase, Cheerio (HTML scraping), Expo React Native, Zustand, Recharts

---

## Task 1: Database Schema

**Files:**
- Create: `supabase/migrations/phase3c_intelligence.sql`

- [ ] **Step 1: Create migration**

```sql
-- Phase 3C: Material Price Engine + Reporting

-- Scraped supplier catalog items
CREATE TABLE IF NOT EXISTS public.supplier_catalog_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_name TEXT NOT NULL,
  supplier_url TEXT,
  product_name TEXT NOT NULL,
  product_url TEXT,
  category TEXT,
  sku TEXT,
  price_sek NUMERIC(10,2) NOT NULL,
  unit TEXT DEFAULT 'st',
  in_stock BOOLEAN,
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  previous_price_sek NUMERIC(10,2),
  price_change_percent NUMERIC(5,2)
);
CREATE INDEX idx_catalog_supplier ON public.supplier_catalog_items(supplier_name);
CREATE INDEX idx_catalog_category ON public.supplier_catalog_items(category);
CREATE INDEX idx_catalog_scraped ON public.supplier_catalog_items(scraped_at);
CREATE INDEX idx_catalog_product_name ON public.supplier_catalog_items USING gin(to_tsvector('swedish', product_name));

-- Material price alerts per tenant
CREATE TABLE IF NOT EXISTS public.material_price_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  product_name_pattern TEXT NOT NULL,
  threshold_percent NUMERIC(5,2) NOT NULL DEFAULT 10,
  direction TEXT NOT NULL DEFAULT 'drop' CHECK (direction IN ('drop', 'rise', 'both')),
  active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.material_price_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation" ON public.material_price_alerts FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);
CREATE POLICY "Service role" ON public.material_price_alerts FOR ALL USING (auth.role() = 'service_role');

-- Saved reports
CREATE TABLE IF NOT EXISTS public.saved_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  name TEXT NOT NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('profitability', 'utilization', 'cashflow', 'project_status', 'custom')),
  config JSONB NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES public.employees(id),
  schedule TEXT,
  last_generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.saved_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation" ON public.saved_reports FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);
CREATE POLICY "Service role" ON public.saved_reports FOR ALL USING (auth.role() = 'service_role');
```

- [ ] **Step 2: Commit**

---

## Task 2: Material Price Engine — Scraper

**Files:**
- Create: `app/lib/scraper/suppliers.ts`
- Create: `app/api/cron/scrape-prices/route.ts`
- Create: `app/api/materials/prices/route.ts`
- Create: `app/api/materials/prices/compare/route.ts`
- Create: `app/api/materials/prices/alerts/route.ts`

- [ ] **Step 1: Create supplier scraper**

`app/lib/scraper/suppliers.ts`:
- Install cheerio: `pnpm add cheerio`
- Define scraper interface: `{ name, baseUrl, scrapeCategory(url): Promise<CatalogItem[]> }`
- Implement Byggmax scraper (Magento 2 — structured product pages)
- Each scraper: fetch HTML → parse with cheerio → extract product name, price, SKU, stock status
- Rate limiting: 1 request per 2 seconds per supplier
- Compare with previous prices, calculate price_change_percent

- [ ] **Step 2: Create cron endpoint**

`app/api/cron/scrape-prices/route.ts`:
- Runs nightly at 23:59 (add to vercel.json)
- CRON_SECRET auth
- Scrapes each supplier's categories
- Upserts into supplier_catalog_items (keyed by supplier_name + sku)
- Stores previous_price_sek before updating

- [ ] **Step 3: Create price search API**

`app/api/materials/prices/route.ts`:
- GET with `?q=plywood&category=trä` — full-text search on supplier_catalog_items
- Returns results sorted by price_sek ascending
- No tenant auth needed (public catalog data)

`app/api/materials/prices/compare/route.ts`:
- POST with `{ items: [{ name, quantity }] }` — builds a material list and shows cheapest source per item
- Requires auth (tenant feature)

- [ ] **Step 4: Create price alerts**

`app/api/materials/prices/alerts/route.ts`:
- GET/POST — tenant can set alerts for price drops/rises on specific products
- Requires auth

- [ ] **Step 5: Update vercel.json**

Add cron entry:
```json
{ "path": "/api/cron/scrape-prices", "schedule": "59 23 * * *" }
```

- [ ] **Step 6: Commit**

---

## Task 3: Reporting & Business Intelligence API

**Files:**
- Create: `app/api/reports/profitability/route.ts`
- Create: `app/api/reports/utilization/route.ts`
- Create: `app/api/reports/cashflow/route.ts`
- Create: `app/api/reports/saved/route.ts`
- Create: `app/api/reports/export/route.ts`

- [ ] **Step 1: Profitability report**

GET `/api/reports/profitability?period=2026-03&groupBy=project`:
- Revenue per project (from invoices)
- Costs per project (from time entries * hourly rate + material costs + supplier invoices)
- Margin = revenue - costs
- Can group by: project, client, employee

- [ ] **Step 2: Utilization report**

GET `/api/reports/utilization?period=2026-03`:
- Hours worked per employee
- Billable vs non-billable split
- Overtime analysis
- Capacity (scheduled hours vs actual)

- [ ] **Step 3: Cash flow forecast**

GET `/api/reports/cashflow?months=3`:
- Outstanding invoices (expected inflow by due_date)
- Upcoming payroll (estimated from active employees)
- Known expenses (supplier invoices)
- Net cash flow per month

- [ ] **Step 4: Saved reports CRUD**

GET/POST `/api/reports/saved` — save/list report configurations
Can be scheduled for email delivery (config stored, cron picks up later)

- [ ] **Step 5: Export endpoint**

POST `/api/reports/export` with `{ reportType, period, format: 'json' | 'csv' }`:
- Generates report data
- Returns as JSON or CSV download

- [ ] **Step 6: Commit**

---

## Task 4: React Native Mobile App Foundation

Create the Expo project structure with navigation, auth, and the main screens.

**Files:**
- Create: `mobile/` directory with Expo project
- This is a foundation — screens will be built out in future iterations

- [ ] **Step 1: Initialize Expo project**

```bash
cd /Users/vilmerfrost/Projects/frost-solutions-1
npx create-expo-app mobile --template blank-typescript
cd mobile
npx expo install expo-router expo-secure-store
pnpm add zustand react-native-safe-area-context
```

- [ ] **Step 2: Create app structure**

```
mobile/
  app/
    (tabs)/
      index.tsx          # Home dashboard
      projects.tsx       # Project list
      time.tsx           # Time tracking
      profile.tsx        # User profile
    _layout.tsx          # Tab navigator layout
    login.tsx            # Login screen
  lib/
    api.ts               # API client (fetch wrapper pointing to frostsolutions.se/app/api)
    auth.ts              # Auth state (Zustand store + SecureStore)
    types.ts             # Shared types
  package.json
  tsconfig.json
```

- [ ] **Step 3: Create API client**

`mobile/lib/api.ts`:
```typescript
const API_BASE = 'https://frostsolutions.se/app/api'

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = await getAuthToken()
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options?.headers,
    },
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}
```

- [ ] **Step 4: Create auth store**

`mobile/lib/auth.ts` — Zustand store with SecureStore persistence for tokens.

- [ ] **Step 5: Create placeholder screens**

Each screen is a minimal placeholder showing the screen name and a "Coming soon" message. The real UI will be built in future iterations.

- [ ] **Step 6: Commit**

```bash
git add mobile/
git commit -m "feat: React Native mobile app foundation (Expo + navigation + auth)"
```

---

## Completion Criteria

- [ ] `supplier_catalog_items` table for price data
- [ ] Material price scraper (at least Byggmax) with cron
- [ ] Price search and comparison endpoints
- [ ] Price alerts per tenant
- [ ] Profitability, utilization, and cash flow report endpoints
- [ ] Saved reports CRUD
- [ ] Report export (JSON/CSV)
- [ ] Expo mobile app initialized with tab navigation
- [ ] Mobile API client and auth store
- [ ] `pnpm typecheck` and `pnpm test` pass (web app)
