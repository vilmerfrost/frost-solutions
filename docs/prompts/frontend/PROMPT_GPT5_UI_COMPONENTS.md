# 🎨 GPT-5: UI COMPONENTS & FORMS

**Frost Solutions - OCR Document Processing Frontend**  
**Developer:** Frontend Team - Component Specialist  
**Date:** November 2025

---

Du är en senior frontend-utvecklare som implementerar UI-komponenter för Frost Solutions OCR-system.

**TEKNISK STACK:**
- Next.js 16 App Router
- React 19
- TypeScript (strict mode)
- Tailwind CSS
- React Hook Form + Zod
- shadcn/ui components

**UPPGIFT: Implementera UI Components för OCR Processing**

### 1. File Upload Component

**Component:** `app/components/ocr/FileUpload.tsx`

**Krav:**
- Drag-and-drop support
- File type validation (PDF, JPEG, PNG)
- File size validation (max 10MB)
- Preview för uploaded files
- Progress indicator under upload
- Error handling med user-friendly messages
- Support för både delivery notes och invoices

**Features:**
- Visual feedback när fil dras över drop zone
- File preview med thumbnail
- Remove file button
- Loading state under processing
- Success/error states

**API Integration:**
- Använd `POST /api/delivery-notes/process` eller `/api/supplier-invoices/process`
- Handle multipart/form-data
- Support idempotency key (header)
- Display OCR confidence score
- Show extracted data preview

### 2. OCR Results Display

**Component:** `app/components/ocr/OCRResults.tsx`

**Krav:**
- Display extracted data från OCR
- Editable fields för manual correction
- Confidence score indicator
- Warning för low confidence (< 70%)
- Show extracted items/line items
- Project match display (för invoices)

**Features:**
- Collapsible sections
- Inline editing
- Save corrections button
- Visual confidence indicator (color-coded)
- Expandable raw OCR text

### 3. Delivery Note Form

**Component:** `app/components/ocr/DeliveryNoteForm.tsx`

**Krav:**
- Form för manual entry eller correction
- Fields: supplier, date, reference, items
- Dynamic items list (add/remove items)
- Project reference selector
- Validation med Zod
- Auto-save draft

**Fields:**
- Supplier name (autocomplete från suppliers)
- Delivery date (date picker)
- Reference number
- Project reference (select från projects)
- Items table (article number, description, quantity, unit, price)
- Delivery address

### 4. Invoice Review Form

**Component:** `app/components/ocr/InvoiceReviewForm.tsx`

**Krav:**
- Form för invoice review och approval
- Display project matches med confidence scores
- Allow manual project selection
- Line items editor
- Amount calculations (subtotal, VAT, total)
- Approval workflow

**Features:**
- Project match cards med confidence %
- Manual override för project
- Line items table med editing
- Amount summary
- Approve/Reject buttons
- Comments field

### 5. Progress Indicator

**Component:** `app/components/ocr/OCRProgress.tsx`

**Krav:**
- Show OCR processing stages
- Real-time updates (via Supabase Realtime)
- Stage indicators: Upload → OCR → Parsing → Matching → Complete
- Error states
- Estimated time remaining

**Stages:**
1. File uploaded
2. OCR processing (Textract/DocAI)
3. Data extraction
4. Validation
5. Project matching (för invoices)
6. Complete

### 6. Material Registration Component

**Component:** `app/components/ocr/MaterialRegistration.tsx`

**Krav:**
- Display extracted materials från delivery note
- Batch registration
- Duplicate detection
- Category assignment
- Link to projects
- Success/error feedback per item

**Features:**
- Checkbox selection för items
- Bulk actions
- Category dropdown
- Project selector
- Registration status per item

**Implementation Guidelines:**
1. **Type Safety:** Strict TypeScript, no `any` types
2. **Error Handling:** User-friendly error messages på svenska
3. **Validation:** Zod schemas för all form validation
4. **Accessibility:** ARIA labels, keyboard navigation
5. **Responsive:** Mobile-first design
6. **Loading States:** Skeleton loaders, spinners
7. **Error States:** Clear error messages med retry options

**Code Quality:**
- JSDoc comments för alla components
- PropTypes eller TypeScript interfaces
- Unit tests för components
- Storybook stories (optional)

**Börja med FileUpload component och visa mig komplett implementation med alla states hanterade.**

---

**Backend API:** Se `BACKEND_DEVELOPER_PROMPTS.md`  
**Design System:** Se Claude prompt för design guidelines

