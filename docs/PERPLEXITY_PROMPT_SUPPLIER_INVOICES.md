# Perplexity Pro Research Prompt: Leverantörsfakturor System

## Kontext
Jag bygger ett byggföretagsmanagement-system (Frost Solutions) som konkurrerar med Bygglet. Jag behöver implementera ett komplett leverantörsfakturor-system där:
- Leverantörsfakturor kopplas till projekt
- Auto-påslag läggs på när man fakturerar kunden
- Systemet hanterar inköp och kostnader per projekt
- Användare kan skanna/ladda upp fakturor
- Systemet spårar betalningar och status

## Tech Stack
- **Backend:** Next.js 16 App Router (API Routes)
- **Database:** Supabase (PostgreSQL) med Row Level Security
- **Storage:** Supabase Storage (för faktura-PDFs/bilder)
- **Frontend:** React, TypeScript, Tailwind CSS
- **State Management:** React Query (@tanstack/react-query)
- **Multi-tenant:** Tenant isolation via `tenant_id`

## Research Areas

### 1. Database Schema Design
**Frågor:**
- Vilka fält behöver en `supplier_invoices` tabell i en byggföretags-kontext?
- Hur ska man strukturera relationen mellan leverantörsfakturor, projekt, och kundfakturor?
- Best practices för att hantera faktura-status (pending, paid, overdue, disputed)?
- Hur hanterar man fakturor med flera projekt (delad kostnad)?
- Vad är bästa praxis för att spara faktura-bilagor (PDFs, bilder)?
- Hur ska man strukturera fakturarader/line items för leverantörsfakturor?
- Best practices för att hantera moms/VAT på leverantörsfakturor?
- Hur ska man hantera fakturor i olika valutor?

**Specifika frågor:**
- Ska man ha en separat `supplier_invoice_items` tabell eller JSONB?
- Hur hanterar man fakturor som delas mellan flera projekt (proportionellt)?
- Best practices för fakturanummer-generering från leverantörer?

### 2. Business Logic & Workflow
**Frågor:**
- Hur fungerar "auto-påslag" vid fakturering i byggbranschen?
  - Vanliga påslagsprocent?
  - Olika påslag för material vs arbete?
  - Hur hanterar man påslag på fakturor med moms?
- Best practices för att matcha leverantörsfakturor mot projekt:
  - Automatisk matchning baserat på projektnummer?
  - Manuell koppling?
  - OCR för att extrahera projektnummer från faktura?
- Hur hanterar man fakturor som inte är kopplade till projekt (överhead)?
- Workflow för godkännande av leverantörsfakturor:
  - Behöver fakturor godkännas innan de kopplas till projekt?
  - Rollbaserad godkännande (admin, projektledare)?
- Hur hanterar man fakturor som är delvis betalda?
- Best practices för att hantera krediter/kreditfakturor från leverantörer?

### 3. OCR & Scanning Integration
**Frågor:**
- Vilka OCR-bibliotek/tjänster är bäst för att läsa fakturor?
  - Tesseract.js vs Google Vision API vs AWS Textract?
  - Kostnad vs kvalitet?
  - Svenska fakturor specifikt?
- Vad är bästa praxis för att extrahera data från fakturor:
  - Fakturanummer
  - Datum
  - Belopp
  - Leverantörsnamn
  - Projektnummer/referens
- Hur hanterar man fakturor med olika format (PDF, bilder)?
- Best practices för att validera OCR-resultat:
  - Manuell granskning?
  - Confidence scores?
  - Machine learning för förbättring?

### 4. API Design & Integration
**Frågor:**
- Best practices för REST API design för leverantörsfakturor:
  - Endpoints för CRUD operations?
  - Bulk upload av fakturor?
  - Sök och filter (leverantör, projekt, status, datum)?
- Hur ska man hantera filuppladdning:
  - Multipart/form-data?
  - Supabase Storage direkt?
  - Progress tracking för stora filer?
- Best practices för att hantera faktura-bilagor:
  - Thumbnail generation?
  - PDF preview?
  - Download endpoints?
- Hur ska man strukturera API-responses:
  - Nested data (faktura med items)?
  - Separate endpoints för items?
  - Pagination för stora listor?

### 5. UI/UX Patterns
**Frågor:**
- Best practices för UI för leverantörsfakturor:
  - Lista vs karta-vy?
  - Filter och sök?
  - Bulk operations (markera flera fakturor)?
- Hur ska man visa faktura-status visuellt:
  - Badges?
  - Färgkodning?
  - Progress indicators?
- Best practices för faktura-uppladdning:
  - Drag & drop?
  - File picker?
  - Mobile camera integration?
- Hur ska man visa faktura-bilagor:
  - Thumbnail grid?
  - Lightbox/modal?
  - PDF viewer inline?
- UI patterns för att koppla fakturor till projekt:
  - Dropdown?
  - Search/autocomplete?
  - Drag & drop?

### 6. Security & Compliance
**Frågor:**
- Best practices för att säkra faktura-bilagor:
  - Encryption at rest?
  - Access control per tenant?
  - Audit logging?
- GDPR considerations för faktura-data:
  - Hur länge ska fakturor sparas?
  - Rätt att radera?
  - Data export?
- Best practices för att hantera känslig data i fakturor:
  - Bankkontonummer?
  - Personnummer?
  - Kryptering?

### 7. Integration med Befintliga System
**Frågor:**
- Hur ska leverantörsfakturor integrera med projektbudget:
  - Auto-uppdatera projektkostnader?
  - Budgetvarningar när kostnader överskrider budget?
- Hur ska fakturor kopplas till kundfakturering:
  - Auto-påslag vid fakturering?
  - Visa kostnader vs intäkter?
  - Margin-beräkning?
- Best practices för att synka med externa system:
  - Fortnox/Visma integration?
  - Bank integration för betalningar?
  - EDI för automatisk import?

### 8. Performance & Scalability
**Frågor:**
- Best practices för att hantera stora mängder fakturor:
  - Pagination?
  - Virtual scrolling?
  - Lazy loading av bilagor?
- Hur optimerar man sökningar på fakturor:
  - Full-text search?
  - Indexering?
  - Elasticsearch/Supabase full-text search?
- Best practices för att hantera stora filer:
  - Chunked upload?
  - Compression?
  - CDN för bilagor?

## Önskat Output Format

För varje research area, ge mig:
1. **Sammanfattning** av best practices
2. **Rekommenderad approach** med motivation
3. **Konkreta exempel** (kod, SQL, API-design)
4. **Bibliotek/tools** att använda
5. **Pitfalls att undvika**
6. **Alternativa lösningar** och trade-offs

## Specifika Tekniska Frågor

1. **Database Schema:**
   - Ska jag använda JSONB för fakturarader eller separata tabell?
   - Hur ska jag hantera fakturor som delas mellan projekt?
   - Ska jag ha en `suppliers` tabell eller bara text-fält?

2. **OCR Integration:**
   - Vilket OCR-bibliotek rekommenderas för svenska fakturor?
   - Hur hanterar jag olika faktura-format?
   - Ska jag använda cloud-tjänst eller lokal processing?

3. **File Storage:**
   - Ska faktura-bilagor sparas i Supabase Storage eller extern tjänst?
   - Hur hanterar jag versioning om fakturan uppdateras?
   - Best practices för thumbnail generation?

4. **Auto-påslag Logic:**
   - Hur beräknar jag påslag korrekt med moms?
   - Ska påslag vara konfigurerbart per projekt eller globalt?
   - Hur hanterar jag olika påslag för olika typer av kostnader?

5. **API Design:**
   - Ska jag ha separata endpoints för fakturor och faktura-items?
   - Hur hanterar jag bulk operations?
   - Best practices för error handling och validation?

## Ytterligare Kontext

- Systemet är multi-tenant (varje företag har sin egen data)
- Vi använder Row Level Security (RLS) i Supabase
- Vi har redan projekt, fakturor, och materialdatabas implementerat
- Systemet ska fungera offline (PWA)
- Vi vill ha premium UI/UX med dark mode support

## Prioritering

**Högsta prioritet:**
- Database schema design
- Business logic för auto-påslag
- API design
- Basic OCR integration

**Medel prioritet:**
- Advanced OCR features
- Bulk operations
- Advanced filtering

**Låg prioritet:**
- External integrations
- Advanced analytics

---

**Ge mig en omfattande research-rapport som täcker alla dessa områden med konkreta rekommendationer och exempel!** 🚀

