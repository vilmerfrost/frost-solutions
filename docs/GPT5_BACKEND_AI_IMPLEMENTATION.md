# 🤖 GPT-5 Backend Implementation Prompt - AI-stöd för Frost Solutions

## 📋 KOSTNADSBESLUT & STRATEGI

**GRATIS IMPLEMENTATION (Prioritet 1):**
- ✅ **AI Budgetprognos** - Statistisk analys, ingen AI behövs (helt gratis)
- ✅ **AI Materialidentifiering** - Hugging Face free tier (50 req/hr, gratis)
- ✅ **AI KMA-förslag** - Template-baserat med smarta regler (helt gratis)
- ✅ **AI Sammanfattningar** - Hugging Face free tier (redan implementerat)

**BETALT MEN OPTIMERAT (Prioritet 2):**
- 💰 **AI Faktureringsförslag** - Claude 3.5 Haiku (billigast) + aggressiv caching
- 💰 **AI Projektplanering** - Claude 3.5 Haiku för enkla, Sonnet endast vid behov

**KOSTNADSMÅL:** Max $50-80/månad för 100 projekt (vs $150-200 i original-guide)

---

## 🎯 GPT-5 PROMPT - BACKEND IMPLEMENTATION

```
Du är en backend-expert för Next.js 16 App Router, TypeScript, Supabase, och AI-integrationer.

═══════════════════════════════════════════════════════════════════════════════
📋 PROJEKTKONTEKT
═══════════════════════════════════════════════════════════════════════════════

Frost Solutions är ett SaaS-projektledningssystem för svenska byggföretag.

TECH STACK:
- Framework: Next.js 16 App Router med React Server Components
- Language: TypeScript (strict mode)
- Database: Supabase PostgreSQL (multi-tenant med RLS)
- State Management: React Query (@tanstack/react-query)
- Authentication: Supabase Auth
- AI: Hugging Face Inference API (gratis), Claude 3.5 Haiku (betalt, billigt)
- Existing: /api/ai/summarize endpoint (använder Hugging Face gratis)

DATABASE SCHEMA (Supabase):
- projects (id, name, client_id, tenant_id, budgeted_hours, base_rate_sek, status, created_at)
- invoices (id, project_id, client_id, tenant_id, amount, status, issue_date, created_at)
- time_entries (id, project_id, employee_id, tenant_id, hours, date, ob_type, created_at)
- clients (id, name, org_number, tenant_id, created_at)
- employees (id, name, email, tenant_id, role, created_at)

EXISTING PATTERNS:
- API routes: app/api/[feature]/route.ts
- Error handling: extractErrorMessage() från @/lib/errorUtils
- Supabase: createAdminClient() från @/utils/supabase/admin för RLS-bypass
- Toast notifications: toast från @/lib/toast (Sonner)
- TypeScript: Strict mode, explicit types

═══════════════════════════════════════════════════════════════════════════════
🎯 UPPGIFT: IMPLEMENTERA AI-STÖD BACKEND (KOSTNADSOPTIMERAT)
═══════════════════════════════════════════════════════════════════════════════

Implementera 6 AI-endpoints med fokus på KOSTNADSOPTIMERING och GRATIS alternativ.

═══════════════════════════════════════════════════════════════════════════════
1. AI BUDGETPROGNOS (GRATIS - Statistisk analys)
═══════════════════════════════════════════════════════════════════════════════

Endpoint: POST /api/ai/predict-budget

IMPLEMENTATION:
- INGEN AI behövs - använd statistisk analys
- Analysera projektets nuvarande framsteg
- Jämför med budget och historiska projekt
- Prediktera risk för budgetöverskridning
- Föreslå åtgärder baserat på trender

LOGIK:
1. Hämta projektdata (budget, timmar, status)
2. Hämta time_entries för projektet
3. Beräkna nuvarande spend (timmar × timpris)
4. Beräkna framsteg (% av budget använd)
5. Hitta liknande historiska projekt
6. Prediktera final spend baserat på trend
7. Identifiera risk-nivå (low/medium/high)
8. Generera åtgärdsförslag (template-baserat)

RESPONSE:
{
  "success": true,
  "prediction": {
    "currentSpend": number,
    "budgetRemaining": number,
    "currentProgress": number, // %
    "predictedFinal": number,
    "riskLevel": "low" | "medium" | "high",
    "suggestions": string[],
    "confidence": "high" | "medium" | "low"
  }
}

KOSTNAD: $0 (helt gratis, ingen AI)

═══════════════════════════════════════════════════════════════════════════════
2. AI MATERIALIDENTIFIERING (GRATIS - Hugging Face free tier)
═══════════════════════════════════════════════════════════════════════════════

Endpoint: POST /api/ai/identify-material

IMPLEMENTATION:
- Använd Hugging Face Inference API (GRATIS, 50 req/hr)
- Image classification för byggmaterial
- Matcha mot supplier_items i databasen
- Fallback till template-baserat svar om AI misslyckas

LOGIK:
1. Ta emot bild (base64 eller URL)
2. Använd Hugging Face image classification
3. Model: "google/vit-base-patch16-224" eller liknande (byggmaterial)
4. Matcha resultat mot supplier_items tabell
5. Returnera matchningar med confidence scores
6. Fallback: Returnera generiska material-kategorier

RESPONSE:
{
  "success": true,
  "material": {
    "name": string,
    "confidence": number, // 0-100
    "category": string,
    "supplierItems": [
      {
        "id": string,
        "name": string,
        "price": number,
        "supplier": string
      }
    ],
    "alternatives": Array<{name: string, confidence: number}>
  },
  "model": "huggingface" | "template"
}

KOSTNAD: $0 (Hugging Face free tier, max 50 req/hr)

═══════════════════════════════════════════════════════════════════════════════
3. AI KMA-FÖRSLAG (GRATIS - Template-baserat)
═══════════════════════════════════════════════════════════════════════════════

Endpoint: POST /api/ai/suggest-kma-checklist

IMPLEMENTATION:
- INGEN AI behövs - använd smarta templates
- Baserat på projekttyp (elektriker, rörmokare, målare, etc.)
- Generera relevant checklista med items
- Föreslå foto-krav baserat på typ

LOGIK:
1. Ta emot projekttyp och projekt-id
2. Hämta historiska KMA-checklistor för liknande projekt
3. Använd template-baserad generering
4. Lägg till standard-items baserat på projekttyp
5. Föreslå foto-krav för kritiska steg
6. Returnera checklista-struktur

RESPONSE:
{
  "success": true,
  "checklist": {
    "items": [
      {
        "title": string,
        "category": string,
        "requiresPhoto": boolean,
        "description": string,
        "order": number
      }
    ],
    "projectType": string,
    "confidence": "high" | "medium" | "low"
  }
}

KOSTNAD: $0 (helt gratis, ingen AI)

═══════════════════════════════════════════════════════════════════════════════
4. AI FAKTURERINGSFÖRSLAG (BETALT - Claude Haiku + Caching)
═══════════════════════════════════════════════════════════════════════════════

Endpoint: POST /api/ai/suggest-invoice

IMPLEMENTATION:
- Använd Claude 3.5 Haiku (billigast betalt alternativ)
- Aggressiv caching (7 dagar TTL)
- Fallback till template-baserat svar om AI misslyckas
- Analysera time_entries och historiska fakturor

KOSTNADSOPTIMERING:
- Cache AI-responses i Supabase (ai_cache tabell)
- Använd prompt caching (Claude feature)
- Rate limiting: max 5 requests/min per tenant
- Fallback till template om cache miss och AI fail

LOGIK:
1. Kolla cache först (hash av project_id + time_entries)
2. Om cache hit → returnera cached result
3. Om cache miss:
   a. Hämta projektdata och time_entries
   b. Hämta historiska fakturor för samma kund
   c. Bygg prompt för Claude Haiku
   d. Anropa Claude API med prompt caching
   e. Parse JSON response
   f. Spara i cache (7 dagar TTL)
   g. Returnera resultat
4. Om AI fail → fallback till template-baserat svar

RESPONSE:
{
  "success": true,
  "suggestion": {
    "totalAmount": number,
    "suggestedDiscount": number, // %
    "invoiceRows": [
      {
        "description": string,
        "quantity": number,
        "unitPrice": number,
        "vat": number, // %
        "amount": number
      }
    ],
    "notes": string,
    "confidence": "high" | "medium" | "low"
  },
  "model": "claude-haiku" | "template",
  "cached": boolean
}

KOSTNAD: ~$0.40 per 100 förslag (med caching) vs $2.40 utan caching

═══════════════════════════════════════════════════════════════════════════════
5. AI PROJEKTPLANERING (BETALT - Claude Haiku, Sonnet endast vid behov)
═══════════════════════════════════════════════════════════════════════════════

Endpoint: POST /api/ai/suggest-project-plan

IMPLEMENTATION:
- Använd Claude 3.5 Haiku för enkla projekt
- Uppgradera till Sonnet endast om projekt är komplext
- Aggressiv caching (14 dagar TTL)
- Fallback till template-baserat svar

KOSTNADSOPTIMERING:
- Cache AI-responses
- Använd Haiku för 80% av projekten (enkla)
- Sonnet endast för komplexa projekt (>50 timmar, flera faser)
- Rate limiting: max 3 requests/min per tenant

LOGIK:
1. Kolla cache först
2. Bestäm om projekt är komplext (timmar, faser, beroenden)
3. Om enkelt → använd Haiku
4. Om komplext → använd Sonnet
5. Analysera historiska projekt (liknande typ, kund)
6. Generera tidsplan med faser
7. Identifiera riskfaktorer
8. Spara i cache
9. Returnera resultat

RESPONSE:
{
  "success": true,
  "plan": {
    "phases": [
      {
        "name": string,
        "duration": number, // dagar
        "resources": number, // antal personer
        "description": string,
        "order": number
      }
    ],
    "totalDays": number,
    "bufferDays": number,
    "riskFactors": string[],
    "recommendedTeamSize": number,
    "confidenceLevel": "high" | "medium" | "low"
  },
  "model": "claude-haiku" | "claude-sonnet" | "template",
  "cached": boolean
}

KOSTNAD: ~$0.80 per 100 enkla projekt (Haiku), ~$3.00 per 100 komplexa (Sonnet)

═══════════════════════════════════════════════════════════════════════════════
6. FÖRBÄTTRA BEFINTLIG AI-SUMMARIZE (GRATIS - Hugging Face)
═══════════════════════════════════════════════════════════════════════════════

Endpoint: POST /api/ai/summarize (REDAN IMPLEMENTERAT)

FÖRBÄTTRINGAR:
- Lägg till caching (7 dagar TTL)
- Lägg till fler typer (kunder, anställda)
- Förbättra fallback-logik
- Lägg till streaming support för långa sammanfattningar

═══════════════════════════════════════════════════════════════════════════════
🗄️ DATABASE: AI CACHE TABELL
═══════════════════════════════════════════════════════════════════════════════

Skapa ai_cache tabell i Supabase:

CREATE TABLE IF NOT EXISTS app.ai_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES app.tenants(id) ON DELETE CASCADE,
  cache_key TEXT NOT NULL, -- Hash av input (project_id + data hash)
  cache_type TEXT NOT NULL, -- 'invoice', 'project-plan', 'budget', 'material', 'kma', 'summary'
  response_data JSONB NOT NULL,
  model_used TEXT, -- 'claude-haiku', 'claude-sonnet', 'huggingface', 'template'
  ttl_days INTEGER NOT NULL DEFAULT 7, -- Cache TTL
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  UNIQUE(tenant_id, cache_key, cache_type)
);

CREATE INDEX idx_ai_cache_lookup ON app.ai_cache(tenant_id, cache_key, cache_type, expires_at);
CREATE INDEX idx_ai_cache_cleanup ON app.ai_cache(expires_at) WHERE expires_at < NOW();

═══════════════════════════════════════════════════════════════════════════════
🔧 IMPLEMENTATION REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════════

1. TYPE SAFETY
   - Använd TypeScript strict mode
   - Definiera typer för alla AI-responses
   - Använd Zod för validering (valfritt)

2. ERROR HANDLING
   - Använd extractErrorMessage() från @/lib/errorUtils
   - Alltid fallback-strategier när AI misslyckas
   - Logga errors men inte i production
   - Returnera user-friendly error messages på svenska

3. CACHING STRATEGY
   - Kolla cache FÖRE AI-anrop
   - Spara cache EFTER AI-anrop
   - TTL: 7 dagar för förslag, 14 dagar för planering
   - Auto-cleanup expired cache (cron job eller på read)

4. RATE LIMITING
   - Implementera per-tenant rate limiting
   - Använd Supabase för rate limit tracking
   - Max 5 requests/min för fakturering
   - Max 3 requests/min för projektplanering

5. COST MONITORING
   - Logga AI-anrop med kostnad (valfritt)
   - Track cache hit rate
   - Alert om kostnad överskrider budget

6. SECURITY
   - API keys i env-variabler (ANTHROPIC_API_KEY, HUGGING_FACE_API_KEY)
   - Server-side only (aldrig exponera keys)
   - Tenant isolation (RLS policies)
   - Validera input (project_id, tenant_id)

7. PERFORMANCE
   - Timeout: 30 sekunder för AI-anrop
   - Retry logic: max 2 retries med exponential backoff
   - Parallel processing där möjligt
   - Request deduplication

═══════════════════════════════════════════════════════════════════════════════
📝 CODE STRUCTURE
═══════════════════════════════════════════════════════════════════════════════

Filstruktur:
- app/api/ai/predict-budget/route.ts
- app/api/ai/identify-material/route.ts
- app/api/ai/suggest-kma-checklist/route.ts
- app/api/ai/suggest-invoice/route.ts
- app/api/ai/suggest-project-plan/route.ts
- app/api/ai/summarize/route.ts (förbättra befintlig)
- app/lib/ai/cache.ts (cache utilities)
- app/lib/ai/claude.ts (Claude API client)
- app/lib/ai/huggingface.ts (Hugging Face API client)
- app/lib/ai/templates.ts (template-baserade fallbacks)
- app/types/ai.ts (TypeScript types)

═══════════════════════════════════════════════════════════════════════════════
✅ ACCEPTANCE CRITERIA
═══════════════════════════════════════════════════════════════════════════════

1. Alla 6 endpoints implementerade
2. Caching fungerar för alla AI-endpoints
3. Fallback-strategier fungerar när AI misslyckas
4. Rate limiting implementerat
5. Error handling med extractErrorMessage
6. TypeScript strict mode, inga any types
7. Kostnad: Max $50-80/månad för 100 projekt
8. Cache hit rate: >60% efter första veckan
9. Alla endpoints testade och fungerar
10. Dokumentation uppdaterad

═══════════════════════════════════════════════════════════════════════════════

BÖRJA MED:
1. Skapa ai_cache tabell (SQL migration)
2. Implementera cache utilities (app/lib/ai/cache.ts)
3. Implementera GRATIS endpoints först (budget, material, KMA)
4. Implementera BETALTA endpoints med caching (invoice, project-plan)
5. Förbättra befintlig summarize endpoint
6. Testa alla endpoints
7. Verifiera kostnader

LYCKA TILL! 🚀
```

