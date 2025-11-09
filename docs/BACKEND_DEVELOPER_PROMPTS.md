# 🚀 OPTIMERADE BACKEND-PROMPTS FÖR FROST SOLUTIONS
## EDI Orderbekräftelse, OCR Fakturor & Formulärsystem

**Projekt:** Frost Data AB - Advanced Document Processing  
**Stack:** Next.js 16 + TypeScript + Supabase + PostgreSQL  
**Datum:** November 2025

---

## 📋 INNEHÅLLSFÖRTECKNING

1. [GPT-5: API Implementation & Error Handling](#1-gpt-5-api-implementation--error-handling)
2. [Gemini: Integration & Workflow Orchestration](#2-gemini-integration--workflow-orchestration)
3. [Claude 4.5: Database Design & Architecture](#3-claude-45-database-design--architecture)
4. [Deepseek: Algorithms & Performance Optimization](#4-deepseek-algorithms--performance-optimization)
5. [Kimi K2: Testing & Validation](#5-kimi-k2-testing--validation)

---

## 1. GPT-5: API IMPLEMENTATION & ERROR HANDLING

### 🎯 Fokusområde
**Robusta API-implementationer med exceptionell error handling, type safety och production-ready kod.**

### 📝 PROMPT

```
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
```

---

## 2. GEMINI: INTEGRATION & WORKFLOW ORCHESTRATION

### 🎯 Fokusområde
**Integration mellan system, workflow orchestration och Google Cloud services integration.**

### 📝 PROMPT

```
Du är en integration-specialist som implementerar workflow orchestration för Frost Solutions OCR-system.

**TEKNISK STACK:**
- Next.js 16 App Router
- Supabase (PostgreSQL + Storage + Realtime)
- AWS Textract (primary) + Google Document AI (fallback)
- Google Cloud Functions (för async processing)

**UPPGIFT: Implementera Complete Workflow Orchestration**

### Workflow 1: Delivery Note → Material Registration
```
Upload Följesedel
  ↓
OCR Processing (AWS Textract)
  ↓
Extract Items
  ↓
Auto-register in Materials Database
  ↓
Link to Project (if reference found)
  ↓
Update Project Budget
  ↓
Notify User (Supabase Realtime)
```

**Implementera:**
1. **Workflow Orchestrator Function**
   - Coordinate alla steg i workflow
   - Handle failures och retries
   - Track workflow state i `workflow_executions` table
   - Support partial success (some items registered, some failed)

2. **Background Job Queue**
   - Use Supabase Edge Functions eller Google Cloud Tasks
   - Queue OCR processing jobs
   - Retry failed jobs med exponential backoff
   - Dead letter queue för permanent failures

3. **Event-Driven Architecture**
   - Supabase Realtime subscriptions för status updates
   - Webhooks för external integrations
   - Event sourcing för audit trail

### Workflow 2: Invoice → Project Matching
```
Upload Invoice
  ↓
OCR Processing
  ↓
Extract Invoice Data
  ↓
Fuzzy Match to Projects
  ↓
Create Supplier Invoice Record
  ↓
Auto-fill Invoice Acceptance Form
  ↓
Notify Project Manager
```

**Implementera:**
1. **Fuzzy Matching Service**
   - Levenshtein distance för supplier names
   - Date range matching för project periods
   - Confidence scoring system
   - Return top 3 matches med confidence scores

2. **Auto-Fill Form Service**
   - Map OCR data till form fields
   - Handle field mappings från `form_field_mappings` table
   - Pre-fill form med OCR data
   - Allow manual override

### Workflow 3: Form Submission → Approval → PDF
```
Form Submission
  ↓
Validation
  ↓
Save to Database
  ↓
Trigger Approval Workflow (if required)
  ↓
Generate PDF
  ↓
Store PDF in Storage
  ↓
Send Email Notification
```

**Integration Requirements:**
1. **Google Cloud Integration**
   - Use Google Document AI som fallback OCR
   - Google Cloud Storage för archive
   - Google Cloud Functions för async processing

2. **Supabase Integration**
   - Realtime subscriptions för live updates
   - Database triggers för auto-processing
   - Storage buckets för file management

3. **External Integrations**
   - Email notifications (SendGrid/Resend)
   - Webhook endpoints för external systems
   - API rate limiting och throttling

**Implementation Guidelines:**
- Use async/await för all async operations
- Implement circuit breakers för external APIs
- Use message queues för decoupling
- Event-driven architecture med Supabase Realtime
- Comprehensive logging för debugging workflows

**Visa mig komplett workflow orchestration med alla integration points och error handling.**
```

---

## 3. CLAUDE 4.5: DATABASE DESIGN & ARCHITECTURE

### 🎯 Fokusområde
**Database schema design, RLS policies, migrations och arkitektur.**

### 📝 PROMPT

```
Du är en database architect som designar komplett databas-schema för Frost Solutions OCR-system.

**TEKNISK STACK:**
- Supabase PostgreSQL 15+
- Row Level Security (RLS)
- Database Functions & Triggers
- JSONB för flexible data

**UPPGIFT: Design Complete Database Schema**

### 1. Core Tables Design

**delivery_notes**
```sql
CREATE TABLE delivery_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES suppliers(id),
  project_id UUID REFERENCES projects(id),
  
  -- File storage
  file_path TEXT NOT NULL,
  file_size_bytes INTEGER,
  mime_type TEXT,
  
  -- OCR data
  ocr_status TEXT DEFAULT 'pending' CHECK (ocr_status IN ('pending', 'processing', 'completed', 'failed')),
  ocr_provider TEXT CHECK (ocr_provider IN ('aws_textract', 'google_document_ai', 'tesseract')),
  ocr_confidence DECIMAL(5,2), -- 0-100
  ocr_data JSONB, -- Raw OCR response
  extracted_data JSONB, -- Parsed DeliveryNoteOCRResult
  
  -- Metadata
  supplier_name TEXT,
  delivery_date DATE,
  reference_number TEXT,
  project_reference TEXT,
  
  -- Processing
  items_processed INTEGER DEFAULT 0,
  items_created INTEGER DEFAULT 0,
  items_matched INTEGER DEFAULT 0,
  processing_errors JSONB,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id)
);
```

**supplier_invoices**
```sql
CREATE TABLE supplier_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES suppliers(id),
  project_id UUID REFERENCES projects(id), -- Auto-matched
  
  -- File storage
  file_path TEXT NOT NULL,
  
  -- OCR data
  ocr_status TEXT DEFAULT 'pending',
  ocr_confidence DECIMAL(5,2),
  ocr_data JSONB,
  extracted_data JSONB, -- InvoiceOCRResult
  
  -- Invoice details
  invoice_number TEXT,
  supplier_invoice_date DATE,
  supplier_due_date DATE,
  subtotal DECIMAL(10,2),
  tax_rate DECIMAL(5,2),
  tax_amount DECIMAL(10,2),
  total_amount DECIMAL(10,2),
  currency TEXT DEFAULT 'SEK',
  
  -- Matching
  match_confidence DECIMAL(5,2), -- 0-100
  match_reason TEXT,
  requires_manual_review BOOLEAN DEFAULT false,
  
  -- Status
  status TEXT DEFAULT 'pending_approval' CHECK (status IN ('pending_approval', 'approved', 'rejected', 'paid')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id)
);
```

**form_templates**
```sql
CREATE TABLE form_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('safety', 'quality', 'delivery', 'inspection', 'other')),
  
  -- Form schema (JSONB)
  schema JSONB NOT NULL, -- FormTemplate structure
  
  version INTEGER DEFAULT 1,
  is_published BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**form_submissions**
```sql
CREATE TABLE form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id),
  template_id UUID NOT NULL REFERENCES form_templates(id),
  
  -- Form data
  data JSONB NOT NULL, -- Form field values
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
  
  -- Files
  attachments JSONB, -- Array of file URLs
  
  -- Signatures
  signature_data JSONB, -- Signature canvas data
  
  -- PDF
  pdf_path TEXT, -- Generated PDF path
  
  -- Metadata
  submitted_by UUID REFERENCES auth.users(id),
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. Supporting Tables

**ocr_processing_logs** - Audit trail för OCR processing
**workflow_executions** - Track workflow state
**form_field_mappings** - Map OCR fields till form fields

### 3. RLS Policies

**Krav:**
- Multi-tenant isolation (tenant_id check)
- Users kan bara se sina tenants data
- Admins kan se all data för sin tenant
- Service role kan bypass RLS för background jobs

**Exempel:**
```sql
-- Delivery notes RLS
CREATE POLICY "Users can view delivery notes for their tenant"
  ON delivery_notes FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_tenants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert delivery notes for their tenant"
  ON delivery_notes FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM user_tenants 
      WHERE user_id = auth.uid()
    )
  );
```

### 4. Database Functions

**Function: auto_match_invoice_to_project**
- Fuzzy matching logic i PostgreSQL
- Return match confidence scores

**Function: calculate_ocr_confidence**
- Calculate average confidence från OCR blocks

**Function: generate_form_pdf**
- Generate PDF från form submission data

### 5. Triggers

**Trigger: update_materials_on_delivery_note**
- Auto-register materials när delivery note processed

**Trigger: update_project_budget_on_invoice**
- Update project budget när invoice approved

**Trigger: generate_form_pdf_on_submit**
- Auto-generate PDF när form submitted

**Implementation Requirements:**
- Alla tables ska ha proper indexes
- Foreign key constraints med ON DELETE CASCADE/SET NULL
- Check constraints för status fields
- JSONB indexes för querying nested data
- Full-text search indexes för text fields
- Migration scripts med rollback support

**Visa mig komplett schema med alla tables, RLS policies, functions och triggers.**
```

---

## 4. DEEPSEEK: ALGORITHMS & PERFORMANCE OPTIMIZATION

### 🎯 Fokusområde
**Algoritmer för fuzzy matching, performance optimization och efficient data processing.**

### 📝 PROMPT

```
Du är en algorithms specialist som optimerar OCR processing och matching algorithms för Frost Solutions.

**TEKNISK STACK:**
- TypeScript/JavaScript
- PostgreSQL (Supabase)
- AWS Textract
- Performance-critical operations

**UPPGIFT: Implementera Optimized Algorithms**

### 1. Fuzzy Matching Algorithm Optimization

**Current Implementation (från research):**
- Levenshtein distance för string matching
- O(n*m) complexity per comparison
- Sequential matching mot alla projects

**Optimize för:**
- Handle 1000+ projects per tenant
- Sub-second matching times
- High accuracy (>85% confidence)

**Implementera:**

**A. Optimized Levenshtein Distance**
```typescript
// Use dynamic programming med memoization
// Early termination för large differences
// Normalize strings (lowercase, trim, remove special chars)
```

**B. Multi-Stage Matching**
```
Stage 1: Exact match på project_number (O(1) hash lookup)
Stage 2: Fuzzy match på project_number (Levenshtein < 2)
Stage 3: Fuzzy match på project name (Levenshtein < 5)
Stage 4: Date range matching
Stage 5: Supplier history matching
```

**C. Indexed Search**
- Pre-compute normalized project names
- Use PostgreSQL trigram indexes (pg_trgm)
- Full-text search för descriptions

**D. Caching Strategy**
- Cache project list per tenant (5 min TTL)
- Cache match results för same supplier + date range
- Invalidate on project updates

### 2. OCR Response Parsing Optimization

**Current:** Sequential parsing av Textract blocks
**Optimize:** Parallel processing och efficient data structures

**Implementera:**
- Use Map/Set för O(1) lookups
- Batch process blocks
- Early exit för low-confidence blocks
- Memory-efficient streaming för large documents

### 3. Table Extraction Algorithm

**From Research:** Extract table data från Textract blocks
**Optimize:** Handle complex table structures, merged cells, multi-page tables

**Implementera:**
- Graph-based cell relationship detection
- Handle merged cells
- Detect table headers automatically
- Support multi-page tables

### 4. Article Registration Optimization

**Current:** Sequential inserts för each item
**Optimize:** Batch inserts, duplicate detection, transaction optimization

**Implementera:**
- Batch insert med PostgreSQL COPY
- Use UPSERT (ON CONFLICT) för duplicates
- Transaction batching (100 items per transaction)
- Parallel processing för independent items

### 5. Performance Metrics

**Target Metrics:**
- OCR processing: < 5 seconds per document
- Project matching: < 500ms för 1000 projects
- Article registration: < 2 seconds för 50 items
- Form rendering: < 100ms för 20 fields

**Monitoring:**
- Track processing times per stage
- Log slow operations (> 1 second)
- Alert on performance degradation

### 6. Algorithm Improvements

**A. Smart Categorization**
- Use ML-based categorization för articles
- Pre-trained model för Swedish construction materials
- Fallback till rule-based categorization

**B. Confidence Scoring**
- Weighted confidence scores baserat på field importance
- Adjust scores för Swedish language patterns
- Learn från user corrections

**C. Duplicate Detection**
- Hash-based duplicate detection
- Fuzzy duplicate detection (similar articles)
- Handle variations i article numbers

**Implementation Guidelines:**
- Use efficient data structures (Maps, Sets)
- Minimize database queries (batch operations)
- Use indexes effectively
- Profile och optimize hot paths
- Consider Web Workers för heavy computation

**Visa mig optimized algorithms med performance benchmarks och complexity analysis.**
```

---

## 5. KIMI K2: TESTING & VALIDATION

### 🎯 Fokusområde
**Comprehensive testing, validation, edge cases och quality assurance.**

### 📝 PROMPT

```
Du är en QA engineer som implementerar comprehensive testing för Frost Solutions OCR-system.

**TEKNISK STACK:**
- Jest/Vitest för unit tests
- Playwright för E2E tests
- Supertest för API tests
- PostgreSQL test database

**UPPGIFT: Implementera Complete Test Suite**

### 1. Unit Tests för OCR Processing

**Test Cases:**

**A. Delivery Note OCR Extraction**
- ✅ Valid PDF med table data
- ✅ PDF med merged cells
- ✅ PDF med multiple pages
- ✅ Low-quality scanned PDF
- ✅ PDF med Swedish characters (åäö)
- ✅ PDF med missing fields
- ✅ PDF med corrupted data
- ✅ Empty PDF
- ✅ Non-PDF file (should reject)

**B. Invoice OCR Extraction**
- ✅ Standard Swedish invoice format
- ✅ Invoice med multiple line items
- ✅ Invoice med VAT calculations
- ✅ Invoice med project reference
- ✅ Invoice utan project reference
- ✅ Invoice med handwritten notes
- ✅ Invoice med QR code
- ✅ Invoice med multiple currencies

**C. Data Validation**
- ✅ Valid delivery date formats
- ✅ Invalid date formats (should normalize)
- ✅ Swedish phone number formats
- ✅ Organization number validation (10 digits)
- ✅ Amount parsing (SEK format: 1 234,56)
- ✅ Unit parsing (m, m2, st, kg, etc.)

### 2. Integration Tests för APIs

**Test Endpoints:**

**POST /api/delivery-notes/process**
- ✅ Successful processing
- ✅ Invalid file type
- ✅ File too large (> 10MB)
- ✅ Missing tenant_id
- ✅ AWS Textract failure (should fallback)
- ✅ Google Document AI failure (should error gracefully)
- ✅ Low OCR confidence (< 70%)
- ✅ Network timeout
- ✅ Rate limiting

**POST /api/supplier-invoices/process**
- ✅ Successful processing med project match
- ✅ Successful processing utan project match
- ✅ Multiple project matches (should return top 3)
- ✅ Invalid invoice format
- ✅ Missing required fields
- ✅ Amount calculation errors

**POST /api/form-submissions**
- ✅ Valid form submission
- ✅ Invalid form data (missing required fields)
- ✅ Conditional logic (show/hide fields)
- ✅ File uploads
- ✅ Signature validation
- ✅ PDF generation

### 3. E2E Tests för Complete Workflows

**Workflow 1: Delivery Note → Material Registration**
```
1. Upload delivery note PDF
2. Verify OCR processing starts
3. Verify items extracted
4. Verify materials registered
5. Verify project linked (if reference found)
6. Verify notifications sent
```

**Workflow 2: Invoice → Project Matching → Approval**
```
1. Upload invoice PDF
2. Verify OCR processing
3. Verify project matching
4. Verify match confidence scores
5. Verify manual review flag (if low confidence)
6. Approve match
7. Verify invoice created
8. Verify project budget updated
```

**Workflow 3: Form Submission → PDF Generation**
```
1. Fill form med conditional fields
2. Upload attachments
3. Add signature
4. Submit form
5. Verify PDF generated
6. Verify PDF stored in storage
7. Verify email notification sent
```

### 4. Edge Cases & Error Scenarios

**OCR Edge Cases:**
- PDF med password protection
- PDF med embedded images
- PDF med rotated pages
- PDF med watermarks
- PDF med multiple languages
- Very large PDFs (> 50 pages)
- Corrupted PDF files

**Matching Edge Cases:**
- Projects med similar names
- Projects med same supplier
- Projects med overlapping date ranges
- Projects utan end date
- Supplier name variations (AB vs Aktiebolag)
- Missing project references

**Form Edge Cases:**
- Form med 100+ fields
- Form med nested conditional logic
- Form med circular dependencies
- Form submission timeout
- Concurrent form submissions
- Form template changes during submission

### 5. Performance Tests

**Load Tests:**
- 100 concurrent OCR processing requests
- 1000 projects för matching algorithm
- 50 items för batch registration
- Large form submissions (100 fields)

**Stress Tests:**
- API rate limiting
- Database connection pooling
- File storage limits
- Memory usage under load

### 6. Security Tests

**Test Cases:**
- SQL injection i form fields
- XSS i OCR extracted data
- File upload vulnerabilities
- RLS policy bypass attempts
- Unauthorized tenant access
- File path traversal

### 7. Data Validation Tests

**Swedish-Specific Validation:**
- Personnummer format (YYYYMMDD-XXXX)
- Organization number (10 digits)
- Phone numbers (+46 format)
- Date formats (YYYY-MM-DD, DD/MM/YYYY)
- Amount formats (1 234,56 SEK)
- Address formats (Swedish addresses)

### 8. Test Data & Fixtures

**Create Test Fixtures:**
- Sample delivery note PDFs (various formats)
- Sample invoice PDFs (various formats)
- Sample form templates
- Test projects med known data
- Test suppliers med known data

**Mock Services:**
- Mock AWS Textract responses
- Mock Google Document AI responses
- Mock Supabase Storage
- Mock email service

### 9. Test Coverage Goals

**Target Coverage:**
- Unit tests: > 90%
- Integration tests: > 80%
- E2E tests: Critical paths only
- Error scenarios: 100%

### 10. Continuous Testing

**CI/CD Integration:**
- Run tests on every PR
- Run performance tests nightly
- Run security tests weekly
- Generate coverage reports

**Implementation Guidelines:**
- Use descriptive test names
- Test one thing per test
- Use test fixtures för consistency
- Mock external services
- Test error cases thoroughly
- Document test scenarios

**Visa mig komplett test suite med alla test cases, fixtures och mocks.**
```

---

## 📊 SAMMANFATTNING

### Uppdelning av Arbete:

| Modell | Ansvar | Fokus |
|--------|--------|-------|
| **GPT-5** | API Routes | Error handling, type safety, production-ready |
| **Gemini** | Workflows | Integration, orchestration, Google Cloud |
| **Claude 4.5** | Database | Schema design, RLS, migrations, architecture |
| **Deepseek** | Algorithms | Performance, optimization, efficient processing |
| **Kimi K2** | Testing | Comprehensive tests, validation, edge cases |

### Nästa Steg:

1. Varje utvecklare får sin specifika prompt
2. Implementera enligt prompt
3. Code review och integration
4. Testing med Kimi K2's test suite
5. Production deployment

---

**Status:** ✅ Prompts klara för distribution till backend-utvecklare

