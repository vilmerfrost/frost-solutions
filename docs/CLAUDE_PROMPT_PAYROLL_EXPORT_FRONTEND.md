# Claude 4.5 Frontend Prompt - Payroll Export System

Du är Claude 4.5 frontend-utvecklare för Frost Solutions. Målet är att implementera ett komplett frontend för payroll-export-systemet som exporterar tidrapporter till Fortnox Lön (PAXml) och Visma Lön (CSV).

## BEFINTLIGA BUILDING BLOCKS (får EJ dupliceras)

### 1. React Query Hooks Pattern
- Vi använder `@tanstack/react-query` för data fetching
- Hooks följer mönstret: `usePayrollPeriods`, `usePayrollPeriod`, `useCreatePayrollPeriod`, `useLockPayrollPeriod`, `useExportPayrollPeriod`, `useUnlockPayrollPeriod`
- Alla hooks använder `useTenant()` från `@/app/context/TenantContext` för tenantId
- Error handling via `sonner` toasts (`toast.error`, `toast.success`)
- Query invalidation efter mutations: `queryClient.invalidateQueries({ queryKey: ['payroll-periods'] })`

### 2. UI Components Pattern
- Vi använder shadcn/ui komponenter från `@/components/ui/`
- Premium UI/UX: gradients (`bg-gradient-to-br`), shadows (`shadow-xl`), dark mode support
- Formulär använder `react-hook-form` + `zod` för validering
- Loading states: Skeleton loaders eller spinner med `Loader2` från `lucide-react`
- Error states: `AlertCircle` ikoner med tydliga meddelanden

### 3. API Client Pattern
- API calls görs via `fetch` till `/api/payroll/*` endpoints
- Alla requests inkluderar cookies automatiskt (`credentials: 'include'`)
- Error handling: `extractErrorMessage` från `@/lib/errorUtils`
- Response format: `{ success: boolean, data?: T, errors?: [], warnings?: [] }`

### 4. Navigation & Routing
- Sidebar navigation i `@/components/SidebarClient.tsx`
- Next.js App Router med `useRouter` från `next/navigation`
- Breadcrumbs för komplexa flöden

### 5. Existing Patterns från Supplier Invoices
- Lista-vy med filters (`InvoiceFilters.tsx` pattern)
- Detail-vy med tabs för olika sektioner
- Create/Edit formulär med validering
- Status badges (draft, locked, exported, failed)
- Action buttons (Lock, Export, Unlock) med loading states

## BACKEND API ENDPOINTS (REDAN IMPLEMENTERADE)

### GET `/api/payroll/periods`
- Query params: `?status=locked&start=2025-01-01&end=2025-01-31`
- Response: `{ success: true, data: PayrollPeriod[] }`

### POST `/api/payroll/periods`
- Body: `{ startDate: string, endDate: string, format: 'fortnox-paxml' | 'visma-csv' }`
- Response: `{ success: true, data: PayrollPeriod }`

### POST `/api/payroll/periods/[id]/lock`
- Response: `{ success: boolean, errors?: PayrollValidationIssue[] }`
- Status 409 om validering misslyckas

### POST `/api/payroll/periods/[id]/export`
- Response: `{ success: true, data: PayrollExportResult, warnings?: PayrollValidationIssue[] }`
- `PayrollExportResult` innehåller `signedUrl` för nedladdning

### POST `/api/payroll/periods/[id]/unlock`
- Response: `{ success: boolean }`

## TYPER (REDAN DEFINIERADE)

```typescript
// app/types/payroll.ts
export type PayrollPeriodStatus = 'open' | 'locked' | 'exported' | 'failed';
export type PayrollExportFormat = 'fortnox-paxml' | 'visma-csv';

export interface PayrollPeriod {
  id: string;
  tenant_id: string;
  start_date: string;
  end_date: string;
  export_format: PayrollExportFormat | null;
  status: PayrollPeriodStatus;
  locked_at?: string | null;
  locked_by?: string | null;
  exported_at?: string | null;
  exported_by?: string | null;
  created_at?: string;
}

export interface PayrollValidationIssue {
  code: string;
  level: 'error' | 'warning';
  message: string;
  context?: Record<string, unknown>;
}

export interface PayrollExportResult {
  exportId: string;
  filePath: string;
  signedUrl: string;
  provider: 'fortnox' | 'visma';
  format: 'paxml' | 'csv';
  warnings?: PayrollValidationIssue[];
}
```

## FRONTEND IMPLEMENTATION REQUIREMENTS

### 1. React Query Hooks (`app/hooks/usePayrollPeriods.ts`)

Implementera följande hooks:

```typescript
// usePayrollPeriods(params?) - lista perioder med filters
// usePayrollPeriod(id) - hämta en period
// useCreatePayrollPeriod() - mutation för att skapa period
// useLockPayrollPeriod(id) - mutation för att låsa period
// useExportPayrollPeriod(id) - mutation för att exportera
// useUnlockPayrollPeriod(id) - mutation för att låsa upp (admin)
```

**Krav:**
- Använd `useTenant()` för tenantId
- Error handling med `sonner` toasts
- Query invalidation efter mutations
- Loading states (`isLoading`, `isPending`)
- Retry logic: max 3 försök, exponential backoff

### 2. API Client (`app/lib/api/payroll.ts`)

Skapa `PayrollAPI` klass med statiska metoder:
- `list(params?)` - GET `/api/payroll/periods`
- `get(id)` - GET `/api/payroll/periods/[id]` (om behövs)
- `create(payload)` - POST `/api/payroll/periods`
- `lock(id)` - POST `/api/payroll/periods/[id]/lock`
- `export(id)` - POST `/api/payroll/periods/[id]/export`
- `unlock(id)` - POST `/api/payroll/periods/[id]/unlock`

**Krav:**
- `credentials: 'include'` på alla requests
- Error parsing med `extractErrorMessage`
- User-friendly error messages baserat på HTTP status

### 3. Pages

#### A) `/app/payroll/periods/page.tsx` - Lista perioder

**Features:**
- Tabell/lista med alla perioder
- Filters: Status (open/locked/exported/failed), Date range (start/end)
- Status badges med färger:
  - `open`: grön (green-500)
  - `locked`: gul (yellow-500)
  - `exported`: blå (blue-500)
  - `failed`: röd (red-500)
- Actions per rad:
  - "Lås" (om status = open)
  - "Exportera" (om status = locked)
  - "Lås upp" (om status = locked/exported/failed, admin only)
  - "Ladda ner" (om status = exported, öppna signedUrl)
- Empty state: "Inga löneperioder ännu. Skapa din första period."
- Loading state: Skeleton loaders
- Error state: Alert med retry-knapp

**UI Pattern:** Följ `app/supplier-invoices/page.tsx` struktur

#### B) `/app/payroll/periods/new/page.tsx` - Skapa period

**Features:**
- Formulär med:
  - Start date picker (`DatePicker` eller `Input type="date"`)
  - End date picker
  - Format selector (`Select`): "Fortnox PAXml" eller "Visma CSV"
- Validering:
  - Start date < End date
  - Date range max 1 månad (rekommenderat)
  - Format måste väljas
- Submit button: "Skapa period"
- Cancel button: "Avbryt" → navigera tillbaka
- Success toast: "Period skapad"
- Redirect till `/payroll/periods/[id]` efter skapande

**UI Pattern:** Följ `app/suppliers/new/page.tsx` struktur

#### C) `/app/payroll/periods/[id]/page.tsx` - Period detail

**Features:**
- Header med period info:
  - Period namn/ID
  - Status badge
  - Date range
  - Format (Fortnox/Visma)
- Tabs eller sektioner:
  1. **Översikt**
     - Status timeline (open → locked → exported)
     - Locked/exported timestamps
     - Export info (om exported)
  2. **Validering**
     - Lista errors (om några)
     - Lista warnings (om några)
     - "Kontrollera igen" knapp
  3. **Export**
     - Export button (om locked)
     - Download link (om exported)
     - Export history (från `payroll_exports` tabell)
- Action buttons i header:
  - "Lås period" (om open)
  - "Exportera" (om locked)
  - "Lås upp" (om locked/exported/failed, admin)
- Loading state: Skeleton
- Error state: Alert

**UI Pattern:** Följ `app/quotes/[id]/page.tsx` struktur med tabs

### 4. Components

#### A) `app/components/payroll/PeriodFilters.tsx`

**Features:**
- Status filter (`Select`): Alla / Open / Locked / Exported / Failed
- Date range filters (`Input type="date"`): Start date, End date
- "Rensa filter" knapp
- Premium styling: gradient background, shadows

**UI Pattern:** Följ `app/components/supplier-invoices/InvoiceFilters.tsx`

#### B) `app/components/payroll/PeriodList.tsx`

**Features:**
- Tabell med kolumner:
  - Period (start_date - end_date)
  - Format (Fortnox/Visma badge)
  - Status (badge)
  - Actions (dropdown menu)
- Empty state: "Inga perioder matchar filtren"
- Loading state: Skeleton rows
- Click på rad → navigera till detail page

**UI Pattern:** Följ `app/components/supplier-invoices/InvoiceList.tsx`

#### C) `app/components/payroll/PeriodForm.tsx`

**Features:**
- React Hook Form med Zod schema
- Fields:
  - Start date (`Input type="date"`)
  - End date (`Input type="date"`)
  - Format (`Select`)
- Validering:
  - Required fields
  - Start < End
  - Max 1 månad range (warning)
- Submit handler: Call `useCreatePayrollPeriod` mutation
- Error display: Under varje field + summary

**UI Pattern:** Följ `app/components/quotes/QuoteForm.tsx`

#### D) `app/components/payroll/ValidationIssues.tsx`

**Features:**
- Display lista av `PayrollValidationIssue[]`
- Group by level (errors vs warnings)
- Error: Röd (`text-red-600`, `AlertCircle` ikon)
- Warning: Gul (`text-yellow-600`, `AlertTriangle` ikon)
- Expandable/collapsible sektioner
- Context info (om `context` finns)

**UI Pattern:** Följ `app/components/ui/alert.tsx` styling

#### E) `app/components/payroll/ExportButton.tsx`

**Features:**
- Button med loading state
- On click: Call `useExportPayrollPeriod` mutation
- Success: 
  - Toast: "Export lyckades"
  - Öppna `signedUrl` i ny flik för nedladdning
  - Uppdatera period status
- Error:
  - Toast: "Export misslyckades: [error message]"
  - Visa errors i modal/alert

**UI Pattern:** Följ `app/components/quotes/SendQuoteButton.tsx`

### 5. Sidebar Navigation

**Uppdatera `app/components/SidebarClient.tsx`:**

Lägg till ny navigation item:
```typescript
{
  name: 'Löneexport',
  href: '/payroll/periods',
  icon: '💰', // eller FileSpreadsheet från lucide-react
  gradient: 'from-purple-500 to-pink-600'
}
```

Placera under "Leverantörsfakturor" i `navItems` array.

## UI/UX REQUIREMENTS

### Premium Styling
- Gradient backgrounds: `bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900`
- Cards: `rounded-xl shadow-xl border-2 border-gray-200 dark:border-gray-700`
- Buttons: Gradient backgrounds, hover effects, shadows
- Status badges: Rounded, colored backgrounds, icons

### Dark Mode
- Alla komponenter ska stödja dark mode
- Använd Tailwind `dark:` prefix konsekvent
- Testa både light och dark mode

### Responsive Design
- Mobile-first approach
- Tabell → Card layout på mobile
- Filters → Accordion på mobile
- Touch-friendly buttons (min 44px height)

### Loading & Error States
- Skeleton loaders för initial load
- Spinner för mutations
- Error boundaries för kritiska fel
- Retry buttons på error states

### Accessibility
- ARIA labels på alla interaktiva element
- Keyboard navigation support
- Focus states synliga
- Screen reader friendly

## VALIDATION & ERROR HANDLING

### Client-side Validation
- React Hook Form + Zod schemas
- Real-time validation feedback
- Field-level errors
- Form-level error summary

### Server Error Handling
- Parse `errors` array från API responses
- Display validation errors prominently
- Warnings: Visa men blockera inte (om möjligt)
- Network errors: Retry logic + user-friendly message

### User Feedback
- Success toasts: "Period skapad", "Period låst", "Export lyckades"
- Error toasts: Tydliga felmeddelanden
- Loading indicators: Spinner på buttons under mutation
- Progress indicators: För långa operationer (export)

## TESTING CHECKLIST

Efter implementation, testa:

1. **Lista perioder**
   - ✅ Ladda lista med filters
   - ✅ Empty state visas korrekt
   - ✅ Loading state visas korrekt
   - ✅ Error state med retry fungerar

2. **Skapa period**
   - ✅ Formulär validerar korrekt
   - ✅ Submit skapar period
   - ✅ Success redirect fungerar
   - ✅ Error handling fungerar

3. **Period detail**
   - ✅ Ladda period data
   - ✅ Status badges visas korrekt
   - ✅ Action buttons visas baserat på status
   - ✅ Tabs/sektioner fungerar

4. **Lock period**
   - ✅ Lock button fungerar
   - ✅ Validering errors visas korrekt
   - ✅ Success uppdaterar status
   - ✅ Period blir låst (ingen edit)

5. **Export period**
   - ✅ Export button fungerar
   - ✅ Loading state under export
   - ✅ Success öppnar download URL
   - ✅ Warnings visas korrekt
   - ✅ Errors hanteras korrekt

6. **Unlock period**
   - ✅ Unlock button (admin only)
   - ✅ Success återställer status
   - ✅ Period blir editbar igen

7. **Navigation**
   - ✅ Sidebar link fungerar
   - ✅ Breadcrumbs fungerar
   - ✅ Back buttons fungerar

## IMPLEMENTATION ORDER

1. **Först:** Skapa typer och API client (`app/lib/api/payroll.ts`)
2. **Sedan:** React Query hooks (`app/hooks/usePayrollPeriods.ts`)
3. **Sedan:** Komponenter (Filters, List, Form, ValidationIssues, ExportButton)
4. **Sedan:** Pages (List, New, Detail)
5. **Slutligen:** Sidebar navigation + polish

## CODE QUALITY REQUIREMENTS

- **TypeScript:** Strikt typing, inga `any` om möjligt
- **Error Handling:** Alltid try/catch, user-friendly messages
- **Loading States:** Alltid visa loading under async operations
- **Accessibility:** ARIA labels, keyboard navigation
- **Performance:** React.memo där lämpligt, useMemo/useCallback för optimering
- **Code Style:** Följ befintlig kodstil i projektet
- **Comments:** Kommentera komplex logik, svenska eller engelska

## EXEMPEL PÅ FÄRDIG KOD

Se följande filer för referens:
- `app/hooks/useSupplierInvoices.ts` - React Query hooks pattern
- `app/components/supplier-invoices/InvoiceFilters.tsx` - Filter component
- `app/components/supplier-invoices/InvoiceList.tsx` - List component
- `app/quotes/[id]/page.tsx` - Detail page med tabs
- `app/components/quotes/QuoteForm.tsx` - Form component

## VIKTIGT

- **Ingen duplicering:** Återanvänd befintliga patterns och komponenter
- **Konsistens:** Följ samma UI/UX som resten av applikationen
- **Premium känsla:** Gradients, shadows, smooth transitions
- **User Experience:** Tydliga meddelanden, loading states, error recovery
- **Accessibility:** Keyboard navigation, screen readers, ARIA labels

---

**LEVERERA:**
- Komplett frontend-kod enligt ovan
- Alla komponenter, hooks, pages, och navigation updates
- Premium UI/UX med dark mode support
- Fullständig error handling och loading states
- TypeScript med strikt typing
- Kommentarer på svenska där lämpligt

Lycka till! 🚀

