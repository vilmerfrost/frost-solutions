# 🗄️ CLAUDE 4.5: DATABASE DESIGN & ARCHITECTURE

**Frost Solutions - OCR Document Processing System**  
**Developer:** Backend Team - Database Architect  
**Date:** November 2025

---

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

---

**Research Dokument:** `frost_tre_funktioner_complete_guide.md`  
**Workflow Integration:** Se `BACKEND_DEVELOPER_PROMPTS.md` (Gemini section)

