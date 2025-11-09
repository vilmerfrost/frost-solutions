# Supplier Invoices Backend Documentation

## Overview

Detta dokument beskriver backend-implementationen för Leverantörsfakturor (Supplier Invoice Management) i Frost Solutions. Systemet hanterar leverantörsfakturor med OCR-scanning, automatisk påslagsberäkning, betalningsspårning och konvertering till kundfakturor.

## Database Schema

### Tables

- **`suppliers`** - Leverantörsregister (unique per tenant: name)
- **`supplier_invoices`** - Huvudfaktura (totals, paid, markup_total, file_path)
- **`supplier_invoice_items`** - Radartiklar (generated line_total/tax)
- **`supplier_invoice_allocations`** - Kostnadsfördelning
- **`supplier_invoice_payments`** - Betalningar
- **`supplier_invoice_approvals`** - Multi-level approvals
- **`supplier_invoice_history`** - Audit trail
- **`markup_rules`** - Dynamiska påslag

### Key Features

- **Generated Columns**: `line_total`, `tax_amount`, `amount_remaining` beräknas automatiskt
- **Triggers**: Automatisk totals-recalc vid ändringar i items eller payments
- **RLS**: Tenant isolation via `app.user_roles`

## API Endpoints

### GET `/api/supplier-invoices`

Lista leverantörsfakturor med filtering och pagination.

**Query Parameters:**
- `status` - Filter på status
- `projectId` - Filter på projekt
- `supplierId` - Filter på leverantör
- `search` - Sök i fakturanummer/noteringar
- `from` - Startdatum (YYYY-MM-DD)
- `to` - Slutdatum (YYYY-MM-DD)
- `page` - Sidnummer (default: 1)
- `limit` - Antal per sida (default: 20, max: 100)

**Response:**
```json
{
  "success": true,
  "data": [...],
  "meta": { "page": 1, "limit": 20, "count": 50 }
}
```

### POST `/api/supplier-invoices`

Skapa ny leverantörsfaktura (manual entry eller OCR).

**Content-Type:** `application/json` eller `multipart/form-data`

**JSON Body:**
```json
{
  "supplier_id": "uuid",
  "project_id": "uuid" | null,
  "invoice_number": "string",
  "invoice_date": "YYYY-MM-DD",
  "due_date": "YYYY-MM-DD",
  "currency": "SEK",
  "exchange_rate": 1.0,
  "items": [
    {
      "item_type": "material" | "labor" | "transport" | "other",
      "name": "string",
      "description": "string",
      "quantity": 1.0,
      "unit": "st",
      "unit_price": 100.0,
      "vat_rate": 25.0,
      "order_index": 1
    }
  ],
  "notes": "string"
}
```

**Multipart Form Data:**
- `supplier_id` - UUID
- `project_id` - UUID (optional)
- `file` - PDF eller bildfil

### GET `/api/supplier-invoices/[id]`

Hämta specifik leverantörsfaktura med items och payments.

### PATCH `/api/supplier-invoices/[id]`

Uppdatera leverantörsfaktura.

**Body:**
```json
{
  "status": "approved" | "draft" | ...,
  "invoice_date": "YYYY-MM-DD",
  "due_date": "YYYY-MM-DD",
  "currency": "SEK",
  "exchange_rate": 1.0,
  "markup_override": 0.0,
  "notes": "string"
}
```

**Note:** Om `status` ändras till `approved`, beräknas automatiskt markup.

### DELETE `/api/supplier-invoices/[id]`

Soft delete (sätter status till `archived`).

### POST `/api/supplier-invoices/[id]/payments`

Registrera betalning.

**Body:**
```json
{
  "amount": 1250.00,
  "paymentDate": "YYYY-MM-DD",
  "method": "bankgiro",
  "notes": "string"
}
```

### POST `/api/supplier-invoices/[id]/to-customer-invoice`

Konvertera leverantörsfaktura till kundfaktura (med påslag).

**Response:**
```json
{
  "success": true,
  "data": { "customerInvoiceId": "uuid" }
}
```

### POST `/api/supplier-invoices/upload`

Upload och OCR-scanning av fakturafil.

**Form Data:**
- `supplier_id` - UUID
- `project_id` - UUID (optional)
- `file` - PDF eller bildfil

**Response:**
```json
{
  "success": true,
  "data": {
    "invoiceId": "uuid",
    "ocr": { "confidence": 85.5 }
  }
}
```

### GET `/api/supplier-invoices/[id]/history`

Hämta audit trail för leverantörsfaktura.

## React Query Hooks

### `useSupplierInvoices(filters?)`

Hämta lista av leverantörsfakturor.

```typescript
const { data, isLoading, error } = useSupplierInvoices({
  status: 'approved',
  projectId: 'uuid',
  page: 1,
  limit: 20
})
```

### `useSupplierInvoice(id)`

Hämta specifik leverantörsfaktura.

```typescript
const { data, isLoading } = useSupplierInvoice(invoiceId)
```

### `useCreateSupplierInvoice()`

Skapa ny leverantörsfaktura.

```typescript
const createInvoice = useCreateSupplierInvoice()

createInvoice.mutate({
  supplier_id: 'uuid',
  invoice_number: 'LF-2025-001',
  invoice_date: '2025-01-08',
  items: [...]
})
```

### `useUploadSupplierInvoice()`

Upload och OCR-scanning.

```typescript
const uploadInvoice = useUploadSupplierInvoice()

const formData = new FormData()
formData.append('supplier_id', supplierId)
formData.append('file', file)

uploadInvoice.mutate(formData)
```

### `useUpdateSupplierInvoice(id)`

Uppdatera leverantörsfaktura.

```typescript
const updateInvoice = useUpdateSupplierInvoice(invoiceId)

updateInvoice.mutate({
  status: 'approved'
})
```

### `useRecordSupplierPayment(id)`

Registrera betalning.

```typescript
const recordPayment = useRecordSupplierPayment(invoiceId)

recordPayment.mutate({
  amount: 1250.00,
  paymentDate: '2025-01-10',
  method: 'bankgiro'
})
```

### `useConvertSupplierInvoice(id)`

Konvertera till kundfaktura.

```typescript
const convertInvoice = useConvertSupplierInvoice(invoiceId)

convertInvoice.mutate()
```

### `useSupplierInvoiceHistory(id)`

Hämta historik.

```typescript
const { data: history } = useSupplierInvoiceHistory(invoiceId)
```

## OCR Setup

### Tesseract.js (Primary)

Tesseract.js är installerat som dependency och används som primär OCR-lösning.

**Språk:** `eng+swe` (English + Swedish)

**Confidence Threshold:** 
- `>= 70%` → Status: `pending_approval`
- `< 70%` → Status: `draft` (kräver manuell granskning)

### Google Vision (Fallback)

Om `GOOGLE_VISION_API_KEY` är satt i `.env.local`, används Google Vision som fallback om Tesseract confidence < 75%.

**Setup:**
1. Skapa Google Cloud Project
2. Aktivera Vision API
3. Skapa API Key
4. Lägg till i `.env.local`:
   ```
   GOOGLE_VISION_API_KEY=your_api_key_here
   ```

## Storage

### Bucket: `supplier_invoices`

**Path Structure:** `{tenantId}/{timestamp}_{filename}`

**Access:** Privat bucket, använd `getSupplierInvoiceUrl()` för signed URLs.

### Helper Function

```typescript
import { getSupplierInvoiceUrl } from '@/lib/storage/getSupplierInvoiceUrl'

const url = await getSupplierInvoiceUrl(filePath, expiresInSeconds)
```

## Markup Calculation

### Markup Rules

Påslag beräknas baserat på `markup_rules` tabellen:

- **Priority**: Högre priority tillämpas först
- **Conditions**: `item_type`, `supplier_id`, `project_id`, `min_amount`, `max_amount`
- **Effect**: `markup_percent` (%) eller `markup_fixed` (fast belopp)

### Auto-Apply

När leverantörsfaktura ändras till `approved`, beräknas automatiskt markup och sparas i `markup_total`.

## Project Cost Integration

När leverantörsfaktura blir `approved`, `booked` eller `paid`, uppdateras projektets `actual_cost` och `budget_percent_used`.

**Function:** `updateProjectCostsFromInvoices(projectId, tenantId)`

**Alert:** Om `budget_percent_used > 80%`, loggas varning (TODO: skicka notifikation).

## Workflow

1. **Upload/Manual Entry** → Status: `draft` eller `pending_approval`
2. **Approval** → Status: `approved` → Auto-beräkna markup
3. **Convert** → Skapa kundfaktura med påslag
4. **Payment** → Registrera betalning → Uppdatera `amount_paid`
5. **Status Update** → `booked` eller `paid`

## Security

- **RLS**: Alla tabeller är tenant-isolerade via `app.user_roles`
- **API Routes**: Använder `getTenantId()` för tenant validation
- **Service Role**: Används för storage uploads och admin operations

## Error Handling

Alla API routes använder `extractErrorMessage()` för konsekvent felhantering.

**Error Response Format:**
```json
{
  "success": false,
  "error": "User-friendly error message"
}
```

## Testing

### Manual Testing

1. Skapa leverantör via Supabase UI
2. Upload faktura via `/api/supplier-invoices/upload`
3. Verifiera OCR-resultat
4. Approve faktura → Verifiera markup-beräkning
5. Registrera betalning
6. Konvertera till kundfaktura

### Postman Examples

Se `docs/API_EXAMPLES_SUPPLIER_INVOICES.md` för Postman-exempel.

## Environment Variables

```env
# Required
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional
GOOGLE_VISION_API_KEY=your_google_vision_api_key
```

## Next Steps

1. ✅ SQL Migration
2. ✅ Backend API Routes
3. ✅ React Query Hooks
4. ⏳ Frontend Components (Claude 4.5)
5. ⏳ Suppliers CRUD API
6. ⏳ Markup Rules Management UI

