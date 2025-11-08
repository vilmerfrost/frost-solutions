# ChatGPT/GPT-5 Backend Prompt: Dag 6-7 KMA/Offert Implementation

## 🎯 UPPGIFT: Implementera komplett Quote/KMA Backend System

Du är senior backend-utvecklare för Frost Solutions. Baserat på omfattande research från Perplexity Pro har vi fått en komplett guide för Quote/KMA-system. Din uppgift är att implementera backend-delen av detta system i Next.js 16 + Supabase.

---

## 📋 RESEARCH-BASERAD GUIDE (Från Perplexity)

Jag har fått en komplett guide som innehåller:
- ✅ Production-ready database schema (quotes, quote_items, quote_templates, quote_approvals, quote_history, materials, pricing_rules)
- ✅ PDF generation med react-pdf
- ✅ Workflow & status management
- ✅ Multi-level approval system
- ✅ Pricing engine med dynamiska rabatter
- ✅ Email integration med tracking
- ✅ Quote → Project conversion

**Guide-filen:** `frost_quote_kma_guide.md` (komplett med SQL, TypeScript, och implementation details)

---

## 🏗️ TEKNISK STACK

- **Framework:** Next.js 16 (App Router)
- **Backend:** Supabase (PostgreSQL) + Row Level Security
- **API Routes:** Next.js API Routes (`/app/api/quotes/*`)
- **PDF:** @react-pdf/renderer (server-side)
- **Email:** Resend eller nodemailer
- **Auth:** Supabase Auth med service role för admin operations
- **TypeScript:** Strikt typning överallt

---

## 📦 IMPLEMENTATION PLAN - BACKEND FOKUS

### FASE 1: Database Schema & Migrations (Dag 1)

**Uppgift:** Skapa alla tabeller enligt guiden med RLS policies

**Filer att skapa:**
1. `sql/migrations/20250108_create_quotes_system.sql`
   - Alla tabeller från guiden (quotes, quote_items, quote_templates, quote_approvals, quote_history, materials, pricing_rules)
   - Indexes för performance
   - RLS policies för alla tabeller
   - Foreign key constraints
   - Check constraints för status values

**Krav:**
- ✅ Använd exakt schema från guiden
- ✅ RLS policies måste använda `user_roles` tabellen för tenant isolation
- ✅ Alla foreign keys med korrekt ON DELETE behavior
- ✅ Generated columns för beräkningar (subtotal, discount_amount, net_price)

**SQL Exempel från guide:**
```sql
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  quote_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' 
    CHECK (status IN ('draft', 'pending_approval', 'approved', 'sent', 'viewed', 'accepted', 'rejected', 'expired', 'archived')),
  -- ... (se guide för komplett schema)
);
```

---

### FASE 2: API Routes - CRUD Operations (Dag 2)

**Uppgift:** Skapa alla API routes för quote management

**Routes att implementera:**

1. **`/app/api/quotes/route.ts`**
   - `GET` - Lista alla offerter (med filtering, pagination, sorting)
   - `POST` - Skapa ny offert (med validation, auto-generera quote_number)
   - Query params: `?status=draft&customer_id=xxx&page=1&limit=20`

2. **`/app/api/quotes/[id]/route.ts`**
   - `GET` - Hämta specifik offert med items
   - `PUT` - Uppdatera offert (med status transition validation)
   - `DELETE` - Ta bort offert (soft delete eller hard delete?)

3. **`/app/api/quotes/[id]/items/route.ts`**
   - `GET` - Hämta alla items för en offert
   - `POST` - Lägg till nytt item
   - `PUT` - Uppdatera item
   - `DELETE` - Ta bort item

4. **`/app/api/quotes/[id]/pdf/route.ts`**
   - `GET` - Generera och returnera PDF (se guide för react-pdf implementation)
   - Headers: `Content-Type: application/pdf`, `Content-Disposition: attachment`

5. **`/app/api/quotes/[id]/send/route.ts`**
   - `POST` - Skicka offert via email (använd email service från guide)
   - Uppdatera status till 'sent'
   - Logga i quote_history

6. **`/app/api/quotes/[id]/approve/route.ts`**
   - `POST` - Godkänn offert (hantera multi-level approvals från guide)
   - Validera att användaren har rätt att godkänna
   - Uppdatera quote_approvals tabellen

7. **`/app/api/quotes/[id]/convert/route.ts`**
   - `POST` - Konvertera accepterad offert till projekt (se guide för implementation)
   - Skapa projekt från offert-data
   - Skapa tasks från quote_items
   - Uppdatera quote status till 'archived'

8. **`/app/api/quotes/[id]/duplicate/route.ts`**
   - `POST` - Duplicera offert (skapa ny version)
   - Kopiera quote + items
   - Öka version_number

**Krav för alla routes:**
- ✅ Använd `createAdminClient()` för admin operations (bypass RLS)
- ✅ Validera tenant_id från JWT claim (använd `getTenantId()`)
- ✅ Error handling med `extractErrorMessage()`
- ✅ Returnera korrekt HTTP status codes
- ✅ Logga alla ändringar i quote_history

**Exempel struktur:**
```typescript
// app/api/quotes/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getTenantId } from '@/lib/serverTenant'

export async function GET(req: NextRequest) {
  try {
    const tenantId = await getTenantId()
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const customerId = searchParams.get('customer_id')
    
    let query = admin
      .from('quotes')
      .select('*, quote_items(*), customers(name)')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (status) query = query.eq('status', status)
    if (customerId) query = query.eq('customer_id', customerId)

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ quotes: data })
  } catch (error: any) {
    return NextResponse.json(
      { error: extractErrorMessage(error) },
      { status: 500 }
    )
  }
}
```

---

### FASE 3: Pricing Engine & Calculations (Dag 3)

**Uppgift:** Implementera dynamisk pricing engine enligt guide

**Filer att skapa:**

1. **`/app/lib/pricing/calculateQuoteTotal.ts`**
   - Implementera `calculateQuoteTotal()` från guide
   - Applicera pricing_rules (rabatter, markups)
   - Beräkna moms (25% standard för Sverige)
   - Returnera: `{ subtotal, discount, tax, total }`

2. **`/app/lib/pricing/applyPricingRules.ts`**
   - Hämta aktiva pricing_rules från databasen
   - Applicera rules baserat på conditions (project_type, quantity_tier, customer_segment)
   - Returnera total discount/markup amount

3. **`/app/lib/pricing/generateQuoteNumber.ts`**
   - Generera unikt offertnummer: `OF-2025-001`
   - Format: `OF-{YYYY}-{NNN}`
   - Kontrollera att numret är unikt för tenant

**Krav:**
- ✅ Använd generated columns i databasen där möjligt
- ✅ Cacha pricing_rules för performance
- ✅ Validera att totals matchar summan av items

**Exempel från guide:**
```typescript
export async function calculateQuoteTotal(
  context: PricingContext,
  supabase: SupabaseClient
): Promise<{
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
}> {
  // 1. Calculate subtotal
  let subtotal = context.items.reduce(
    (sum, item) => sum + (item.unit_price * item.quantity),
    0
  );

  // 2. Apply pricing rules
  // ... (se guide för komplett implementation)

  // 3. Calculate tax (25% Swedish VAT)
  const netAmount = subtotal - discountAmount;
  const taxRate = 0.25;
  const taxAmount = netAmount * taxRate;

  return {
    subtotal,
    discount: discountAmount,
    tax: taxAmount,
    total: netAmount + taxAmount
  };
}
```

---

### FASE 4: Workflow & Status Management (Dag 4)

**Uppgift:** Implementera quote workflow enligt guide

**Filer att skapa:**

1. **`/app/lib/quotes/workflow.ts`**
   - Implementera `QuoteWorkflow` från guide
   - `canTransitionTo()` - Validera status transitions
   - `handleStatusChange()` - Hantera status ändringar med side effects
   - Status flow: draft → pending_approval → approved → sent → viewed → accepted/rejected

2. **`/app/lib/quotes/approval.ts`**
   - `setupApprovalWorkflow()` - Skapa approval chain
   - `approveQuote()` - Hantera approval
   - `checkAllApprovalsComplete()` - Kolla om alla approvals är klara

3. **`/app/lib/quotes/history.ts`**
   - `logQuoteChange()` - Logga alla ändringar i quote_history
   - Track: created, updated, status_changed, sent, viewed, etc.

**Krav:**
- ✅ Följ exakt status flow från guide
- ✅ Validera transitions innan uppdatering
- ✅ Logga allt i quote_history för audit trail
- ✅ Hantera side effects (email vid 'sent', projekt-creation vid 'accepted')

---

### FASE 5: PDF Generation (Dag 5)

**Uppgift:** Implementera PDF generation med react-pdf

**Filer att skapa:**

1. **`/app/lib/pdf/quote-template.tsx`**
   - Kopiera exakt `QuotePDF` komponent från guide
   - Använd @react-pdf/renderer
   - Inkludera: Header, Customer info, Items table, Totals, Terms, KMA section

2. **`/app/lib/pdf/generateQuotePDF.ts`**
   - `generateQuotePDF()` funktion från guide
   - Returnera PDF blob
   - Hantera errors gracefully

3. **`/app/api/quotes/[id]/pdf/route.ts`**
   - Implementera GET route från guide
   - Hämta quote + items från databas
   - Generera PDF
   - Returnera med korrekta headers

**Krav:**
- ✅ Använd exakt template från guide
- ✅ Formatera valuta korrekt (SEK)
- ✅ Formatera datum (svenska format)
- ✅ Inkludera KMA section om kma_enabled = true

---

### FASE 6: Email Integration (Dag 6)

**Uppgift:** Implementera email sending och tracking

**Filer att skapa:**

1. **`/app/lib/email/sendQuoteEmail.ts`**
   - Implementera `sendQuoteEmail()` från guide
   - Använd Resend eller nodemailer
   - Bifoga PDF som attachment
   - Inkludera tracking pixel URL

2. **`/app/lib/email/quote-email-template.tsx`**
   - Skapa email template (använd react-email eller HTML)
   - Inkludera: Quote summary, View link, Tracking pixel

3. **`/app/api/quotes/[id]/send/route.ts`**
   - POST route för att skicka offert
   - Validera att offert är 'approved'
   - Skicka email
   - Uppdatera status till 'sent'
   - Logga i quote_history

4. **`/app/api/emails/track/route.ts`**
   - GET route för email open tracking
   - Uppdatera `opened_at` i quotes tabellen
   - Returnera 1x1 transparent GIF pixel

**Krav:**
- ✅ Använd Resend API (eller SMTP)
- ✅ Tracking pixel för email opens
- ✅ Logga email_sent_count
- ✅ Hantera email errors gracefully

---

### FASE 7: Quote → Project Conversion (Dag 7)

**Uppgift:** Implementera conversion från offert till projekt

**Filer att skapa:**

1. **`/app/lib/quotes/convertToProject.ts`**
   - Implementera `convertQuoteToProject()` från guide
   - Skapa projekt från quote data
   - Skapa tasks från quote_items
   - Uppdatera quote status till 'archived'
   - Sätt conversion_type och converted_to_id

2. **`/app/api/quotes/[id]/convert/route.ts`**
   - POST route för conversion
   - Validera att quote status är 'accepted'
   - Anropa convertToProject()
   - Returnera project ID

**Krav:**
- ✅ Validera att offert är accepterad innan conversion
- ✅ Kopiera alla relevanta fält från quote till project
- ✅ Skapa tasks från quote_items
- ✅ Uppdatera quote med conversion info

---

## 🔒 SÄKERHET & VALIDATION

### RLS Policies (från guide)
- ✅ Alla tabeller måste ha RLS enabled
- ✅ Policies använder `user_roles` för tenant isolation
- ✅ Users kan bara se/ändra quotes från sin tenant
- ✅ Approval policies: Endast approvers kan godkänna

### Validation
- ✅ Validera quote_number format (OF-YYYY-NNN)
- ✅ Validera status transitions
- ✅ Validera att totals matchar items
- ✅ Validera expiration date (valid_until > created_at)
- ✅ Validera att customer_id finns och tillhör tenant

---

## 📊 DATABASE FUNCTIONS & TRIGGERS

**Skapa dessa funktioner:**

1. **Auto-generera quote_number**
```sql
CREATE OR REPLACE FUNCTION generate_quote_number(tenant_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  year_str TEXT;
  next_num INTEGER;
BEGIN
  year_str := TO_CHAR(CURRENT_DATE, 'YYYY');
  SELECT COALESCE(MAX(CAST(SUBSTRING(quote_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
  INTO next_num
  FROM quotes
  WHERE tenant_id = tenant_uuid
    AND quote_number LIKE 'OF-' || year_str || '-%';
  
  RETURN 'OF-' || year_str || '-' || LPAD(next_num::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;
```

2. **Auto-uppdatera updated_at**
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

3. **Auto-expire quotes**
```sql
CREATE OR REPLACE FUNCTION expire_old_quotes()
RETURNS void AS $$
BEGIN
  UPDATE quotes
  SET status = 'expired'
  WHERE status IN ('sent', 'viewed')
    AND valid_until < CURRENT_DATE
    AND status != 'expired';
END;
$$ LANGUAGE plpgsql;
```

---

## 🧪 TESTING REQUIREMENTS

**Skapa test cases för:**

1. **Quote CRUD**
   - Skapa offert med items
   - Uppdatera offert
   - Ta bort offert
   - Lista offerter med filters

2. **Status Transitions**
   - Testa alla valid transitions
   - Testa invalid transitions (ska faila)
   - Testa approval workflow

3. **Pricing Engine**
   - Testa med rabatter
   - Testa med pricing rules
   - Testa moms-beräkning

4. **PDF Generation**
   - Testa PDF generering med olika data
   - Verifiera att alla fält visas korrekt
   - Testa med KMA enabled/disabled

5. **Email Integration**
   - Testa email sending
   - Testa tracking pixel
   - Testa email open tracking

6. **Conversion**
   - Testa quote → project conversion
   - Verifiera att alla data kopieras korrekt
   - Testa att tasks skapas från items

---

## 📝 CODE STYLE & CONVENTIONS

- ✅ Använd TypeScript med strikt typing
- ✅ Använd `createAdminClient()` för admin operations
- ✅ Använd `getTenantId()` för tenant validation
- ✅ Använd `extractErrorMessage()` för error handling
- ✅ Följ Next.js 16 App Router patterns
- ✅ Kommentera komplex logik
- ✅ Använd async/await (inte .then())
- ✅ Returnera korrekt HTTP status codes

---

## 🎯 PRIORITET

**Implementera i denna ordning:**

1. **Database schema** (MÅSTE vara först)
2. **CRUD API routes** (Grundfunktionalitet)
3. **Pricing engine** (Kritiskt för korrekta priser)
4. **Workflow & status** (Kritiskt för process)
5. **PDF generation** (Viktigt för kunder)
6. **Email integration** (Viktigt för workflow)
7. **Conversion** (Nice-to-have men viktigt)

---

## 📚 REFERENSER

- **Komplett guide:** `frost_quote_kma_guide.md` (alla detaljer finns här)
- **Database schema:** Se guide sektion 1.1
- **PDF template:** Se guide sektion 2.3
- **Workflow:** Se guide sektion 3.2
- **Approval:** Se guide sektion 4.1
- **Pricing:** Se guide sektion 5.1
- **Email:** Se guide sektion 6.1
- **Conversion:** Se guide sektion 7.1

---

## ✅ ACCEPTANCE CRITERIA

Backend är klar när:

- [ ] Alla tabeller skapade med RLS policies
- [ ] Alla API routes implementerade och testade
- [ ] Pricing engine fungerar korrekt
- [ ] Status transitions valideras korrekt
- [ ] PDF genereras korrekt med alla data
- [ ] Email sending fungerar med tracking
- [ ] Quote → Project conversion fungerar
- [ ] Alla errors hanteras gracefully
- [ ] Performance är acceptabel (<500ms för vanliga queries)

---

**Börja med database schema och arbeta dig igenom listan systematiskt. Använd guiden som referens för alla implementation details. Lycka till! 🚀**

