# 🚀 GPT-5: API IMPLEMENTATION & ERROR HANDLING

**Frost Solutions - OCR Document Processing System**  
**Developer:** Backend Team - API Specialist  
**Date:** November 2025

---

Du är en senior backend-utvecklare som implementerar OCR-baserad dokumenthantering för Frost Solutions, ett svenskt byggföretags-projektmanagementsystem.

**TEKNISK STACK:**
- Next.js 16 App Router (API Routes)
- TypeScript (strict mode)
- Supabase (PostgreSQL + Storage)
- AWS Textract (primary OCR) + Google Document AI (fallback)

**UPPGIFT: Implementera API Routes för OCR Processing**

Baserat på research-dokumentet ska du implementera:

### 1. Delivery Note OCR Processing API
**Endpoint:** `POST /api/delivery-notes/process`

**Krav:**
- Acceptera PDF/bild via multipart/form-data
- Upload till Supabase Storage (`documents/delivery-notes/{tenantId}/{timestamp}.pdf`)
- Anropa AWS Textract med FeatureTypes: ['TABLES', 'FORMS']
- Parse Textract response till strukturerad data (DeliveryNoteOCRResult)
- Implementera robust error handling:
  - Retry logic för AWS API failures (3 attempts, exponential backoff)
  - Fallback till Google Document AI om Textract fails
  - Graceful degradation om OCR confidence < 70%
- Validera extraherad data med Zod schemas
- Logga alla processing steps till `ocr_processing_logs` table
- Returnera structured response med confidence scores

**TypeScript Interfaces (från research):**
```typescript
export interface DeliveryNoteOCRResult {
  supplierName: string;
  supplierPhone?: string;
  supplierEmail?: string;
  deliveryDate: string; // YYYY-MM-DD
  referenceNumber: string;
  items: DeliveryItem[];
  projectReference?: string;
  deliveryAddress?: string;
  ocrConfidence: number; // 0-100
  extractedAt: Date;
  rawOCRText: string;
}

export interface DeliveryItem {
  articleNumber: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice?: number;
  totalPrice?: number;
}
```

**Error Handling Requirements:**
- Specific error types: `OCRProcessingError`, `StorageError`, `ValidationError`
- HTTP status codes: 400 (validation), 500 (processing), 503 (service unavailable)
- Error messages på svenska för användare, engelska för logs
- Include error context (file name, tenant ID, processing stage)

### 2. Invoice OCR Processing API
**Endpoint:** `POST /api/supplier-invoices/process`

**Krav:**
- Samma struktur som delivery notes men med invoice-specific fields
- Extract: supplierName, invoiceNumber, invoiceDate, dueDate, amounts, lineItems
- Use Textract QueriesConfig för bättre accuracy:
  ```typescript
  Queries: [
    { Text: 'What is the invoice number?' },
    { Text: 'What is the total amount?' },
    { Text: 'What is the supplier name?' },
    { Text: 'What is the due date?' },
    { Text: 'What is the project reference or order number?' }
  ]
  ```
- Implementera auto-matching mot projekt (använd fuzzy matching från research)
- Returnera match confidence scores

### 3. Form Submission API
**Endpoint:** `POST /api/form-submissions`

**Krav:**
- Acceptera form data baserat på FormTemplate schema
- Validera med Zod schema genererat från template
- Handle conditional logic (show/hide fields)
- Auto-save drafts till `form_submissions` med status='draft'
- PDF generation för completed forms (använd @react-pdf/renderer)
- File uploads för form attachments (signatures, photos)

**Implementation Guidelines:**
1. **Type Safety:** Använd strict TypeScript, inga `any` types
2. **Error Handling:** Try-catch blocks med specific error types
3. **Logging:** Structured logging med correlation IDs
4. **Validation:** Zod schemas för all input validation
5. **Rate Limiting:** Implementera rate limiting per tenant
6. **Idempotency:** Support idempotency keys för retries

**Code Quality:**
- JSDoc comments för alla public functions
- Unit tests för error scenarios
- Integration tests för API endpoints
- Error boundaries för graceful failures

**Börja med delivery notes API och visa mig komplett implementation med alla error cases hanterade.**

---

**Research Dokument:** `frost_tre_funktioner_complete_guide.md`  
**Database Schema:** Se `BACKEND_DEVELOPER_PROMPTS.md` (Claude 4.5 section)

