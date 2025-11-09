# 🔄 GEMINI: INTEGRATION & WORKFLOW ORCHESTRATION

**Frost Solutions - OCR Document Processing System**  
**Developer:** Backend Team - Integration Specialist  
**Date:** November 2025

---

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

---

**Research Dokument:** `frost_tre_funktioner_complete_guide.md`  
**API Endpoints:** Se `BACKEND_DEVELOPER_PROMPTS.md` (GPT-5 section)

