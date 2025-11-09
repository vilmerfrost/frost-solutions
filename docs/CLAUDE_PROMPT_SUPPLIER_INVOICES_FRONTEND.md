# Claude 4.5 Frontend Prompt: Leverantörsfakturor (Supplier Invoices)

Du är Claude 4.5 Frontend Architect för Frost Solutions. Du ska implementera ett komplett frontend för Leverantörsfakturor (Supplier Invoice Management) i vårt Next.js 16 App Router + TypeScript + React Query projekt. Backend är redan implementerat och fungerar – din uppgift är att bygga ett premium UI/UX som matchar resten av Frost-applikationen.

---

## 0. Miljö & Tech Stack

- **Framework**: Next.js 16 App Router (server + client components)
- **Styling**: Tailwind CSS (matcha befintlig premium styling från quote-systemet)
- **State**: React Query (hooks finns redan i `app/hooks/useSupplierInvoices.ts`)
- **UI Components**: Använd befintliga från `app/components/ui/` (Button, Input, Select, Table, Badge, etc.)
- **Icons**: Lucide React (`lucide-react`)
- **Forms**: React Hook Form + Zod (för validering)
- **Toasts**: Sonner (via `app/lib/toast`)
- **Language**: TypeScript, strict mode
- **Design**: Premium känsla med gradients, shadows, dark mode support (matcha quote-systemet)

---

## 1. Backend Status

Backend är **100% färdigt** och fungerar:

- ✅ SQL Migration (`sql/migrations/20250108_1200_supplier_invoices.sql`)
- ✅ API Routes (`app/api/supplier-invoices/`)
- ✅ React Query Hooks (`app/hooks/useSupplierInvoices.ts`)
- ✅ Types (`app/types/supplierInvoices.ts`)
- ✅ Markup Engine (`app/lib/markup/`)
- ✅ OCR Layer (`app/lib/ocr/supplierInvoices.ts`)
- ✅ Storage Helper (`app/lib/storage/getSupplierInvoiceUrl.ts`)

**Dokumentation:**
- `docs/SUPPLIER_INVOICES_BACKEND.md` - Full backend dokumentation
- `docs/API_EXAMPLES_SUPPLIER_INVOICES.md` - API exempel

---

## 2. Design Reference

**Matcha quote-systemets premium UI/UX:**

- Gradient backgrounds: `bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900`
- Card styling: `bg-gradient-to-br from-white via-gray-50 to-white dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-800 rounded-xl shadow-xl border-2 border-gray-200 dark:border-gray-700 p-6`
- Headings: `bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent`
- Buttons: Premium styling med gradients och shadows
- Forms: `border-2`, `focus:ring-2 focus:ring-emerald-500`, smooth transitions

**Se exempel:**
- `app/quotes/[id]/page.tsx` - Quote detail view
- `app/components/quotes/QuoteForm.tsx` - Form styling
- `app/components/ui/input.tsx` - Input styling

---

## 3. Pages & Components

### 3.1 Pages

**`app/supplier-invoices/page.tsx`** - Lista leverantörsfakturor
- Filter: status, projekt, leverantör, datum, sök
- Tabell med kolumner: Leverantör, Fakturanummer, Datum, Belopp, Med påslag, Status, Åtgärd
- Pagination
- "Ny faktura" knapp (manual + upload)
- Status badges med färger
- Premium styling

**`app/supplier-invoices/new/page.tsx`** - Skapa ny faktura
- Tabs eller toggle: "Manuell inmatning" / "Upload & OCR"
- Form för manual entry (supplier, project, items, etc.)
- Drag & drop upload för OCR
- Premium form styling

**`app/supplier-invoices/[id]/page.tsx`** - Faktura detaljvy
- Header med fakturanummer, status, leverantör
- Tabs eller sektioner:
  - **Grundläggande Info**: Datum, belopp, påslag, noteringar
  - **Artiklar**: Tabell med items (material/labor/transport/other)
  - **Betalningar**: Lista betalningar, "Registrera betalning" knapp
  - **Historik**: Audit trail
- Action buttons: Approve, Convert to Customer Invoice, Archive, Edit
- Premium card styling

**`app/supplier-invoices/[id]/edit/page.tsx`** - Redigera faktura
- Form för att uppdatera faktura
- Kan ändra status, datum, noteringar, markup override
- Premium form styling

### 3.2 Components

**`app/components/supplier-invoices/InvoiceList.tsx`**
- Tabell med fakturor
- Filtering och sorting
- Status badges
- Action buttons (Visa, Redigera, etc.)

**`app/components/supplier-invoices/InvoiceForm.tsx`**
- Form för manual entry
- Dynamic items list (lägg till/ta bort rader)
- Validering med Zod
- Premium styling

**`app/components/supplier-invoices/InvoiceUpload.tsx`**
- Drag & drop upload area
- Progress indicator för OCR
- Preview av OCR-resultat
- Premium styling (matcha MaterialPicker)

**`app/components/supplier-invoices/InvoiceDetail.tsx`**
- Visa faktura detaljer
- Tabs/sektioner för items, payments, history
- Action buttons
- Premium card styling

**`app/components/supplier-invoices/PaymentForm.tsx`**
- Form för att registrera betalning
- Validering
- Premium styling

**`app/components/supplier-invoices/InvoiceFilters.tsx`**
- Filter UI (status, projekt, leverantör, datum, sök)
- Premium styling (matcha QuoteFilters)

---

## 4. Features & Functionality

### 4.1 Invoice List

- **Filtering**: Status dropdown, Projekt dropdown, Leverantör dropdown, Datum range, Sök
- **Sorting**: Standard: Datum (desc), kan sortera på belopp, leverantör
- **Pagination**: Page size selector, page navigation
- **Status Badges**: Färgkodade badges (draft=grey, approved=blue, paid=green, etc.)
- **Actions**: Visa detaljer, Redigera, Arkivera

### 4.2 Create Invoice

**Manual Entry:**
- Select leverantör (från `suppliers` tabell - behöver API route om den saknas)
- Select projekt (från `projects` - använd befintlig hook)
- Fakturanummer (auto-genererad eller manual)
- Datum, förfallodatum
- Dynamic items list:
  - Item type (material/labor/transport/other)
  - Name, description
  - Quantity, unit, unit price
  - VAT rate
  - Auto-beräkna line total
- Totals display (subtotal, tax, total)
- Notes field

**Upload & OCR:**
- Drag & drop area
- File picker
- Progress indicator
- OCR result preview (confidence, extracted fields)
- Edit extracted data before saving
- Status: `pending_approval` om confidence >= 70%, annars `draft`

### 4.3 Invoice Detail

- **Header**: Fakturanummer, Status badge, Leverantör, Datum
- **Basic Info Card**: 
  - Belopp (subtotal, tax, total)
  - Påslag (markup_total)
  - Billable amount (total + markup)
  - Currency, exchange rate
  - Notes
- **Items Table**: 
  - Kolumner: Type, Name, Quantity, Unit, Unit Price, VAT, Line Total
  - Sorterbar
- **Payments Section**:
  - Lista betalningar
  - "Registrera betalning" knapp
  - Total paid, remaining amount
- **History Section**:
  - Timeline av events (created, updated, approved, paid, etc.)
  - Visa changed_by, timestamp, data
- **Actions**:
  - Approve (om status = pending_approval) → Auto-beräkna markup
  - Convert to Customer Invoice (om approved) → Skapa kundfaktura
  - Archive (soft delete)
  - Edit
  - Download PDF (om file_path finns)

### 4.4 Payment Recording

- Form: Amount, Payment Date, Method (bankgiro/check/cash), Notes
- Validering: Amount <= remaining amount
- Efter registrering: Uppdatera invoice status (paid om amount_paid >= amount_total)

### 4.5 Convert to Customer Invoice

- Modal eller confirmation dialog
- Visa preview: Billable amount, Customer (från projekt)
- Efter konvertering: Redirect till kundfaktura eller visa success message

---

## 5. Integration Points

### 5.1 Suppliers

Om `suppliers` API saknas, skapa:
- `app/api/suppliers/route.ts` - GET (list), POST (create)
- `app/hooks/useSuppliers.ts` - React Query hooks

**Minimal implementation:**
```typescript
// GET /api/suppliers
export async function GET(req: NextRequest) {
  const tenantId = await getTenantId()
  const admin = createAdminClient()
  const { data } = await admin.from('suppliers').select('*').eq('tenant_id', tenantId)
  return NextResponse.json({ success: true, data })
}
```

### 5.2 Projects

Använd befintlig `useProjects` hook från projektet.

### 5.3 Customer Invoices

Efter konvertering, redirect till `/invoices/{customerInvoiceId}` eller visa success message med länk.

---

## 6. UI/UX Requirements

### 6.1 Premium Styling

- **Gradients**: Använd samma gradient patterns som quote-systemet
- **Shadows**: `shadow-xl`, `shadow-lg` för cards
- **Borders**: `border-2` med färger
- **Transitions**: `transition-all duration-200`
- **Dark Mode**: Full support med `dark:` variants

### 6.2 Responsive Design

- Mobile-first approach
- Tabell → Cards på mobile
- Filter → Collapsible drawer på mobile

### 6.3 Loading States

- Skeleton loaders för list
- Spinner för actions
- Progress bar för OCR upload

### 6.4 Error Handling

- User-friendly error messages
- Toast notifications för success/error
- Error boundaries för kritiska komponenter

### 6.5 Accessibility

- ARIA labels
- Keyboard navigation
- Focus states
- Screen reader support

---

## 7. Code Structure

### 7.1 File Organization

```
app/
  supplier-invoices/
    page.tsx                    # List page
    new/
      page.tsx                  # Create page
    [id]/
      page.tsx                  # Detail page
      edit/
        page.tsx                # Edit page
  components/
    supplier-invoices/
      InvoiceList.tsx
      InvoiceForm.tsx
      InvoiceUpload.tsx
      InvoiceDetail.tsx
      PaymentForm.tsx
      InvoiceFilters.tsx
      InvoiceItemsTable.tsx
      InvoicePaymentsList.tsx
      InvoiceHistoryTimeline.tsx
```

### 7.2 Component Patterns

- **Server Components**: För data fetching där möjligt
- **Client Components**: För interaktivitet, forms, state
- **Hooks**: Använd `useSupplierInvoices` hooks för data
- **Validation**: Zod schemas för forms

---

## 8. Specific Implementation Details

### 8.1 Invoice Status Colors

```typescript
const statusColors = {
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  pending_approval: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  approved: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  booked: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  archived: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
}
```

### 8.2 Item Type Colors

```typescript
const itemTypeColors = {
  material: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  labor: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  transport: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  other: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
}
```

### 8.3 Currency Formatting

```typescript
const formatCurrency = (amount: number, currency = 'SEK') => {
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  }).format(amount)
}
```

### 8.4 Date Formatting

```typescript
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('sv-SE')
}
```

---

## 9. Testing Checklist

- [ ] Lista fakturor med filter
- [ ] Skapa faktura (manual)
- [ ] Upload faktura (OCR)
- [ ] Visa faktura detaljer
- [ ] Approve faktura → Verifiera markup-beräkning
- [ ] Registrera betalning
- [ ] Konvertera till kundfaktura
- [ ] Redigera faktura
- [ ] Arkivera faktura
- [ ] Responsive design (mobile/tablet/desktop)
- [ ] Dark mode
- [ ] Error handling
- [ ] Loading states

---

## 10. Deliverables

1. ✅ Alla pages (`app/supplier-invoices/`)
2. ✅ Alla components (`app/components/supplier-invoices/`)
3. ✅ Suppliers API + hooks (om saknas)
4. ✅ Integration med sidebar (lägg till "Leverantörsfakturor" länk)
5. ✅ Premium UI/UX (matcha quote-systemet)
6. ✅ Responsive design
7. ✅ Dark mode support
8. ✅ Error handling & loading states
9. ✅ Accessibility (ARIA, keyboard nav)

---

## 11. Important Notes

- **Backend är färdigt** – fokusera 100% på frontend
- **Matcha quote-systemets styling** – samma premium känsla
- **Använd befintliga hooks** – `useSupplierInvoices` finns redan
- **TypeScript strict** – inga `any` typer
- **Error handling** – user-friendly messages, toasts
- **Performance** – lazy loading, code splitting där möjligt
- **SEO** – Server components för metadata

---

## 12. Reference Files

**Backend:**
- `app/hooks/useSupplierInvoices.ts` - React Query hooks
- `app/types/supplierInvoices.ts` - TypeScript types
- `docs/SUPPLIER_INVOICES_BACKEND.md` - Full dokumentation

**Design Reference:**
- `app/quotes/[id]/page.tsx` - Premium detail view
- `app/components/quotes/QuoteForm.tsx` - Premium form styling
- `app/components/ui/input.tsx` - Input component
- `app/components/ui/select.tsx` - Select component

**Similar Features:**
- `app/materials/page.tsx` - List page example
- `app/quotes/page.tsx` - List page with filters

---

**Kör hårt! Bygg ett premium UI som matchar quote-systemets kvalitet!** 🚀

