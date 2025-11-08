# Gemini 2.5 Frontend Prompt: Dag 6-7 KMA/Offert Implementation

## 🎯 UPPGIFT: Implementera komplett Quote/KMA Frontend System

Du är senior frontend-utvecklare för Frost Solutions. Backend är redan implementerat och fungerar. Din uppgift är att bygga en komplett, production-ready frontend för Quote/KMA-systemet i Next.js 16 + React 19 + TypeScript + Tailwind CSS.

---

## 📋 BACKEND STATUS (REDAN KLART)

Backend är 100% implementerat och testad:

✅ **API Routes:**
- `GET/POST /api/quotes` - Lista och skapa offerter
- `GET/PUT/DELETE /api/quotes/[id]` - CRUD för offerter
- `GET/POST/PUT/DELETE /api/quotes/[id]/items` - Items CRUD
- `GET /api/quotes/[id]/pdf` - PDF generering
- `POST /api/quotes/[id]/send` - Skicka email
- `POST /api/quotes/[id]/approve` - Godkänn offert
- `POST /api/quotes/[id]/convert` - Konvertera till projekt
- `POST /api/quotes/[id]/duplicate` - Duplicera offert

✅ **Backend Libraries:**
- `app/lib/pricing/calculateQuoteTotal.ts` - Pricing engine
- `app/lib/pricing/generateQuoteNumber.ts` - Quote number generation
- `app/lib/quotes/workflow.ts` - Status transitions
- `app/lib/quotes/approval.ts` - Approval system
- `app/lib/email/sendQuoteEmail.ts` - Email sending
- `app/lib/pdf/quote-template.tsx` - PDF template
- `app/lib/pdf/generateQuotePDF.ts` - PDF generation

✅ **Database Schema:**
- `quotes` - Huvudtabell med status, totals, KMA fields
- `quote_items` - Radartiklar med generated columns
- `quote_templates` - Mallar för återanvändning
- `quote_approvals` - Multi-level approvals
- `quote_history` - Audit trail
- `materials` - Materialdatabas
- `pricing_rules` - Dynamiska prissättningsregler

**Allt fungerar - du behöver bara bygga frontend!**

---

## 🏗️ TEKNISK STACK

- **Framework:** Next.js 16 (App Router)
- **UI:** React 19 + TypeScript
- **Styling:** Tailwind CSS
- **State Management:** React Query (@tanstack/react-query)
- **Forms:** React Hook Form (eller native forms)
- **Icons:** Lucide React (redan installerat)
- **Notifications:** Sonner (redan installerat)
- **PDF Preview:** Inline PDF viewer eller download button

---

## 📦 IMPLEMENTATION PLAN - FRONTEND FOKUS

### FASE 1: Types & Hooks (Dag 1)

**Uppgift:** Skapa TypeScript types och React Query hooks

**Filer att skapa:**

1. **`app/types/quotes.ts`**
   ```typescript
   export type QuoteStatus = 
     | 'draft' | 'pending_approval' | 'approved' | 'sent' 
     | 'viewed' | 'accepted' | 'rejected' | 'expired' | 'archived'

   export interface Quote {
     id: string
     tenant_id: string
     customer_id: string
     project_id?: string
     quote_number: string
     version_number: number
     title: string
     notes?: string
     currency: string
     valid_until?: string
     kma_enabled: boolean
     status: QuoteStatus
     subtotal: number
     discount_amount: number
     tax_amount: number
     total_amount: number
     email_sent_count: number
     opened_at?: string
     created_by: string
     approved_at?: string
     created_at: string
     updated_at: string
     items?: QuoteItem[]
     customer?: { name?: string }
   }

   export interface QuoteItem {
     id?: string
     tenant_id: string
     quote_id: string
     item_type: 'material' | 'labor' | 'other'
     name: string
     description?: string
     quantity: number
     unit: string
     unit_price: number
     discount: number
     vat_rate: number
     order_index: number
     line_total?: number
     discount_amount?: number
     net_price?: number
   }
   ```

2. **`app/hooks/useQuotes.ts`**
   - `useQuotes()` - Lista offerter med filtering
   - `useQuote(id)` - Hämta specifik offert
   - `useCreateQuote()` - Skapa ny offert mutation
   - `useUpdateQuote()` - Uppdatera offert mutation
   - `useDeleteQuote()` - Ta bort offert mutation

3. **`app/hooks/useQuoteItems.ts`**
   - `useQuoteItems(quoteId)` - Lista items för offert
   - `useCreateQuoteItem()` - Lägg till item mutation
   - `useUpdateQuoteItem()` - Uppdatera item mutation
   - `useDeleteQuoteItem()` - Ta bort item mutation

**Krav:**
- ✅ Använd React Query för caching och invalidation
- ✅ Error handling med `extractErrorMessage()`
- ✅ Optimistic updates där möjligt
- ✅ Auto-refetch vid mutations

---

### FASE 2: Quote List & Filters (Dag 2)

**Uppgift:** Bygg lista-sida med filtering och sökning

**Filer att skapa:**

1. **`app/quotes/page.tsx`**
   - Lista alla offerter i tabell
   - Filter: Status, Customer, Date range
   - Sök: Quote number, Title
   - Pagination
   - Actions: View, Edit, Delete, Duplicate, Send, Convert

2. **`app/components/quotes/QuoteList.tsx`**
   - Tabell-komponent med sortering
   - Status badges (färgkodade)
   - Action buttons per rad

3. **`app/components/quotes/QuoteFilters.tsx`**
   - Status dropdown
   - Customer dropdown (från `useClients()` hook)
   - Date range picker
   - Clear filters button

**UI Design:**
- ✅ Modern tabell med hover effects
- ✅ Status badges med Tailwind colors (draft=gray, approved=green, sent=blue, etc.)
- ✅ Responsive design (mobile-friendly)
- ✅ Loading states med skeletons
- ✅ Empty states med "Skapa första offert" CTA

**Exempel struktur:**
```tsx
// app/quotes/page.tsx
"use client"

import { useState } from 'react'
import { useQuotes } from '@/hooks/useQuotes'
import { QuoteList } from '@/components/quotes/QuoteList'
import { QuoteFilters } from '@/components/quotes/QuoteFilters'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export default function QuotesPage() {
  const [filters, setFilters] = useState({ status: '', customer_id: '' })
  const { data: quotes, isLoading } = useQuotes(filters)

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Offerter</h1>
        <Link href="/quotes/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Ny offert
          </Button>
        </Link>
      </div>

      <QuoteFilters filters={filters} onFiltersChange={setFilters} />
      <QuoteList quotes={quotes} isLoading={isLoading} />
    </div>
  )
}
```

---

### FASE 3: Quote Form & Editor (Dag 3)

**Uppgift:** Bygg formulär för att skapa/redigera offerter

**Filer att skapa:**

1. **`app/quotes/new/page.tsx`** - Skapa ny offert
2. **`app/quotes/[id]/edit/page.tsx`** - Redigera offert
3. **`app/components/quotes/QuoteForm.tsx`** - Huvudformulär
4. **`app/components/quotes/QuoteItemsEditor.tsx`** - Items editor med add/remove/edit
5. **`app/components/quotes/QuoteItemRow.tsx`** - Enskild item-rad

**Formulär-fält:**
- Title (required)
- Customer (dropdown från `useClients()`)
- Project (optional, dropdown från `useProjects()`)
- Valid Until (date picker)
- KMA Enabled (checkbox)
- Notes (textarea)
- Items table med:
  - Item Type (material/labor/other)
  - Name (required)
  - Description
  - Quantity
  - Unit (st, m, m2, tim, etc.)
  - Unit Price
  - Discount (%)
  - VAT Rate (default 25%)

**UI Features:**
- ✅ Real-time totals calculation (visa subtotal, discount, tax, total)
- ✅ Add/Remove items dynamiskt
- ✅ Drag & drop för att ändra ordning (optional, nice-to-have)
- ✅ Material picker (om item_type = material, visa dropdown från materials)
- ✅ Auto-save draft (optional)
- ✅ Validation med error messages
- ✅ Loading states vid save

**Totals Display:**
```tsx
// Visa totals i sidebar eller footer
<div className="bg-gray-50 p-4 rounded-lg">
  <div className="flex justify-between mb-2">
    <span>Delsumma:</span>
    <span>{quote.subtotal.toFixed(2)} SEK</span>
  </div>
  {quote.discount_amount > 0 && (
    <div className="flex justify-between mb-2 text-red-600">
      <span>Rabatt:</span>
      <span>-{quote.discount_amount.toFixed(2)} SEK</span>
    </div>
  )}
  <div className="flex justify-between mb-2">
    <span>Moms (25%):</span>
    <span>{quote.tax_amount.toFixed(2)} SEK</span>
  </div>
  <div className="flex justify-between text-xl font-bold pt-2 border-t">
    <span>Totalt:</span>
    <span>{quote.total_amount.toFixed(2)} SEK</span>
  </div>
</div>
```

---

### FASE 4: Quote Detail & Actions (Dag 4)

**Uppgift:** Bygg detaljsida med alla actions

**Filer att skapa:**

1. **`app/quotes/[id]/page.tsx`** - Detaljsida
2. **`app/components/quotes/QuoteDetail.tsx`** - Huvudkomponent
3. **`app/components/quotes/QuoteActions.tsx`** - Action buttons (Send, Approve, Convert, etc.)
4. **`app/components/quotes/QuoteStatusBadge.tsx`** - Status badge komponent
5. **`app/components/quotes/QuoteHistory.tsx`** - Visa audit trail

**Actions att implementera:**

1. **Send Email**
   - Modal med email input
   - Visa preview av email
   - Skicka via `/api/quotes/[id]/send`
   - Toast notification vid success

2. **Approve**
   - Modal för approval (om multi-level)
   - Kommentar-fält
   - Skicka via `/api/quotes/[id]/approve`
   - Uppdatera status

3. **Convert to Project**
   - Bekräftelsedialog
   - Skicka via `/api/quotes/[id]/convert`
   - Redirect till nytt projekt

4. **Duplicate**
   - Skicka via `/api/quotes/[id]/duplicate`
   - Redirect till ny offert (draft)

5. **Download PDF**
   - Button som länkar till `/api/quotes/[id]/pdf`
   - Öppna i ny flik eller download

6. **Status Change**
   - Dropdown eller buttons för status transitions
   - Validera transitions (använd `canTransition()` från backend)
   - Visa endast tillåtna transitions

**UI Layout:**
```
┌─────────────────────────────────────┐
│ [Status Badge]  [Actions Dropdown] │
├─────────────────────────────────────┤
│ Quote Info                          │
│ - Number, Title, Customer           │
│ - Dates, KMA status                 │
├─────────────────────────────────────┤
│ Items Table                         │
│ - All items with totals             │
├─────────────────────────────────────┤
│ Totals Summary                      │
│ - Subtotal, Discount, Tax, Total   │
├─────────────────────────────────────┤
│ History Timeline                    │
│ - Created, Updated, Sent, etc.     │
└─────────────────────────────────────┘
```

---

### FASE 5: Email & PDF Features (Dag 5)

**Uppgift:** Implementera email sending UI och PDF preview

**Filer att skapa:**

1. **`app/components/quotes/SendQuoteModal.tsx`**
   - Email input
   - Subject input (editable)
   - Preview av email content
   - Send button med loading state
   - Success/error handling

2. **`app/components/quotes/PDFPreview.tsx`**
   - Iframe eller embed för PDF preview
   - Download button
   - Print button

3. **`app/components/quotes/EmailTracking.tsx`**
   - Visa email_sent_count
   - Visa opened_at om det finns
   - Tracking status indicator

**Email Modal:**
```tsx
<Dialog>
  <DialogHeader>
    <DialogTitle>Skicka offert</DialogTitle>
  </DialogHeader>
  <DialogContent>
    <form onSubmit={handleSend}>
      <label>Email:</label>
      <input 
        type="email" 
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <label>Ämne:</label>
      <input 
        type="text"
        value={`Offert ${quote.quote_number}`}
        onChange={(e) => setSubject(e.target.value)}
      />
      <p className="text-sm text-gray-500">
        PDF kommer bifogas automatiskt.
      </p>
      <Button type="submit" disabled={sending}>
        {sending ? 'Skickar...' : 'Skicka'}
      </Button>
    </form>
  </DialogContent>
</Dialog>
```

---

### FASE 6: Approval Workflow UI (Dag 6)

**Uppgift:** Bygg UI för multi-level approvals

**Filer att skapa:**

1. **`app/components/quotes/ApprovalWorkflow.tsx`**
   - Visa approval chain
   - Visa status per level (pending/approved/rejected)
   - Approve/Reject buttons (om user är approver)
   - Kommentar-fält

2. **`app/components/quotes/ApprovalLevel.tsx`**
   - Enskild approval level komponent
   - Status indicator
   - Approver name
   - Timestamp

**UI Design:**
```
Approval Workflow:
┌─────────────────────────────────┐
│ Level 1: Manager               │
│ ✅ Approved - 2025-01-08 10:00 │
│ "Looks good!"                   │
├─────────────────────────────────┤
│ Level 2: Director               │
│ ⏳ Pending                      │
│ [Approve] [Reject]              │
└─────────────────────────────────┘
```

---

### FASE 7: Templates & Materials (Dag 7)

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
   - `useCreateTemplate()` - Skapa template
   - `useLoadTemplate()` - Ladda template data

4. **`app/hooks/useMaterials.ts`**
   - `useMaterials()` - Lista materials
   - `useCreateMaterial()` - Skapa material
   - `useSearchMaterials()` - Sök materials

**Template Usage:**
```tsx
// När användare väljer template
const handleLoadTemplate = async (templateId: string) => {
  const template = await loadTemplate(templateId)
  setFormData({
    ...formData,
    items: template.body // Array av items
  })
}
```

---

## 🎨 UI/UX BEST PRACTICES

### Design System
- ✅ Använd Tailwind CSS utility classes
- ✅ Följ Frost's design system (se befintliga komponenter)
- ✅ Konsistent spacing (p-4, p-6, gap-4, etc.)
- ✅ Färger: Blue för primary actions, Green för success, Red för danger

### Components
- ✅ Använd befintliga UI components om de finns (`app/components/ui/`)
- ✅ Skapa återanvändbara komponenter
- ✅ Loading states med skeletons eller spinners
- ✅ Error states med user-friendly messages
- ✅ Empty states med CTAs

### Forms
- ✅ Client-side validation
- ✅ Error messages under fält
- ✅ Disable submit button under loading
- ✅ Success feedback (toast notifications)
- ✅ Auto-focus första fältet

### Tables
- ✅ Responsive (scroll på mobile, eller card-layout)
- ✅ Hover effects på rader
- ✅ Action buttons per rad
- ✅ Sortering på kolumner (optional)

### Modals/Dialogs
- ✅ Använd Dialog komponent (eller Tailwind modal)
- ✅ ESC för att stänga
- ✅ Click outside för att stänga
- ✅ Focus trap
- ✅ Loading states i modals

---

## 🔗 INTEGRATION POINTS

### Existing Hooks (använd dessa)
- `useClients()` - För customer dropdown
- `useProjects()` - För project dropdown
- `useTenant()` - För tenant context

### API Integration
Alla API calls ska gå via React Query hooks:
```typescript
// Exempel: useQuotes hook
export function useQuotes(filters?: { status?: string; customer_id?: string }) {
  const { tenantId } = useTenant()
  
  return useQuery({
    queryKey: ['quotes', tenantId, filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.status) params.set('status', filters.status)
      if (filters?.customer_id) params.set('customer_id', filters.customer_id)
      
      const res = await fetch(`/api/quotes?${params}`)
      if (!res.ok) throw new Error('Failed to fetch quotes')
      const data = await res.json()
      return data.data as Quote[]
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
- ✅ Error handling med `extractErrorMessage()`
- ✅ Toast notifications för user feedback
- ✅ Loading states överallt
- ✅ Kommentera komplex logik
- ✅ Följ Next.js 16 App Router patterns

---

## ✅ ACCEPTANCE CRITERIA

Frontend är klar när:

- [ ] Alla hooks implementerade och fungerar
- [ ] Quote list-sida med filtering fungerar
- [ ] Quote form (create/edit) fungerar med validation
- [ ] Items editor fungerar (add/remove/edit)
- [ ] Totals uppdateras real-time
- [ ] Detail-sida visar all info korrekt
- [ ] Alla actions fungerar (Send, Approve, Convert, Duplicate, Delete)
- [ ] PDF download fungerar
- [ ] Email sending UI fungerar
- [ ] Approval workflow UI fungerar
- [ ] Templates kan användas
- [ ] Material picker fungerar
- [ ] Responsive design fungerar på mobile
- [ ] Loading states finns överallt
- [ ] Error handling finns överallt
- [ ] Alla transitions valideras korrekt

---

## 🚀 PRIORITET

**Implementera i denna ordning:**

1. **Types & Hooks** (MÅSTE vara först)
2. **Quote List** (Grundfunktionalitet)
3. **Quote Form** (Kritiskt för att skapa offerter)
4. **Quote Detail** (Kritiskt för att se offerter)
5. **Actions** (Send, Approve, Convert)
6. **Email & PDF** (Viktigt för workflow)
7. **Templates & Materials** (Nice-to-have men viktigt)

---

## 📚 REFERENSER

- **Backend API:** Se ovan för alla endpoints
- **Existing Components:** Kolla `app/components/` för design patterns
- **Existing Hooks:** Kolla `app/hooks/` för React Query patterns
- **Design System:** Följ Tailwind classes från befintliga sidor

---

## 🎯 SPECIFIKA UPPGIFTER

### Task 1: Setup Types & Hooks
- Skapa `app/types/quotes.ts` med alla interfaces
- Skapa `app/hooks/useQuotes.ts` med CRUD hooks
- Skapa `app/hooks/useQuoteItems.ts` med items hooks
- Testa hooks mot backend API

### Task 2: Quote List Page
- Skapa `app/quotes/page.tsx`
- Skapa `app/components/quotes/QuoteList.tsx`
- Skapa `app/components/quotes/QuoteFilters.tsx`
- Implementera filtering och sökning
- Implementera pagination

### Task 3: Quote Form
- Skapa `app/quotes/new/page.tsx`
- Skapa `app/quotes/[id]/edit/page.tsx`
- Skapa `app/components/quotes/QuoteForm.tsx`
- Skapa `app/components/quotes/QuoteItemsEditor.tsx`
- Implementera real-time totals
- Implementera validation

### Task 4: Quote Detail & Actions
- Skapa `app/quotes/[id]/page.tsx`
- Skapa `app/components/quotes/QuoteDetail.tsx`
- Skapa `app/components/quotes/QuoteActions.tsx`
- Implementera alla actions (Send, Approve, Convert, etc.)
- Implementera status transitions

### Task 5: Email & PDF
- Skapa `app/components/quotes/SendQuoteModal.tsx`
- Skapa `app/components/quotes/PDFPreview.tsx`
- Implementera email sending UI
- Implementera PDF download/preview

### Task 6: Approval Workflow
- Skapa `app/components/quotes/ApprovalWorkflow.tsx`
- Implementera approval UI
- Implementera approve/reject actions

### Task 7: Templates & Materials
- Skapa `app/components/quotes/QuoteTemplatePicker.tsx`
- Skapa `app/components/quotes/MaterialPicker.tsx`
- Skapa `app/hooks/useQuoteTemplates.ts`
- Skapa `app/hooks/useMaterials.ts`
- Implementera template loading
- Implementera material picker

---

**Börja med Types & Hooks och arbeta dig igenom listan systematiskt. Använd backend API:erna som redan fungerar. Lycka till! 🚀**

