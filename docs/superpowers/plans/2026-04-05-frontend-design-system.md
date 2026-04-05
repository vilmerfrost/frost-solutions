# Frontend Design System + Sidebar — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the cold sky-blue design to a warm amber + stone aesthetic (Base44-inspired), and add role-based grouped sidebar navigation for all new feature areas.

**Architecture:** Swap Tailwind config color tokens so all 149+ existing components inherit the warm palette automatically. Fix button text color for accessibility (dark text on amber). Update sidebar with grouped sections filtered by user role.

**Tech Stack:** Tailwind CSS 3.4, Next.js 16, React 19

---

## Task 1: Tailwind Config — Warm Color Tokens

**Files:**
- Modify: `tailwind.config.js`

- [ ] **Step 1: Replace primary colors (sky → amber)**

In `tailwind.config.js`, replace the `primary` color object:

```javascript
primary: {
  50: '#FFFBEB',
  100: '#FEF3C7',
  200: '#FDE68A',
  300: '#FCD34D',
  400: '#FBBF24',
  500: '#F59E0B',
  600: '#D97706',
  700: '#B45309',
  800: '#92400E',
  900: '#78350F',
},
```

- [ ] **Step 2: Replace gray colors (slate → stone)**

Replace the `gray` color object:

```javascript
gray: {
  50: '#FAFAF9',
  100: '#F5F5F4',
  200: '#E7E5E4',
  300: '#D6D3D1',
  400: '#A8A29E',
  500: '#78716C',
  600: '#57534E',
  700: '#44403C',
  800: '#292524',
  900: '#1C1917',
},
```

- [ ] **Step 3: Replace box shadows (cool → warm)**

Replace the `boxShadow` object:

```javascript
boxShadow: {
  sm: '0 1px 2px rgba(28, 25, 23, 0.05)',
  DEFAULT: '0 1px 3px rgba(28, 25, 23, 0.1)',
  md: '0 4px 6px rgba(28, 25, 23, 0.07)',
  lg: '0 10px 15px rgba(28, 25, 23, 0.10)',
  xl: '0 20px 25px rgba(28, 25, 23, 0.15)',
  card: '0 4px 6px rgba(28, 25, 23, 0.07)',
},
```

- [ ] **Step 4: Commit**

```bash
git add tailwind.config.js
git commit -m "feat: warm design system — amber primary + stone grays + warm shadows"
```

---

## Task 2: CSS Variables — Warm Palette

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Update all CSS custom properties**

In `app/globals.css`, replace the `:root` block variables:

**Primary colors:**
```css
--primary-500: #F59E0B;
--primary-600: #D97706;
--primary-700: #B45309;
--primary-50: #FFFBEB;
--primary-100: #FEF3C7;
```

**Neutral colors:**
```css
--gray-50: #FAFAF9;
--gray-100: #F5F5F4;
--gray-200: #E7E5E4;
--gray-300: #D6D3D1;
--gray-400: #A8A29E;
--gray-500: #78716C;
--gray-600: #57534E;
--gray-700: #44403C;
--gray-800: #292524;
--gray-900: #1C1917;
```

**Dark mode:**
```css
--dark-bg: #1C1917;
--dark-surface: #292524;
--dark-border: #44403C;
--dark-text: #FAFAF9;
```

**Warning color (shift away from amber to avoid clash):**
```css
--warning-50: #FFF7ED;
--warning-500: #F97316;
--warning-600: #EA580C;
--warning-700: #C2410C;
```

**Shadows:**
```css
--shadow-sm: 0 1px 2px rgba(28, 25, 23, 0.05);
--shadow-md: 0 4px 6px rgba(28, 25, 23, 0.07);
--shadow-lg: 0 10px 15px rgba(28, 25, 23, 0.10);
--shadow-xl: 0 20px 25px rgba(28, 25, 23, 0.15);
```

- [ ] **Step 2: Rename the header comment**

Replace `LOVABLE DESIGN SYSTEM` with `FROST DESIGN SYSTEM`.

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "feat: update CSS variables to warm amber + stone palette"
```

---

## Task 3: Button Text Color — Accessibility Fix

**Files:**
- Modify: `app/components/ui/button.tsx`

- [ ] **Step 1: Change primary variant text color**

In `app/components/ui/button.tsx` line 30, change the primary variant:

```typescript
primary: 'bg-primary-500 text-gray-900 hover:bg-primary-600 focus:ring-primary-500 border-transparent shadow-sm hover:shadow-md hover:-translate-y-[1px] active:scale-[0.98]',
```

The change is `text-white` → `text-gray-900`. This gives ~8.5:1 contrast ratio on amber background.

- [ ] **Step 2: Fix hardcoded text-white on primary backgrounds across components**

Search all 72 files that have `text-white` near primary backgrounds. For inline buttons that use `bg-primary-500 text-white` (not the Button component), change to `bg-primary-500 text-gray-900`.

Run:
```bash
grep -rn "bg-primary-500.*text-white\|bg-primary-600.*text-white" app/ --include="*.tsx" --include="*.ts"
```

Fix each occurrence. The most common pattern is inline `<button>` tags and `<a>` elements with `bg-primary-500 text-white` — change `text-white` to `text-gray-900` in each.

**Important:** Only fix buttons/elements where the background is `bg-primary-*`. Don't touch `text-white` on `bg-red-*`, `bg-green-*`, or dark backgrounds — those are correct.

- [ ] **Step 3: Commit**

```bash
git add app/
git commit -m "fix: dark text on amber primary buttons for WCAG accessibility"
```

---

## Task 4: Layout Theme Color

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Update viewport theme color**

In `app/layout.tsx` line 25, change:

```typescript
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#D97706",
};
```

- [ ] **Step 2: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: update mobile browser chrome to amber theme color"
```

---

## Task 5: Role-Based Sidebar Navigation

**Files:**
- Modify: `app/components/Sidebar.tsx` (or `SidebarClient.tsx` — read first to find the right file)

- [ ] **Step 1: Read the existing sidebar**

Read `app/components/Sidebar.tsx` and `app/components/SidebarClient.tsx` to understand the current structure — menu items, icons, mobile bottom nav, active state logic.

- [ ] **Step 2: Define navigation items with role visibility**

Create a navigation config array with grouped sections:

```typescript
type UserRole = 'admin' | 'supervisor' | 'worker'

interface NavItem {
  label: string
  href: string
  icon: string  // Lucide icon name
  roles: UserRole[]  // which roles can see this
}

interface NavGroup {
  title: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'ÖVERSIKT',
    items: [
      { label: 'Kontrollpanel', href: '/dashboard', icon: 'LayoutDashboard', roles: ['admin', 'supervisor', 'worker'] },
    ],
  },
  {
    title: 'PROJEKT',
    items: [
      { label: 'Projekt', href: '/projects', icon: 'FolderKanban', roles: ['admin', 'supervisor', 'worker'] },
      { label: 'Dokument', href: '/documents', icon: 'FileText', roles: ['admin', 'supervisor'] },
      { label: 'ÄTA-hantering', href: '/ata', icon: 'GitBranch', roles: ['admin', 'supervisor'] },
    ],
  },
  {
    title: 'TID & PERSONAL',
    items: [
      { label: 'Tidrapportering', href: '/time-tracking', icon: 'Clock', roles: ['admin', 'supervisor', 'worker'] },
      { label: 'Schemaläggning', href: '/scheduling', icon: 'CalendarDays', roles: ['admin'] },
      { label: 'Anställda', href: '/employees', icon: 'Users', roles: ['admin'] },
      { label: 'Underentreprenörer', href: '/subcontractors', icon: 'HardHat', roles: ['admin'] },
    ],
  },
  {
    title: 'EKONOMI',
    items: [
      { label: 'Fakturering', href: '/invoices', icon: 'Receipt', roles: ['admin'] },
      { label: 'Lönehantering', href: '/payroll', icon: 'Banknote', roles: ['admin'] },
      { label: 'ROT-avdrag', href: '/rot', icon: 'Home', roles: ['admin'] },
      { label: 'Rapporter', href: '/reports', icon: 'BarChart3', roles: ['admin'] },
    ],
  },
  {
    title: 'SÄKERHET',
    items: [
      { label: 'KMA & Säkerhet', href: '/safety', icon: 'ShieldCheck', roles: ['admin', 'supervisor', 'worker'] },
      { label: 'Materialpriser', href: '/materials/prices', icon: 'PackageSearch', roles: ['admin', 'supervisor'] },
    ],
  },
  {
    title: 'KUNDPORTAL',
    items: [
      { label: 'Kunder', href: '/clients', icon: 'UserCircle', roles: ['admin'] },
      { label: 'Avtal & Signering', href: '/contracts', icon: 'PenTool', roles: ['admin'] },
    ],
  },
]
```

- [ ] **Step 3: Implement grouped sidebar with role filtering**

Update the sidebar component to:
1. Get user role from existing `useAdmin()` hook or tenant context
2. Filter `NAV_GROUPS` items by role
3. Render groups with collapsible sections (localStorage persistence for collapsed state)
4. Group headers styled as small uppercase labels with stone-400 color
5. Keep existing active state logic (pathname matching)
6. Keep existing mobile bottom nav (show subset: Dashboard, Projects, Time, Safety, Profile)

- [ ] **Step 4: Verify all new routes exist**

Create placeholder page files for routes that don't exist yet:
- `app/documents/page.tsx` (redirect to project document picker)
- `app/ata/page.tsx` (ÄTA kanban — placeholder)
- `app/scheduling/page.tsx` (scheduling calendar — placeholder)
- `app/subcontractors/page.tsx` (subcontractor list — placeholder)
- `app/safety/page.tsx` (safety dashboard — placeholder)
- `app/contracts/page.tsx` (contract templates — placeholder)

Each placeholder is a minimal page with the sidebar + "Kommer snart" message, following existing page patterns.

- [ ] **Step 5: Commit**

```bash
git add app/components/Sidebar* app/documents/ app/ata/ app/scheduling/ app/subcontractors/ app/safety/ app/contracts/
git commit -m "feat: role-based grouped sidebar navigation with new page routes"
```

---

## Task 6: Visual Verification

- [ ] **Step 1: Run dev server and check**

```bash
pnpm dev
```

Open `http://localhost:3000/app/dashboard` and verify:
- Amber primary buttons (not sky blue)
- Warm stone backgrounds
- Dark text on primary buttons
- Sidebar shows grouped sections
- Dark mode uses warm charcoal (not cold slate)

- [ ] **Step 2: Run typecheck and tests**

```bash
pnpm typecheck && pnpm test
```

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "chore: design system overhaul complete — warm amber + stone + role-based sidebar"
```

---

## Completion Criteria

- [ ] Tailwind config: primary = amber scale, gray = stone scale, shadows = warm
- [ ] CSS variables: all `--primary-*`, `--gray-*`, `--dark-*`, `--shadow-*` updated
- [ ] Header renamed from "LOVABLE" to "FROST"
- [ ] Button component: primary variant uses `text-gray-900` not `text-white`
- [ ] 72 files with inline `bg-primary-* text-white` fixed to `text-gray-900`
- [ ] Layout theme color: `#D97706`
- [ ] Warning color shifted from amber to orange (avoid clash)
- [ ] Sidebar: grouped sections with role filtering
- [ ] Placeholder pages created for all new routes
- [ ] `pnpm typecheck` and `pnpm test` pass
