# Claude 4.5 Frontend Prompt: Dag 6-7 KMA/Offert Implementation

## 🎯 UPPGIFT: Implementera komplett Quote/KMA Frontend System

Du är senior frontend-utvecklare för Frost Solutions. Backend är redan 100% implementerat och fungerar. Din uppgift är att bygga en komplett, production-ready frontend för Quote/KMA-systemet i Next.js 16 + React 19 + TypeScript + Tailwind CSS.

---

## 📋 BACKEND STATUS (REDAN KLART & TESTAD)

Backend är 100% implementerad och fungerar:

✅ **API Routes (alla fungerar):**
- `GET/POST /api/quotes` - Returnerar `{ success: true, data, meta }`
- `GET/PUT/DELETE /api/quotes/[id]` - Returnerar `{ data }` eller `{ success: true }`
- `GET/POST/PUT/DELETE /api/quotes/[id]/items` - PUT/DELETE tar `body.id` i request body
- `GET /api/quotes/[id]/pdf` - Returnerar PDF blob
- `POST /api/quotes/[id]/send` - Tar bara `{ to }` i body (subject genereras automatiskt)
- `POST /api/quotes/[id]/approve` - Tar `{ level, reason }` i body
- `POST /api/quotes/[id]/convert` - Returnerar `{ success: true, projectId }`
- `POST /api/quotes/[id]/duplicate` - Returnerar `{ success: true, data }`

✅ **Backend Libraries (använd dessa):**
- `app/lib/pricing/calculateQuoteTotal.ts` - Pricing engine
- `app/lib/pricing/generateQuoteNumber.ts` - Quote number generation
- `app/lib/quotes/workflow.ts` - `canTransition()` funktion
- `app/lib/quotes/approval.ts` - `logQuoteChange()` funktion
- `app/lib/email/sendQuoteEmail.ts` - Email sending
- `app/lib/pdf/generateQuotePDF.ts` - PDF generation

✅ **Database Schema:**
- `quotes` - Huvudtabell med status, totals, KMA fields
- `quote_items` - Radartiklar med generated columns (line_total, discount_amount, net_price)
- `quote_templates` - Mallar
- `quote_approvals` - Multi-level approvals
- `quote_history` - Audit trail
- `materials` - Materialdatabas
- `pricing_rules` - Dynamiska prissättningsregler

**VIKTIGT:** Backend returnerar totals automatiskt via triggers när items ändras. Du behöver INTE beräkna totals i frontend.

---

## 🏗️ TEKNISK STACK (EXAKT VAD SOM FINNS)

- **Framework:** Next.js 16 (App Router)
- **UI:** React 19 + TypeScript
- **Styling:** Tailwind CSS (använd direkt, INGA UI libraries)
- **State Management:** React Query (@tanstack/react-query) ✅ INSTALLERAT
- **Forms:** Native HTML forms (INGEN react-hook-form)
- **Icons:** Lucide React ✅ INSTALLERAT
- **Notifications:** Sonner ✅ INSTALLERAT
- **Date Formatting:** Native JavaScript Date API (INGEN date-fns)

**VIKTIGT:** Använd INGA libraries som inte finns installerat. Se `package.json` för vad som finns.

---

## 🔗 BEFINTLIGA HOOKS & UTILITIES (ANVÄND DESSA)

### Hooks som redan finns:
```typescript
// app/context/TenantContext.tsx
import { useTenant } from '@/context/TenantContext'
const { tenantId } = useTenant() // Returnerar { tenantId: string | null }

// app/hooks/useClients.ts
import { useClients } from '@/hooks/useClients'
const { data: clients } = useClients() // Returnerar Client[]

// app/hooks/useProjects.ts
import { useProjects } from '@/hooks/useProjects'
const { data: projects } = useProjects() // Returnerar Project[]
```

### Utilities som redan finns:
```typescript
// app/lib/errorUtils.ts
import { extractErrorMessage } from '@/lib/errorUtils'
// Använd denna för error handling, skapa INTE ny

// app/lib/quotes/workflow.ts
import { canTransition } from '@/lib/quotes/workflow'
// Använd för att validera status transitions
```

---

## 📦 IMPLEMENTATION PLAN - FRONTEND FOKUS

### FASE 1: Types & API Client (Dag 1)

**Uppgift:** Skapa TypeScript types och API client wrapper

**Filer att skapa:**

1. **`app/types/quotes.ts`**
   - Definiera `QuoteStatus`, `Quote`, `QuoteItem` types
   - Matcha exakt backend schema
   - Se backend SQL för exakta fält

2. **`app/lib/api/quotes.ts`**
   - API client wrapper som hanterar `{ success: true, data }` format
   - Använd `extractErrorMessage` från `@/lib/errorUtils`
   - Hantera både `{ success: true, data }` och `{ data }` response formats

**VIKTIGT:** Backend returnerar olika format:
- `GET /api/quotes` → `{ success: true, data: Quote[], meta: {...} }`
- `GET /api/quotes/[id]` → `{ data: Quote }`
- `POST /api/quotes` → `{ success: true, data: Quote }`
- `PUT /api/quotes/[id]` → `{ data: Quote }`
- `DELETE /api/quotes/[id]` → `{ success: true }` (204 status)

---

### FASE 2: React Query Hooks (Dag 1)

**Uppgift:** Skapa React Query hooks för quotes och items

**Filer att skapa:**

1. **`app/hooks/useQuotes.ts`**
   ```typescript
   export function useQuotes(filters?: QuoteFilters)
   export function useQuote(id: string | null)
   export function useCreateQuote()
   export function useUpdateQuote(id: string)
   export function useDeleteQuote()
   ```

2. **`app/hooks/useQuoteItems.ts`**
   ```typescript
   export function useQuoteItems(quoteId: string)
   export function useCreateQuoteItem(quoteId: string)
   export function useUpdateQuoteItem(quoteId: string) // Använd PUT med body.id
   export function useDeleteQuoteItem(quoteId: string) // Använd DELETE med body.id
   ```

3. **`app/hooks/useQuoteActions.ts`**
   ```typescript
   export function useSendQuote() // POST /api/quotes/[id]/send med { to }
   export function useApproveQuote() // POST /api/quotes/[id]/approve med { level, reason }
   export function useConvertToProject() // POST /api/quotes/[id]/convert
   export function useDuplicateQuote() // POST /api/quotes/[id]/duplicate
   ```

**VIKTIGT:**
- Använd `useTenant()` från `@/context/TenantContext` (INTE från hooks)
- Använd `extractErrorMessage` från `@/lib/errorUtils`
- Items PUT/DELETE: Skicka `{ id: itemId, ...data }` i body, INTE i URL
- Send Quote: Skicka bara `{ to: email }`, backend hanterar resten

---

### FASE 3: UI Components (Dag 2)

**Uppgift:** Skapa enkla UI wrapper-komponenter med Tailwind

**Filer att skapa:**

1. **`app/components/ui/button.tsx`**
   ```typescript
   // Enkel button wrapper med Tailwind
   // Props: variant, size, children, onClick, disabled, type
   // Variants: default, outline, ghost, destructive
   ```

2. **`app/components/ui/input.tsx`**
   ```typescript
   // Enkel input wrapper med Tailwind
   // Standard HTML input props
   ```

3. **`app/components/ui/select.tsx`**
   ```typescript
   // Native select wrapper med Tailwind styling
   // Props: value, onChange, children, placeholder
   ```

4. **`app/components/ui/dialog.tsx`**
   ```typescript
   // Enkel modal/dialog med Tailwind
   // Använd native dialog element eller div med backdrop
   ```

5. **`app/components/ui/table.tsx`**
   ```typescript
   // Table wrapper komponenter
   // Table, TableHeader, TableBody, TableRow, TableHead, TableCell
   ```

6. **`app/components/ui/badge.tsx`**
   ```typescript
   // Badge komponent för status badges
   // Props: variant, children
   ```

**VIKTIGT:** Håll komponenterna enkla. Använd Tailwind classes direkt. Ingen komplex state management.

---

### FASE 4: Quote List & Filters (Dag 2)

**Uppgift:** Bygg lista-sida med filtering

**Filer att skapa:**

1. **`app/quotes/page.tsx`**
   - Lista alla offerter
   - Filter state management
   - Pagination (backend stödjer page/limit params)

2. **`app/components/quotes/QuoteList.tsx`**
   - Tabell med quotes
   - Loading skeletons (använd Tailwind)
   - Empty state
   - Actions dropdown

3. **`app/components/quotes/QuoteFilters.tsx`**
   - Status dropdown (använd `useQuotes` med filter)
   - Customer dropdown (använd `useClients()` hook)
   - Search input
   - Clear filters button

4. **`app/components/quotes/QuoteStatusBadge.tsx`**
   - Färgkodade status badges
   - Använd Tailwind colors

**VIKTIGT:**
- Använd `useClients()` från `@/hooks/useClients` (finns redan)
- Backend returnerar `meta: { page, limit, count }` för pagination
- Format dates med `new Date().toLocaleDateString('sv-SE')`

---

### FASE 5: Quote Form & Editor (Dag 3)

**Uppgift:** Bygg formulär för att skapa/redigera offerter

**VIKTIGT:** Använd NATIVE HTML FORMS, INGEN react-hook-form!

**Filer att skapa:**

1. **`app/quotes/new/page.tsx`** - Skapa ny offert
2. **`app/quotes/[id]/edit/page.tsx`** - Redigera offert
3. **`app/components/quotes/QuoteForm.tsx`** - Huvudformulär
4. **`app/components/quotes/QuoteItemsEditor.tsx`** - Items editor

**Formulär-struktur:**
```tsx
// Använd native form med useState för state
const [formData, setFormData] = useState({...})
const [items, setItems] = useState<QuoteItem[]>([])

// Handle submit
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  // Använd mutation hooks
}
```

**Items Editor:**
- Array av items i state
- Add/Remove items funktioner
- Real-time totals display (använd backend totals, INTE client-side calculation)
- Form fields: name, description, quantity, unit, unit_price, discount, vat_rate

**VIKTIGT:**
- Backend beräknar totals automatiskt via triggers
- Efter create/update, refetch quote för att få uppdaterade totals
- Använd `useClients()` och `useProjects()` hooks

---

### FASE 6: Quote Detail & Actions (Dag 4)

**Uppgift:** Bygg detaljsida med alla actions

**Filer att skapa:**

1. **`app/quotes/[id]/page.tsx`** - Detaljsida
2. **`app/components/quotes/QuoteDetail.tsx`** - Huvudkomponent
3. **`app/components/quotes/QuoteActions.tsx`** - Action buttons
4. **`app/components/quotes/QuoteItemsList.tsx`** - Items display (read-only)

**Actions att implementera:**

1. **Send Email**
   - Modal med email input
   - Använd `useSendQuote()` hook
   - Skicka bara `{ to: email }`

2. **Approve**
   - Modal för approval (om multi-level)
   - Kommentar-fält
   - Använd `useApproveQuote()` hook

3. **Convert to Project**
   - Bekräftelsedialog
   - Använd `useConvertToProject()` hook
   - Redirect till `/projects/${projectId}`

4. **Duplicate**
   - Använd `useDuplicateQuote()` hook
   - Redirect till `/quotes/${newQuoteId}/edit`

5. **Download PDF**
   - Link till `/api/quotes/[id]/pdf`
   - Öppna i ny flik

6. **Status Change**
   - Dropdown eller buttons
   - Använd `canTransition()` från `@/lib/quotes/workflow`
   - Visa endast tillåtna transitions

**VIKTIGT:**
- Använd `canTransition()` för att validera transitions
- Backend hanterar status updates
- Efter actions, invalidate queries för att refetch

---

### FASE 7: Email Modal & PDF Preview (Dag 5)

**Uppgift:** Implementera email sending UI och PDF preview

**Filer att skapa:**

1. **`app/components/quotes/SendQuoteModal.tsx`**
   - Email input (bara `to` field)
   - Subject är read-only (genereras av backend)
   - Preview text (optional)
   - Send button

2. **`app/components/quotes/PDFPreview.tsx`**
   - Link till PDF API
   - Download button
   - Optional: iframe preview (kan vara problematiskt)

**VIKTIGT:**
- Backend tar bara `{ to }` i send API
- Subject genereras automatiskt: `Offert ${quote.quote_number}`
- PDF genereras server-side, länka direkt till API

---

### FASE 8: Approval Workflow UI (Dag 6)

**Uppgift:** Bygg UI för multi-level approvals

**Filer att skapa:**

1. **`app/components/quotes/ApprovalWorkflow.tsx`**
   - Visa approval chain
   - Status per level (pending/approved/rejected)
   - Approve/Reject buttons (om user är approver)
   - Kommentar-fält

**VIKTIGT:**
- Backend har `quote_approvals` tabell
- Använd `useApproveQuote()` hook med `{ level, reason }`
- Visa endast om `status === 'pending_approval'`

---

### FASE 9: Templates & Materials (Dag 7)

**Uppgift:** Implementera templates och material picker

**Filer att skapa:**

1. **`app/components/quotes/QuoteTemplatePicker.tsx`**
   - Lista templates från `quote_templates`
   - "Använd mall" button
   - Load template items till form

2. **`app/components/quotes/MaterialPicker.tsx`**
   - Sökbar dropdown med materials
   - Visa: Name, SKU, Price, Unit
   - "Lägg till" button som fyller i item-fält

3. **`app/hooks/useQuoteTemplates.ts`**
   - `useQuoteTemplates()` - Lista templates
   - `useLoadTemplate(templateId)` - Ladda template data

4. **`app/hooks/useMaterials.ts`**
   - `useMaterials(search?)` - Lista materials
   - Sökfunktionalitet

**VIKTIGT:**
- Backend har `quote_templates` och `materials` tabeller
- Templates har `body` field (JSONB array av items)
- Materials har `price` och `unit` fields

---

## 🎨 UI/UX BEST PRACTICES

### Design System
- ✅ Använd Tailwind CSS utility classes direkt
- ✅ Följ Frost's design system (se befintliga sidor)
- ✅ Konsistent spacing (p-4, p-6, gap-4, etc.)
- ✅ Färger: Blue för primary, Green för success, Red för danger

### Components
- ✅ Skapa enkla wrapper-komponenter i `app/components/ui/`
- ✅ Använd native HTML elements med Tailwind styling
- ✅ Loading states med Tailwind skeletons
- ✅ Error states med user-friendly messages
- ✅ Empty states med CTAs

### Forms
- ✅ Native HTML forms med `useState` för state
- ✅ Client-side validation med JavaScript
- ✅ Error messages under fält
- ✅ Disable submit button under loading
- ✅ Success feedback (toast notifications med Sonner)

### Tables
- ✅ Responsive (scroll på mobile)
- ✅ Hover effects på rader
- ✅ Action buttons per rad
- ✅ Sortering (optional, backend stödjer order)

### Modals/Dialogs
- ✅ Enkel modal med backdrop
- ✅ ESC för att stänga
- ✅ Click outside för att stänga
- ✅ Loading states i modals

---

## 🔗 INTEGRATION POINTS

### Existing Hooks (använd dessa)
```typescript
// app/context/TenantContext.tsx
import { useTenant } from '@/context/TenantContext'
const { tenantId } = useTenant()

// app/hooks/useClients.ts
import { useClients } from '@/hooks/useClients'
const { data: clients } = useClients()

// app/hooks/useProjects.ts
import { useProjects } from '@/hooks/useProjects'
const { data: projects } = useProjects()
```

### API Integration
Alla API calls ska gå via React Query hooks:
```typescript
// Exempel: useQuotes hook
export function useQuotes(filters?: QuoteFilters) {
  const { tenantId } = useTenant() // Från context
  
  return useQuery({
    queryKey: ['quotes', tenantId, filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.status) params.set('status', filters.status)
      if (filters?.customer_id) params.set('customer_id', filters.customer_id)
      
      const res = await fetch(`/api/quotes?${params}`)
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to fetch quotes')
      }
      const data = await res.json()
      // Hantera både { success: true, data } och { data } format
      return (data.success ? data.data : data.data) as Quote[]
    },
    enabled: !!tenantId
  })
}
```

---

## 📝 CODE STYLE & CONVENTIONS

- ✅ Använd TypeScript med strikt typing
- ✅ "use client" för alla client components
- ✅ Använd React Query för data fetching
- ✅ Error handling med `extractErrorMessage()` från `@/lib/errorUtils`
- ✅ Toast notifications med Sonner för user feedback
- ✅ Loading states överallt
- ✅ Kommentera komplex logik
- ✅ Följ Next.js 16 App Router patterns
- ✅ Använd native Date API: `new Date().toLocaleDateString('sv-SE')`
- ✅ Använd native HTML forms, INGEN react-hook-form

---

## ⚠️ VIKTIGA ANMÄRKNINGAR

### API Response Formats
Backend returnerar olika format beroende på endpoint:
- `GET /api/quotes` → `{ success: true, data: Quote[], meta: {...} }`
- `GET /api/quotes/[id]` → `{ data: Quote }`
- `POST /api/quotes` → `{ success: true, data: Quote }`
- `PUT /api/quotes/[id]` → `{ data: Quote }`
- `DELETE /api/quotes/[id]` → `{ success: true }` (204 status)

**Fix:** Skapa API client wrapper som hanterar båda formaten.

### Items API
- `PUT /api/quotes/[id]/items` - Tar `{ id: itemId, ...data }` i body
- `DELETE /api/quotes/[id]/items` - Tar `{ id: itemId }` i body
- **INTE** `/api/quotes/[id]/items/[itemId]` - Detta finns INTE!

### Send Quote API
- Tar bara `{ to: email }` i body
- Subject genereras automatiskt av backend
- PDF bifogas automatiskt

### Totals Calculation
- Backend beräknar totals automatiskt via database triggers
- Efter create/update items, refetch quote för att få uppdaterade totals
- Visa totals från backend, INTE client-side calculation

### Date Formatting
- Använd native JavaScript: `new Date(dateString).toLocaleDateString('sv-SE')`
- Eller: `new Date(dateString).toLocaleString('sv-SE', { dateStyle: 'short', timeStyle: 'short' })`
- **INGEN date-fns** - Inte installerat!

### Forms
- Använd native HTML forms med `useState` för state management
- **INGEN react-hook-form** - Inte installerat!
- Validera med JavaScript i `handleSubmit`

---

## ✅ ACCEPTANCE CRITERIA

Frontend är klar när:

- [ ] Alla hooks implementerade och fungerar
- [ ] Quote list-sida med filtering fungerar
- [ ] Quote form (create/edit) fungerar med validation
- [ ] Items editor fungerar (add/remove/edit)
- [ ] Totals visas korrekt (från backend)
- [ ] Detail-sida visar all info korrekt
- [ ] Alla actions fungerar (Send, Approve, Convert, Duplicate, Delete)
- [ ] PDF download fungerar
- [ ] Email sending UI fungerar
- [ ] Approval workflow UI fungerar (om implementerat)
- [ ] Templates kan användas (om implementerat)
- [ ] Material picker fungerar (om implementerat)
- [ ] Responsive design fungerar på mobile
- [ ] Loading states finns överallt
- [ ] Error handling finns överallt
- [ ] Alla transitions valideras korrekt med `canTransition()`

---

## 🚀 PRIORITET

**Implementera i denna ordning:**

1. **Types & API Client** (MÅSTE vara först)
2. **React Query Hooks** (Grundfunktionalitet)
3. **UI Components** (Behövs för resten)
4. **Quote List** (Grundfunktionalitet)
5. **Quote Form** (Kritiskt för att skapa offerter)
6. **Quote Detail** (Kritiskt för att se offerter)
7. **Actions** (Send, Approve, Convert)
8. **Email & PDF** (Viktigt för workflow)
9. **Templates & Materials** (Nice-to-have)

---

## 📚 REFERENSER

- **Backend API:** Se ovan för alla endpoints och response formats
- **Existing Components:** Kolla `app/components/` för design patterns
- **Existing Hooks:** Kolla `app/hooks/` för React Query patterns
- **Design System:** Följ Tailwind classes från befintliga sidor
- **Error Utils:** Använd `extractErrorMessage` från `@/lib/errorUtils`
- **Workflow:** Använd `canTransition` från `@/lib/quotes/workflow`

---

## 🎯 SPECIFIKA UPPGIFTER

### Task 1: Setup Types & API Client
- Skapa `app/types/quotes.ts` med alla interfaces
- Skapa `app/lib/api/quotes.ts` med API client wrapper
- Hantera både `{ success: true, data }` och `{ data }` formats
- Testa mot backend API

### Task 2: React Query Hooks
- Skapa `app/hooks/useQuotes.ts` med CRUD hooks
- Skapa `app/hooks/useQuoteItems.ts` med items hooks
- Skapa `app/hooks/useQuoteActions.ts` med action hooks
- Använd korrekta API endpoints och payload formats
- Testa hooks mot backend

### Task 3: UI Components
- Skapa enkla wrapper-komponenter i `app/components/ui/`
- Använd Tailwind CSS direkt
- Håll komponenterna enkla och återanvändbara

### Task 4: Quote List Page
- Skapa `app/quotes/page.tsx`
- Skapa `app/components/quotes/QuoteList.tsx`
- Skapa `app/components/quotes/QuoteFilters.tsx`
- Implementera filtering och pagination
- Använd `useClients()` hook för customer dropdown

### Task 5: Quote Form
- Skapa `app/quotes/new/page.tsx`
- Skapa `app/quotes/[id]/edit/page.tsx`
- Skapa `app/components/quotes/QuoteForm.tsx`
- Skapa `app/components/quotes/QuoteItemsEditor.tsx`
- Använd native HTML forms med useState
- Implementera real-time totals display (från backend)

### Task 6: Quote Detail & Actions
- Skapa `app/quotes/[id]/page.tsx`
- Skapa `app/components/quotes/QuoteDetail.tsx`
- Skapa `app/components/quotes/QuoteActions.tsx`
- Implementera alla actions med korrekta API calls
- Använd `canTransition()` för status validation

### Task 7: Email & PDF
- Skapa `app/components/quotes/SendQuoteModal.tsx`
- Skapa `app/components/quotes/PDFPreview.tsx`
- Implementera email sending (bara `to` field)
- Implementera PDF download link

### Task 8: Approval Workflow
- Skapa `app/components/quotes/ApprovalWorkflow.tsx`
- Implementera approval UI
- Använd `useApproveQuote()` hook

### Task 9: Templates & Materials
- Skapa `app/components/quotes/QuoteTemplatePicker.tsx`
- Skapa `app/components/quotes/MaterialPicker.tsx`
- Skapa `app/hooks/useQuoteTemplates.ts`
- Skapa `app/hooks/useMaterials.ts`
- Implementera template loading och material picker

---

**Börja med Types & API Client och arbeta dig igenom listan systematiskt. Använd backend API:erna som redan fungerar. Följ exakt API response formats och payload structures. Lycka till! 🚀**

