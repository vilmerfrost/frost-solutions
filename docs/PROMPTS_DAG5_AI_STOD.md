# 🌙 Prompts för Dag 5 - Allmänt AI-stöd för HELA appen

## 📋 Översikt
Dag 5 fokuserar på att implementera omfattande AI-stöd genom HELA Frost Solutions-appen - inte bara integrations, utan AI-assistenter, förslag, analyser och smart automation överallt.

---

## 🔍 PERPLEXITY PRO RESEARCHERS - Research Prompt

```
Du är en expert på AI-integrationer för projektlednings- och faktureringssystem, Next.js 16, och modern AI API:er.

RESEARCH UPPGIFT: Implementera omfattande AI-stöd i ett SaaS-projektledningssystem

1. AI-INTEGRATIONER FÖR PROJEKTLEDNINGSSYSTEM
   - Vilka AI-funktioner är mest värdefulla för byggföretag och projektledning?
   - AI-förslag för fakturering (analysera tidsrapporter, föreslå faktura-belopp)
   - AI-projektplanering (analysera historiska projekt, föreslå realistiska tidsplaner)
   - AI-budgetprognos (prediktiv analys baserat på historik)
   - AI-materialidentifiering (foto → identifiera material via image classification)
   - AI KMA/Egenkontroller-förslag (generera checklistor baserat på projekttyp)
   - AI-riskanalys (identifiera potentiella problem i projekt)
   - AI-kundkommunikation (generera professionella meddelanden)

2. AI API:ER OCH MODELLER (2024-2025)
   - Hugging Face Inference API (gratis tier) - vilka modeller passar för svenska texter?
   - OpenAI API (GPT-4, GPT-4 Turbo) - när är det värt kostnaden?
   - Anthropic Claude API - jämförelse med OpenAI
   - Google Gemini API - kostnad och kapacitet
   - Lokala modeller (Ollama, etc.) - när är det bättre?
   - Image classification modeller för materialidentifiering
   - Text generation modeller för svenska språket

3. KOSTNADSOPTIMERING
   - Caching-strategier för att minska API-anrop
   - Batch processing för att minska kostnader
   - Fallback-strategier när AI misslyckas
   - Rate limiting och throttling
   - När använda gratis vs betalda API:er

4. USER EXPERIENCE FÖR AI-FUNKTIONER
   - Hur presentera AI-förslag utan att vara påträngande?
   - Loading states och feedback
   - Error handling och fallbacks
   - "Använd AI-förslag" vs "Redigera förslag" patterns
   - Visuell feedback (sparkles, gradients, etc.)
   - Accessibility för AI-funktioner

5. IMPLEMENTATION PATTERNS
   - Server-side vs Client-side AI-anrop
   - Next.js 16 App Router patterns för AI
   - Streaming responses för långa AI-genereringar
   - Error handling och retry logic
   - Security considerations (API keys, rate limiting)
   - Database schema för AI-cache och historik

6. SPECIFIKA USE CASES FÖR FROST SOLUTIONS
   - AI-faktureringsförslag: Analysera time entries → föreslå faktura-belopp och rader
   - AI-projektplanering: Analysera liknande projekt → föreslå tidsplan och resurser
   - AI-budgetprognos: Prediktiv analys → varningar vid risk för överskridning
   - AI-materialidentifiering: Foto → matcha mot supplier_items databas
   - AI KMA-förslag: Projekttyp → generera relevant checklista
   - AI-sammanfattningar: Projekt/fakturor → korta, användbara sammanfattningar (redan delvis implementerat)

VIKTIGT:
- Fokusera på praktiska, implementerbara lösningar
- Ge konkreta code examples och patterns
- Inkludera kostnadsanalys (gratis vs betalt)
- Aktuell information (2024-2025)
- Svenska språket är viktigt
- Performance och caching är kritiskt

Returnera strukturerad research med:
- Rekommenderade AI-funktioner (rankade efter värde)
- API-rekommendationer (med kostnadsjämförelse)
- Implementation patterns och code examples
- UX best practices
- Caching och optimeringsstrategier
- Security considerations
- Fallback-strategier
- Konkreta use cases med exempel
```

---

## 🤖 GPT-5 - Backend Prompt (OPTIMERAD BASERAT PÅ RESEARCH)

**⚠️ VIKTIGT:** Den fullständiga, optimerade GPT-5 prompten finns i: `docs/GPT5_BACKEND_AI_IMPLEMENTATION.md`

Den innehåller:
- ✅ Kostnadsbeslut (gratis vs betalt)
- ✅ Detaljerad implementation för alla 6 AI-endpoints
- ✅ Caching-strategier
- ✅ Database schema för ai_cache
- ✅ Code structure och acceptance criteria

**KOSTNADSOPTIMERING:**
- **GRATIS:** Budgetprognos, Materialidentifiering, KMA-förslag, Sammanfattningar
- **BETALT (optimerat):** Faktureringsförslag (Claude Haiku + caching), Projektplanering (Haiku/Sonnet)

**KOSTNADSMÅL:** Max $50-80/månad för 100 projekt (vs $150-200 i original-guide)

---

### Snabb-referens för GPT-5:

```
Du är en backend-expert för Next.js 16 App Router, TypeScript, och AI-integrationer.

CONTEXT:
Frost Solutions är ett SaaS-projektledningssystem för svenska byggföretag. Vi har redan:
- AISummary komponent för projekt/fakturor (använder Hugging Face)
- /api/ai/summarize endpoint
- Multi-tenant arkitektur med Supabase
- React Query för state management

UPPGIFT: Implementera omfattande AI-stöd backend för HELA appen

BASERAT PÅ PERPLEXITY RESEARCH OCH KOSTNADSANALYS, IMPLEMENTERA:

1. AI-FAKTURERINGSFÖRSLAG API
   Endpoint: POST /api/ai/suggest-invoice
   - Analysera time entries för ett projekt
   - Identifiera fakturerbart arbete
   - Föreslå faktura-belopp och rader
   - Inkludera materialkostnader om tillgängliga
   - Returnera: { suggestedAmount, suggestedLines: [{ description, hours, rate, amount }] }
   - Använd Hugging Face eller OpenAI för analys
   - Cache resultat för att minska API-kostnader

2. AI-PROJEKTPLANERING API
   Endpoint: POST /api/ai/suggest-project-plan
   - Analysera historiska projekt (liknande typ, storlek)
   - Föreslå realistisk tidsplan (veckor/dagar)
   - Föreslå resursallokering (antal hantverkare)
   - Föreslå budget baserat på historik
   - Returnera: { suggestedTimeline, suggestedResources, suggestedBudget, confidence }
   - Använd machine learning patterns eller AI för analys

3. AI-BUDGETPROGNOS API
   Endpoint: POST /api/ai/predict-budget
   - Analysera projektets nuvarande framsteg
   - Prediktera risk för budgetöverskridning
   - Föreslå åtgärder för att hålla budget
   - Returnera: { riskLevel, predictedOverspend, suggestions }
   - Använd statistisk analys + AI för förutsägelser

4. AI-MATERIALIDENTIFIERING API
   Endpoint: POST /api/ai/identify-material
   - Ta emot bild (base64 eller URL)
   - Använd image classification (Hugging Face eller OpenAI Vision)
   - Matcha mot supplier_items databas
   - Returnera: { materialName, confidence, supplierItems: [...] }
   - Cache resultat för samma bilder

5. AI KMA-FÖRSLAG API
   Endpoint: POST /api/ai/suggest-kma-checklist
   - Ta emot projekttyp (elektriker, rörmokare, målare, etc.)
   - Generera relevant checklista baserat på projekttyp
   - Föreslå KMA-items och foto-krav
   - Returnera: { checklistItems: [{ title, requiresPhoto, category }] }
   - Använd template + AI för generering

6. AI-KUNDKOMMUNIKATION API
   Endpoint: POST /api/ai/generate-message
   - Generera professionella meddelanden till kunder
   - Anpassa ton och innehåll baserat på kontext
   - Returnera: { message, tone, suggestions }
   - Använd OpenAI eller Claude för kvalitet

7. FÖRBÄTTRA BEFINTLIG AI-SUMMARIZE
   - Förbättra prompt engineering
   - Lägg till fler typer (kunder, anställda, etc.)
   - Implementera caching (Redis eller Supabase cache)
   - Lägg till streaming support för långa sammanfattningar

8. AI-CACHE SYSTEM
   - Skapa ai_cache tabell i Supabase
   - Cache AI-responses baserat på input hash
   - TTL: 24 timmar för förslag, 7 dagar för sammanfattningar
   - Implementera cache invalidation

REQUIREMENTS:
- TypeScript strict mode
- Error handling med extractErrorMessage pattern
- Caching för att minska API-kostnader
- Fallback-strategier när AI misslyckas
- Rate limiting för att skydda mot abuse
- Logging för debugging (inte i production)
- Säker hantering av API keys (env-variabler)

CODE STYLE:
- Använd existing patterns från projektet
- Följ Next.js 16 App Router conventions
- Använd Supabase admin client för database operations
- Matcha projektets error handling patterns

PERFORMANCE:
- Implementera request deduplication
- Använd Promise.allSettled för parallella AI-anrop
- Timeout på 30 sekunder för AI-anrop
- Retry logic med exponential backoff
```

---

## ✨ GEMINI 2.5 - Frontend Prompt (OPTIMERAD BASERAT PÅ RESEARCH)

```
Du är en frontend-expert för React/Next.js med fokus på UX och AI-integrationer.

CONTEXT:
Frost Solutions är ett SaaS-projektledningssystem. Vi har redan:
- AISummary komponent (för projekt/fakturor)
- Premium design system med Tailwind CSS
- React Query för data fetching
- Dark mode support

UPPGIFT: Implementera omfattande AI-stöd UI för HELA appen

BASERAT PÅ PERPLEXITY RESEARCH, SKAPA:

1. AI-SUGGESTION COMPONENTS
   - AISuggestionCard: Generisk komponent för AI-förslag
   - Visuell feedback: Sparkles-ikon, gradient-bakgrunder
   - "Använd förslag" vs "Redigera förslag" knappar
   - Loading states med skeleton loaders
   - Error states med retry-funktionalitet

2. AI-FAKTURERINGSFÖRSLAG UI
   - Komponent: InvoiceAISuggestion
   - Visa på faktura-skapande sidor
   - Visa föreslagna faktura-rader
   - "Använd AI-förslag" → auto-fyll formulär
   - "Redigera förslag" → öppna redigeringsläge
   - Confidence indicators

3. AI-PROJEKTPLANERING UI
   - Komponent: ProjectAIPlanning
   - Visa på projekt-skapande sidor
   - Visa föreslagen tidsplan, resurser, budget
   - "Använd AI-förslag" → auto-fyll projektdata
   - Jämförelse med liknande projekt

4. AI-BUDGETPROGNOS UI
   - Komponent: BudgetAIPrediction
   - Visa på projekt-detaljsidor
   - Visuell risk-indikator (grön/gul/röd)
   - Föreslagna åtgärder
   - Graf över predikterad budget vs faktisk

5. AI-MATERIALIDENTIFIERING UI
   - Komponent: MaterialAIIdentifier
   - Foto-uppladdning med drag & drop
   - Live preview med AI-identifiering
   - Confidence score visuellt
   - Matchade supplier items
   - "Lägg till i projekt" funktionalitet

6. AI KMA-FÖRSLAG UI
   - Komponent: KMAIISuggestion
   - Visa på projekt-skapande sidor
   - Föreslagen checklista med items
   - "Använd AI-checklista" → skapa checklista
   - Redigera items innan skapande

7. AI-KUNDKOMMUNIKATION UI
   - Komponent: CustomerAIMessage
   - Visa på kund-sidor
   - Generera meddelanden baserat på kontext
   - Flera ton-alternativ (professionell, vänlig, etc.)
   - "Kopiera meddelande" funktionalitet

8. FÖRBÄTTRA BEFINTLIG AISummary
   - Lägg till fler typer (kunder, anställda, etc.)
   - Förbättra loading states
   - Lägg till streaming support för långa sammanfattningar
   - Bättre error handling

9. AI-ASSISTENT CHAT (OPTIONAL)
   - Komponent: AIAssistantChat
   - Floating chat-bubble i hörnet
   - Kontextuell hjälp baserat på nuvarande sida
   - "Hur skapar jag en faktura?" etc.
   - Använd OpenAI eller Claude för kvalitet

10. AI-INDICATORS ÖVERALLT
    - Lägg till diskreta AI-ikoner där AI hjälper
    - "AI-förslag" badges på relevanta knappar
    - Tooltips som förklarar AI-funktionalitet
    - Konsistent visuell språk (sparkles, gradients)

REQUIREMENTS:
- TypeScript strict
- Matcha projektets design system
- Använda lucide-react icons
- Responsive design (mobil-först)
- Dark mode support
- Accessibility (WCAG 2.1)
- Loading states för alla AI-anrop
- Error handling med retry

CODE STYLE:
- Använd existing hooks (useQuery, useMutation)
- Följ Tailwind CSS patterns från projektet
- Använd toast notifications för feedback
- AI-stöd ska vara visuellt tydligt men inte påträngande

UX PRINCIPLES:
- AI ska hjälpa, inte ersätta användaren
- Alltid möjlighet att redigera AI-förslag
- Tydlig feedback när AI arbetar
- Fallback när AI misslyckas
- Diskret men synlig AI-presens
```

---

## 📝 NOTION PRO - Dokumentation Prompt

```
Du är project manager för Frost Solutions AI-stöd implementation.

UPPGIFT:
Dokumentera dagens framsteg och skapa action plan för imorgon.

INCLUDE:
1. Status Update
   - ✅ Befintligt: AISummary för projekt/fakturor
   - ✅ Befintligt: /api/ai/summarize endpoint
   - 🆕 Implementerat: Export-knappar med AI-stöd (Fortnox/Visma)
   - 🆕 Planerat: Omfattande AI-stöd för hela appen
   - ⚠️ Problem: Fortnox OAuth fungerar inte ännu

2. AI-Funktioner att Implementera (Prioriterad Lista)
   - [ ] AI-faktureringsförslag (hög prioritet)
   - [ ] AI-projektplanering (hög prioritet)
   - [ ] AI-budgetprognos (medel prioritet)
   - [ ] AI-materialidentifiering (medel prioritet)
   - [ ] AI KMA-förslag (läg prioritet)
   - [ ] AI-kundkommunikation (läg prioritet)
   - [ ] Förbättra befintlig AISummary

3. Action Plan för Imorgon
   - [ ] Review Perplexity research results
   - [ ] Implementera AI-faktureringsförslag backend (GPT-5)
   - [ ] Implementera AI-faktureringsförslag frontend (Gemini 2.5)
   - [ ] Testa AI-funktionalitet
   - [ ] Implementera caching för AI-responses
   - [ ] Fixa Fortnox OAuth (om tid finns)

4. Technical Debt
   - AISummary fungerar men kan förbättras
   - Ingen caching för AI-responses ännu
   - AI-stöd är begränsat till projekt/fakturor

5. Next Steps
   - Expandera AI-stöd till alla delar av appen
   - Implementera caching för kostnadsoptimering
   - Förbättra UX för AI-funktioner
   - Lägg till fler AI-typer (kunder, anställda, etc.)

FORMAT:
Strukturerad Notion-dokumentation med checkboxes, code blocks, och action items.
```

---

## 🎯 CURSOR - Implementation Prompt

```
Du är huvud-implementeraren för Frost Solutions.

CONTEXT:
Vi ska implementera omfattande AI-stöd för HELA appen. Perplexity har gjort research, och vi har beslutat att implementera AI-funktioner baserat på den research.

IMMEDIATE TASKS:
1. Review Perplexity research results
   - Analysera rekommendationer
   - Ta beslut om vilka AI-funktioner att implementera först
   - Välj AI API:er baserat på kostnad och kvalitet

2. Implementera AI-faktureringsförslag (PRIORITET 1)
   - Backend: POST /api/ai/suggest-invoice (GPT-5)
   - Frontend: InvoiceAISuggestion komponent (Gemini 2.5)
   - Integrera på faktura-skapande sidor
   - Testa funktionalitet

3. Implementera AI-projektplanering (PRIORITET 2)
   - Backend: POST /api/ai/suggest-project-plan (GPT-5)
   - Frontend: ProjectAIPlanning komponent (Gemini 2.5)
   - Integrera på projekt-skapande sidor
   - Testa funktionalitet

4. Implementera AI-cache system
   - Skapa ai_cache tabell i Supabase
   - Implementera cache logic i AI endpoints
   - Testa cache hit/miss scenarios

5. Förbättra befintlig AISummary
   - Lägg till fler typer
   - Förbättra error handling
   - Lägg till caching

6. Code review
   - Granska alla ändringar
   - Fixa eventuella TypeScript-fel
   - Verifiera att inget brutits
   - Testa alla AI-funktioner

REQUIREMENTS:
- Testa alla ändringar innan commit
- Följ projektets code style
- Uppdatera dokumentation om nödvändigt
- Commit med tydliga messages

FOCUS:
Implementera AI-stöd som faktiskt hjälper användare, inte bara "cool features". Fokusera på värde och UX.
```

---

## 💻 COPILOT PLUS - Code Assistance Prompt

```
Du är code assistant för Frost Solutions.

UPPGIFT: Hjälp till med AI-implementation och code improvements

FOCUS AREAS:
1. AI API Integration
   - Review AI endpoint implementations
   - Suggest improvements för error handling
   - Help with caching strategies
   - Optimize API calls för kostnad

2. AI Components
   - Review AI UI components
   - Suggest UX improvements
   - Help with loading states
   - Improve error handling

3. TypeScript
   - Fix type errors
   - Improve type safety
   - Add missing types för AI responses

4. Code Quality
   - Suggest refactoring opportunities
   - Improve code readability
   - Add helpful comments
   - Optimize performance

APPROACH:
- Be proactive - suggest fixes before errors occur
- Explain why changes are needed
- Reference existing patterns in codebase
- Keep code consistent with project style
- Focus on value för användare
```

---

## 🌊 WINDSURF - Comprehensive Context Prompt

```
Du är en senior fullstack-utvecklare och systemarkitekt för Frost Solutions - ett komplett projektlednings- och faktureringssystem byggt med Next.js 16, TypeScript, Supabase, och Tailwind CSS.

═══════════════════════════════════════════════════════════════════════════════
📋 PROJEKTÖVERSIKT
═══════════════════════════════════════════════════════════════════════════════

Frost Solutions är ett SaaS-system för svenska byggföretag med följande huvudfunktioner:
- Multi-tenant arkitektur (Supabase RLS)
- Projektledning med tidsrapportering
- Fakturering och kundhantering
- Arbetsordrar med status-flöden
- Employee management med roller (admin/employee)
- Offline-first med IndexedDB och sync-queue
- Dashboard med statistik och kalender
- ROT-avdrag och ÄTA-hantering
- Integrationer med Fortnox och Visma (OAuth 2.0)
- AI-stöd för sammanfattningar (delvis implementerat)

TECH STACK:
- Framework: Next.js 16 (App Router) med React Server Components
- Language: TypeScript (strict mode)
- Database: Supabase (PostgreSQL med RLS)
- Styling: Tailwind CSS med custom design system
- State Management: React Query (@tanstack/react-query)
- Offline: Dexie.js (IndexedDB), Service Worker, Sync Queue
- Authentication: Supabase Auth
- Icons: Lucide React
- Notifications: Sonner (via @/lib/toast)
- AI: Hugging Face Inference API (gratis tier, redan implementerat)

PROJEKTSTRUKTUR:
- /app - Next.js App Router (pages, components, api routes)
- /app/lib - Core utilities (encryption, db, sync, integrations)
- /app/hooks - React Query hooks och custom hooks
- /app/components - Reusable UI components
- /app/types - TypeScript type definitions
- /sql - Database migrations och schema
- /docs - Dokumentation och prompts

═══════════════════════════════════════════════════════════════════════════════
🤖 BEFINTLIGT AI-STÖD
═══════════════════════════════════════════════════════════════════════════════

VI HAR REDAN:
1. AISummary komponent
   - Används på projekt- och faktura-sidor
   - Använder /api/ai/summarize endpoint
   - Hugging Face Inference API (gratis)
   - Fallback till template-baserad sammanfattning

2. /api/ai/summarize endpoint
   - POST /api/ai/summarize
   - Stödjer 'project' och 'invoice' typer
   - Använder SEBIS/legal_t5_small_sv_summarization model
   - Fallback-strategi om AI misslyckas

VIKTIGA FILER:
- app/components/AISummary.tsx - AI-sammanfattning komponent
- app/api/ai/summarize/route.ts - AI summarization endpoint

═══════════════════════════════════════════════════════════════════════════════
🆕 DAG 5: OMFATTANDE AI-STÖD FÖR HELA APPEN
═══════════════════════════════════════════════════════════════════════════════

MÅL:
Implementera AI-stöd genom HELA appen - inte bara sammanfattningar, utan smarta förslag, analyser och automation överallt där det ger värde.

PLANERADE AI-FUNKTIONER:

1. AI-FAKTURERINGSFÖRSLAG (HÖG PRIORITET)
   - Analysera time entries för projekt
   - Föreslå faktura-belopp och rader
   - "Använd AI-förslag" → auto-fyll faktura
   - UI: InvoiceAISuggestion komponent
   - Backend: POST /api/ai/suggest-invoice

2. AI-PROJEKTPLANERING (HÖG PRIORITET)
   - Analysera historiska projekt
   - Föreslå realistisk tidsplan
   - Föreslå resursallokering
   - UI: ProjectAIPlanning komponent
   - Backend: POST /api/ai/suggest-project-plan

3. AI-BUDGETPROGNOS (MEDEL PRIORITET)
   - Prediktiv analys av budget
   - Risk-varningar
   - Föreslagna åtgärder
   - UI: BudgetAIPrediction komponent
   - Backend: POST /api/ai/predict-budget

4. AI-MATERIALIDENTIFIERING (MEDEL PRIORITET)
   - Foto → identifiera material
   - Matcha mot supplier_items
   - UI: MaterialAIIdentifier komponent
   - Backend: POST /api/ai/identify-material

5. AI KMA-FÖRSLAG (LÄG PRIORITET)
   - Generera checklistor baserat på projekttyp
   - UI: KMAIISuggestion komponent
   - Backend: POST /api/ai/suggest-kma-checklist

6. AI-KUNDKOMMUNIKATION (LÄG PRIORITET)
   - Generera professionella meddelanden
   - UI: CustomerAIMessage komponent
   - Backend: POST /api/ai/generate-message

7. FÖRBÄTTRA BEFINTLIG AISummary
   - Lägg till fler typer (kunder, anställda)
   - Förbättra caching
   - Streaming support

═══════════════════════════════════════════════════════════════════════════════
🔧 TEKNISK KONTEKT
═══════════════════════════════════════════════════════════════════════════════

AI API:ER:
- Hugging Face Inference API (gratis tier) - redan används
- OpenAI API (GPT-4) - för avancerade features
- Anthropic Claude API - alternativ till OpenAI
- Google Gemini API - kostnadseffektivt alternativ

CACHING:
- Implementera ai_cache tabell i Supabase
- Cache AI-responses baserat på input hash
- TTL: 24 timmar för förslag, 7 dagar för sammanfattningar

ERROR HANDLING:
- Alltid fallback-strategier
- Template-baserade svar om AI misslyckas
- Tydliga felmeddelanden för användare
- Logging för debugging (inte i production)

PERFORMANCE:
- Request deduplication
- Parallel AI-anrop med Promise.allSettled
- Timeout på 30 sekunder
- Retry logic med exponential backoff

═══════════════════════════════════════════════════════════════════════════════
🎯 DINA UPPGIFTER (DAG 5)
═══════════════════════════════════════════════════════════════════════════════

PRIORITET 1: REVIEW PERPLEXITY RESEARCH
1. Läs Perplexity research results
2. Analysera rekommendationer
3. Ta beslut om vilka AI-funktioner att implementera först
4. Välj AI API:er baserat på kostnad och kvalitet

PRIORITET 2: IMPLEMENTERA AI-FAKTURERINGSFÖRSLAG
1. Backend: POST /api/ai/suggest-invoice (GPT-5)
2. Frontend: InvoiceAISuggestion komponent (Gemini 2.5)
3. Integrera på faktura-skapande sidor
4. Testa funktionalitet

PRIORITET 3: IMPLEMENTERA AI-PROJEKTPLANERING
1. Backend: POST /api/ai/suggest-project-plan (GPT-5)
2. Frontend: ProjectAIPlanning komponent (Gemini 2.5)
3. Integrera på projekt-skapande sidor
4. Testa funktionalitet

PRIORITET 4: IMPLEMENTERA AI-CACHE
1. Skapa ai_cache tabell i Supabase
2. Implementera cache logic i AI endpoints
3. Testa cache hit/miss scenarios

═══════════════════════════════════════════════════════════════════════════════
📝 KODSTANDARDER
═══════════════════════════════════════════════════════════════════════════════

1. TypeScript: Strict mode, explicit types, no any (utom där nödvändigt)
2. Error handling: Använd extractErrorMessage() för alla errors
3. AI: Alltid fallback-strategier när AI misslyckas
4. Caching: Cache AI-responses för att minska kostnader
5. Logging: console.log endast i development, använd console.error för errors
6. UI: Använd toast notifications för user feedback
7. API: Returnera tydliga error messages på svenska
8. Code style: Matcha existing patterns i projektet
9. Testing: Testa alla ändringar innan commit
10. Documentation: Uppdatera docs om nödvändigt
11. AI-stöd: Visuellt tydligt markerat men inte påträngande

═══════════════════════════════════════════════════════════════════════════════
🚀 FÖRVÄNTAT RESULTAT
═══════════════════════════════════════════════════════════════════════════════

När AI-stöd är implementerat ska:
1. Användare se AI-förslag på relevanta ställen
2. AI hjälpa men inte ersätta användaren
3. Alla AI-förslag vara redigerbara
4. Caching minska API-kostnader
5. Fallbacks fungera när AI misslyckas
6. UX vara smidig och professionell

LYCKA TILL! 🚀✨
```

---

## 🌙 Godnatt!

**Sammanfattning för imorgon:**
- ✅ Export-knappar med AI-stöd implementerade
- ✅ Befintligt AI-stöd: AISummary för projekt/fakturor
- 🆕 Planerat: Omfattande AI-stöd för hela appen
- ⚠️ Fortnox OAuth behöver fixas (lägre prioritet nu)

**Första steg imorgon:**
1. Review Perplexity research results
2. Ta beslut om vilka AI-funktioner att implementera först
3. Implementera AI-faktureringsförslag (backend + frontend)
4. Implementera AI-projektplanering (backend + frontend)
5. Implementera AI-cache system

**Alla prompts är sparade i: `docs/PROMPTS_DAG5_AI_STOD.md`**

Godnatt! 🚀✨
