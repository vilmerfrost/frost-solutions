# 🚀 Implementeringsplan: Prioritet 2 Funktioner

## Översikt
Implementera tre funktioner från BYGGLET_COMPARISON.md:
1. **EDI Orderbekräftelse** - OCR för följesedlar + Auto-artikelregistrering
2. **Skanning** - OCR för fakturor + Auto-matchning mot projekt  
3. **Förbättra Formulär** - Fler mallar + Bättre UI

---

## 1. EDI Orderbekräftelse (2-3 dagar)

### Funktioner:
- ✅ Upload följesedel (PDF/bild)
- ✅ OCR-processing av följesedel
- ✅ Extrahera artiklar (artikelnummer, kvantitet, pris, leverantör)
- ✅ Auto-registrera artiklar i materialdatabas
- ✅ Validering och granskning av OCR-resultat
- ✅ UI för att granska och korrigera extraherad data

### Teknisk stack (tentativ):
- **OCR API:** Google Vision API / AWS Textract / Azure Form Recognizer
- **File Storage:** Supabase Storage
- **Processing:** Next.js API routes + Background jobs
- **Database:** Supabase (materials table)

### Databas-schema (tentativ):
```sql
-- Ny tabell för följesedlar
CREATE TABLE delivery_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id),
  file_url TEXT NOT NULL,
  supplier_name TEXT,
  delivery_date DATE,
  ocr_status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  ocr_data JSONB, -- Raw OCR result
  extracted_items JSONB, -- Parsed items
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Utöka materials table med leverantörsinfo
ALTER TABLE materials ADD COLUMN supplier_name TEXT;
ALTER TABLE materials ADD COLUMN delivery_note_id UUID REFERENCES delivery_notes(id);
```

### API Endpoints:
- `POST /api/delivery-notes/upload` - Upload följesedel
- `POST /api/delivery-notes/[id]/process` - Start OCR processing
- `GET /api/delivery-notes/[id]/status` - Check OCR status
- `POST /api/delivery-notes/[id]/register-items` - Register extracted items

---

## 2. OCR för Fakturor (2-3 dagar)

### Funktioner:
- ✅ Upload leverantörsfaktura (PDF/bild)
- ✅ OCR-processing av faktura
- ✅ Extrahera faktura-data (leverantör, belopp, datum, OCR-nummer, projektreferens)
- ✅ Auto-matcha mot projekt (fuzzy matching)
- ✅ Skapa fakturapost med projektkoppling
- ✅ UI för att granska och korrigera matchningar

### Teknisk stack (tentativ):
- **OCR API:** Google Document AI / AWS Textract / Azure Form Recognizer
- **File Storage:** Supabase Storage
- **Processing:** Next.js API routes + Background jobs
- **Matching:** Fuzzy string matching (t.ex. `fuse.js`)

### Databas-schema (tentativ):
```sql
-- Ny tabell för leverantörsfakturor
CREATE TABLE supplier_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id),
  project_id UUID REFERENCES projects(id),
  file_url TEXT NOT NULL,
  supplier_name TEXT,
  amount DECIMAL(10,2),
  invoice_date DATE,
  ocr_number TEXT, -- OCR-nummer från fakturan
  ocr_status TEXT DEFAULT 'pending',
  ocr_data JSONB,
  match_confidence DECIMAL(3,2), -- 0.00 - 1.00
  status TEXT DEFAULT 'pending', -- pending, approved, paid
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### API Endpoints:
- `POST /api/supplier-invoices/upload` - Upload faktura
- `POST /api/supplier-invoices/[id]/process` - Start OCR + matching
- `GET /api/supplier-invoices/[id]/matches` - Get project matches
- `POST /api/supplier-invoices/[id]/approve` - Approve match and create invoice

---

## 3. Förbättra Formulärsystem (1-2 dagar)

### Funktioner:
- ✅ Formulärbyggare med drag-and-drop
- ✅ Formulärmallar (säkerhetskontroll, kvalitetskontroll, leveransbekräftelse)
- ✅ Conditional logic (visa/dölj fält)
- ✅ Bättre UI/UX (progress indicators, auto-save)
- ✅ Validering (client + server)
- ✅ Export till PDF

### Teknisk stack (tentativ):
- **Form Library:** React Hook Form + Zod (validering)
- **Form Builder:** Custom eller React Form Builder
- **UI Components:** Shadcn/ui (befintligt)
- **PDF Export:** @react-pdf/renderer (befintligt)

### Databas-schema (tentativ):
```sql
-- Formulärmallar
CREATE TABLE form_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id),
  name TEXT NOT NULL,
  category TEXT, -- safety, quality, delivery, etc.
  schema JSONB NOT NULL, -- Form schema definition
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ifyllda formulär
CREATE TABLE form_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id),
  project_id UUID REFERENCES projects(id),
  template_id UUID REFERENCES form_templates(id),
  data JSONB NOT NULL, -- Form data
  submitted_by UUID REFERENCES users(id),
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);
```

### API Endpoints:
- `GET /api/form-templates` - List templates
- `POST /api/form-templates` - Create template
- `POST /api/form-submissions` - Submit form
- `GET /api/form-submissions/[id]/pdf` - Export to PDF

---

## Implementation Order

### Dag 1-2: EDI Orderbekräftelse
1. Setup OCR API (Google Vision/AWS Textract)
2. Create delivery_notes table
3. Implement file upload
4. Implement OCR processing
5. Create UI for review

### Dag 3-4: OCR Fakturor
1. Setup OCR API (samma som ovan)
2. Create supplier_invoices table
3. Implement fuzzy matching logic
4. Create UI for review and matching

### Dag 5-6: Formulärförbättringar
1. Setup form templates system
2. Create form builder UI
3. Add conditional logic
4. Improve UX (progress, auto-save)
5. Add PDF export

---

## Nästa steg

1. ✅ Research med Perplexity (använd `RESEARCH_PROMPT_PRIORITY2_FEATURES.md`)
2. ⏳ Välj OCR API baserat på research
3. ⏳ Design databasschema
4. ⏳ Implementera funktionerna enligt plan ovan

---

## Checklista

### EDI Orderbekräftelse:
- [ ] Research OCR API:er
- [ ] Design databasschema
- [ ] Implementera file upload
- [ ] Implementera OCR processing
- [ ] Implementera artikelregistrering
- [ ] Skapa UI för granskning

### OCR Fakturor:
- [ ] Research OCR API:er
- [ ] Design databasschema
- [ ] Implementera file upload
- [ ] Implementera OCR processing
- [ ] Implementera fuzzy matching
- [ ] Skapa UI för granskning och matchning

### Formulärförbättringar:
- [ ] Research form builder libraries
- [ ] Design databasschema
- [ ] Implementera form templates
- [ ] Skapa form builder UI
- [ ] Lägg till conditional logic
- [ ] Förbättra UX
- [ ] Lägg till PDF export

---

**Status:** ⏳ Väntar på research från Perplexity

