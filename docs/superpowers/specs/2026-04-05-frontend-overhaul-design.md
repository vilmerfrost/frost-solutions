# Frost Solutions Frontend Overhaul — Design Spec

**Date:** 2026-04-05
**Author:** Vilmer Frost + Claude
**Status:** Approved

---

## Vision

Build frontend UI for every backend API created in Phases 1-3, plus overhaul the design system from cold sky-blue to warm Base44-inspired amber + stone aesthetic. All 10 new feature areas get full pages. Existing pages inherit the warm palette automatically via token changes.

---

## Part 1: Warm Design System Overhaul

### Color Shift (5 files)

| Token | Current (Cold) | New (Warm) |
|-------|---------------|------------|
| Primary | Sky `#0EA5E9` | Amber `#F59E0B` |
| Gray scale | Slate (blue undertone) | Stone (brown undertone) |
| Background | `#F8FAFC` (cold) | `#FAFAF9` (warm off-white) |
| Shadows | `rgba(0,0,0,x)` | `rgba(28,25,23,x)` |
| Dark bg | `#0F172A` slate | `#1C1917` charcoal |
| Dark surface | `#1E293B` | `#292524` |
| Dark border | `#334155` | `#44403C` |

**Accessibility:** Primary buttons use `text-gray-900` (dark text on amber), not `text-white`. Contrast: ~8.5:1.

**Files to change:**
1. `tailwind.config.js` — primary (amber scale), gray (stone scale), boxShadow
2. `app/globals.css` — CSS variables, `.btn-primary` text color, focus rings, rename header
3. `app/components/ui/button.tsx` — primary variant: `text-white` → `text-gray-900`
4. `app/layout.tsx` — `themeColor: "#0ea5e9"` → `"#D97706"`
5. Any component hardcoding `text-white` on `bg-primary-*` backgrounds

**Automatic cascade:** All 149+ existing components use `gray-*` and `primary-*` tokens via Tailwind, so the config swap ripples through everything with zero code changes.

---

## Part 2: Role-Based Sidebar Navigation

### Sidebar Groups

```
── ÖVERSIKT ──
  📊 Kontrollpanel          (all roles)

── PROJEKT ──
  📁 Projekt                (all roles)
  📄 Dokument               (admin, supervisor)
  📐 Ritningar              (admin, supervisor)
  🔄 ÄTA-hantering          (admin, supervisor)

── TID & PERSONAL ──
  ⏱ Tidrapportering         (all roles)
  📅 Schemaläggning         (admin)
  👷 Anställda              (admin)
  🏗 Underentreprenörer     (admin)

── EKONOMI ──
  💰 Fakturering            (admin)
  📊 Lönehantering          (admin)
  🏠 ROT-avdrag             (admin)
  📈 Rapporter              (admin)

── SÄKERHET ──
  🛡 KMA & Säkerhet         (all roles)
  🏪 Materialpriser         (admin, supervisor)

── KUNDPORTAL ──
  👤 Kunder                 (admin)
  📝 Avtal & Signering      (admin)
```

Workers see: Dashboard, Projects, Time Tracking, KMA & Safety.
Supervisors add: Documents, Drawings, ÄTA, Material Prices.
Admins see everything.

### Implementation
- Modify `app/components/Sidebar.tsx` (or `SidebarClient.tsx`)
- Add role check using existing `useAdmin()` hook + new `useRole()` hook
- Collapsible section groups with localStorage persistence

---

## Part 3: New Feature Pages (10 areas)

### Page 1: ÄTA-hantering (`/ata`)
**Layout:** Kanban pipeline — 5 columns (Skapad → Granskad → Väntar Kund → Godkänd → Fakturerad)
**Cards:** ÄTA name, type (förutsedd/oförutsedd), price, photo count, status indicator
**Detail view:** Click card → slide-out panel or full page with:
- Audit trail timeline (hash-verified chain)
- Photos gallery
- Pricing breakdown (labor hours × rate + materials)
- BankID signing status
- Linked invoice
**Actions:** + Ny ÄTA button, send for approval, generate invoice
**API routes:** `/api/ata/v2/create`, `/api/ata/v2/[id]/review`, `/api/ata/v2/[id]/send-approval`, `/api/ata/v2/[id]/approve`, `/api/ata/v2/[id]/generate-invoice`, `/api/ata/v2/[id]/verify-chain`

### Page 2: Dokument (`/projects/[id]/documents`)
**Layout:** Two-pane — folder tree (left, 240px) + file list (right)
**Folder tree:** BSAB/CoClass 7 folders with subfolders, restricted badges on 04-Avtal and 05-Ekonomi
**File list:** Rows with filename, AI tags, version number, size, date, actions menu
**Features:** Drag-drop upload zone, auto-versioning indicator, required-but-missing docs in orange dashed border, checklist progress bar in sidebar footer
**Sharing:** Modal with token link, expiry, password option
**Search:** Search bar above file list, searches filename + description + tags
**API routes:** `/api/projects/[id]/documents/*`, `/api/projects/[id]/documents/upload`, `/api/projects/[id]/documents/search`, `/api/projects/[id]/documents/[docId]/auto-tag`

### Page 3: KMA & Säkerhet (`/safety`)
**Layout:** Tab bar — Översikt | Certifikat | Incidenter | Riskbedömning | Personalliggare
**Overview tab:** 4 alert cards (expired certs, expiring soon, open incidents, on-site today), two-column: certificate alerts + incidents/attendance
**Certificates tab:** Table with employee, cert type, issuer, expiry date, status badge (valid/expiring/expired). Filters by status.
**Incidents tab:** Card list with severity badge (låg/medium/hög/kritisk), status (reported/investigating/resolved/closed), photo indicators
**Risk Assessment tab:** Template picker (5 work types), create from template, edit risks
**Personalliggare tab:** Today's attendance by project, check-in/out times, CSV export button for date range
**API routes:** `/api/safety/certificates/*`, `/api/safety/incidents/*`, `/api/safety/risk-assessments/*`, `/api/projects/[id]/attendance/*`, `/api/projects/[id]/inductions/*`

### Page 4: Schemaläggning (`/scheduling`)
**Layout:** Weekly calendar grid — employees as rows, days as columns
**Cells:** Color-coded by project, with labels. Vacation/sick = yellow, conflicts = red border
**Interactions:** Click cell to assign, show conflict warning if overlap detected
**Footer:** Arbetstidslagen compliance status
**API routes:** `/api/schedules/*`, `/api/schedules/conflicts/check`

### Page 5: Underentreprenörer (`/subcontractors`)
**Layout:** List page (standard pattern) + detail page
**List:** Company name, org number, F-skatt badge, insurance badge, project count, payment total
**Detail:** Company info, assigned projects with scope/budget, payment tracking (invoiced/paid/outstanding), certificate verification status
**API routes:** `/api/subcontractors/*`, `/api/subcontractors/[id]/assignments`, `/api/subcontractors/[id]/verify-fskatt`, `/api/subcontractors/[id]/payments`

### Page 6: Materialpriser (`/materials/prices`)
**Layout:** Two tabs — "Sök priser" + "Materiallista"
**Search tab:** Search bar + category chips, results table with supplier columns (Byggmax, Beijer, XL-Bygg, Ahlsell), cheapest highlighted green with star, price update timestamp, price change indicators
**Material list tab:** Project-linked material list builder, quantity × cheapest price, savings calculator, alert toggle per list
**Upload:** CSV upload button for negotiated contract prices
**API routes:** `/api/materials/prices`, `/api/materials/prices/compare`, `/api/materials/prices/alerts`, `/api/materials/prices/upload`

### Page 7: Rapporter (`/reports`)
**Layout:** Tab bar — Lönsamhet | Beläggning | Kassaflöde | Sparade
**Profitability:** 3 KPI cards (revenue, costs, margin with comparison), bar chart by project/client/employee, AI prediction text
**Utilization:** Employee table with billable/non-billable hours, utilization %, overtime
**Cashflow:** Monthly inflow/outflow/net chart, breakdown table
**Saved:** List of saved report configs with "Generate" button
**Export:** CSV/JSON export button on each tab
**Period selector:** Month/quarter/year dropdown + custom date range
**API routes:** `/api/reports/profitability`, `/api/reports/utilization`, `/api/reports/cashflow`, `/api/reports/saved`, `/api/reports/export`

### Page 8: Avtal & Signering (`/contracts`)
**Layout:** Template picker (3 cards: AB04, ABT06, Consumer) → Generate form (select project) → Preview → Sign with BankID
**Signing status:** List of active signing orders with status (pending/signed/rejected/expired)
**API routes:** `/api/contracts/templates`, `/api/contracts/generate`, `/api/signing/create`, `/api/signing/[orderId]`

### Page 9: Kundportal (`/portal/*`)
**Separate layout:** No sidebar — clean customer-facing design with Frost Solutions logo + project nav
**Login:** `/portal/login` — email + password
**Dashboard:** `/portal/dashboard` — project cards with status, unread messages, pending ÄTA approvals
**Project view:** `/portal/projects/[id]` — status, documents (non-restricted), messages, daily log, invoices
**Messages:** Thread view with contractor
**ÄTA approval:** Review details + photos + pricing → Approve (BankID) or Reject
**Survey:** Post-completion satisfaction form
**API routes:** `/api/portal/*`

### Page 10: Inställningar — Integration Health (`/settings/integrations`)
**Layout:** Cards grid showing each integration (Fortnox, Visma, BankID/Idura, PEPPOL)
**Each card:** Status indicator (green/yellow/red), last sync time, error count, pending jobs, configure button
**Detail:** Click card → sync health dashboard with recent errors, manual retry, disconnect
**API routes:** `/api/integrations/[id]/health`, `/api/integrations/status`

---

## Implementation Approach

### Phase A: Design System (do first — all pages inherit)
1. Swap tailwind.config.js color tokens (amber + stone)
2. Update globals.css variables
3. Fix button text color
4. Fix layout.tsx theme color
5. Verify existing pages look correct with new palette

### Phase B: Sidebar + Navigation
6. Update sidebar with grouped sections + role-based visibility
7. Add routes for all new pages

### Phase C: New Pages (build in order of complexity)
8. Material Prices page (search + material list tabs)
9. ÄTA Kanban page (pipeline + detail panel + audit trail)
10. Document Browser (two-pane + upload + versioning)
11. Safety Dashboard (tabs + alert cards + tables)
12. Scheduling Calendar (grid + conflict detection)
13. Subcontractors (list + detail)
14. Reports Dashboard (tabs + charts + export)
15. Contracts (template picker + generate + signing status)
16. Settings Integration Health (cards + detail)
17. Customer Portal (separate layout + login + all portal pages)

---

## Non-Goals

- PDF.js drawing viewer (separate future task — data layer exists)
- Drag-and-drop scheduling (click-to-assign first, DnD later)
- Real-time WebSocket updates (polling is fine for now)
- Mobile-specific layouts beyond responsive (React Native handles mobile)
- Storybook / component documentation
