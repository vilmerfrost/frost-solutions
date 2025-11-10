# 🔍 Perplexity Research Prompts - Prioritet 3 (LÅG)

## 📋 Översikt: AI Team Roller

### 🖥️ Backend Developers:
- **GPT-5** - Senior backend, komplex logik, algoritmer
- **Claude 4.5** - Backend architecture, API design, error handling
- **Deepseek** - Performance optimization, database queries
- **Gemini 2.5** - Backend utilities, helper functions

### 🎨 Frontend Developers:
- **Gemini 2.5** - UI/UX specialist, React components, Tailwind CSS
- **Claude 4.5** - Accessible UI components, design system

### 🔬 Research & Documentation:
- **Perplexity Pro** - Research, best practices, API documentation

### 🆕 Wildcard AIs (Kan användas för specialiserade uppgifter):
- **Kimi K2** - Kan användas för:
  - Long-context research (långa dokument)
  - Code review av stora filer
  - Documentation writing
  - Complex problem analysis
  
- **Mistral AI** - Kan användas för:
  - Code generation (alternativ till GPT-5)
  - Quick prototyping
  - Testing assistance
  - Code refactoring

### ⚠️ Viktigt:
- **Cursor Pro (Du)** har alltid **FINAL SAY** på alla beslut
- Alla AI:er föreslår, men du bestämmer slutgiltigt
- Kimi K2 och Mistral AI kan användas som alternativ eller för specialiserade uppgifter

---

## 🎯 Funktion 7: Sälj fakturor (Factoring)

### Perplexity Pro Research Prompt:

```
Du är research-assistent för Frost Solutions, ett svenskt byggföretags mjukvaruprojekt.

FORSKNINGSÄMNE: Factoring (Fakturaförsäljning) för svenska byggföretag

KONTEKT:
- Vi bygger ett faktureringssystem för byggföretag
- Teknisk stack: Next.js 16, Supabase (PostgreSQL), TypeScript
- Vi har redan fakturering, kunder, projekt, leverantörsfakturor
- Vi behöver integrera factoring-tjänster som extern funktion

VAD JAG BEHÖVER VETA:

1. **Svenska Factoring-tjänster:**
   - Vilka är de största factoring-bolagen i Sverige?
   - Vilka API:er/tjänster erbjuder de för integration?
   - Vilka fakturor kan säljas (kundfakturor, leverantörsfakturor)?
   - Vilka är kraven för att använda factoring?

2. **Teknisk Integration:**
   - Hur fungerar factoring-API:er tekniskt?
   - Vilka data behöver skickas (fakturanummer, belopp, kundinfo)?
   - Hur hanteras betalningar och statusuppdateringar?
   - Webhooks för statusuppdateringar?

3. **Business Logic:**
   - Vilka fakturor kan säljas (kriterier)?
   - Hur fungerar factoring-processen steg för steg?
   - Vilka är kostnaderna och villkoren?
   - Hur hanteras fakturor som redan är fakturerade?

4. **Implementation Approach:**
   - Bästa praxis för factoring-integration i Next.js?
   - Hur strukturerar man databasen för factoring?
   - Vilka tabeller/kolumner behövs?
   - Hur hanterar man status (pending, sold, paid, rejected)?

5. **Svenska Specifika Krav:**
   - GDPR-kompatibilitet för factoring?
   - Bokföringskrav?
   - Skattemässiga aspekter?
   - Juridiska aspekter?

6. **Alternativ:**
   - Kan factoring vara en extern tjänst (iframe, redirect)?
   - Eller behöver det vara full integration?
   - Vilka är fördelarna/nackdelarna med varje approach?

FÖRVÄNTAT OUTPUT:
- Lista över svenska factoring-tjänster med API-dokumentation
- Teknisk guide för integration (Next.js + Supabase)
- Database schema för factoring-tabeller
- Business logic flow diagram (text-baserat)
- Code examples för API-integration
- Best practices och vanliga pitfalls
- GDPR och compliance considerations

Fokusera på praktiska, implementerbara lösningar som matchar vår tech stack.
```

---

## 🎯 Funktion 8: Rot Avdrags REVAMP förbättring

### Perplexity Pro Research Prompt:

```
Du är research-assistent för Frost Solutions, ett svenskt byggföretags mjukvaruprojekt.

FORSKNINGSÄMNE: Rot-avdrag (RUT/RUT-avdrag) för svenska byggföretag - Teknisk integration och förbättringar

KONTEKT:
- Vi har redan ett faktureringssystem för byggföretag
- Teknisk stack: Next.js 16, Supabase (PostgreSQL), TypeScript
- Vi behöver förbättra och fördjupa Rot-avdrag integrationen
- Vi vill ha mer exakt integration och undersöka hur det fungerar i detalj

VAD JAG BEHÖVER VETA:

1. **Rot-avdrag Grundläggande:**
   - Vad är Rot-avdrag (RUT/RUT-avdrag)?
   - Vilka typer av arbeten kvalificerar?
   - Vilka är kraven för kunder och företag?
   - Hur fungerar processen steg för steg?

2. **Teknisk Integration:**
   - Finns det officiella API:er från Skatteverket för Rot-avdrag?
   - Hur gör man elektronisk anmälan?
   - Vilka data behöver skickas (kundpersonnummer, fakturabelopp, arbetsbeskrivning)?
   - Hur verifierar man att en kund är berättigad?
   - Hur hanteras statusuppdateringar (godkänd, avvisad, väntande)?

3. **Database Schema:**
   - Vilka tabeller behövs för Rot-avdrag?
   - Vilka kolumner behöver lagras?
   - Hur länkar man Rot-avdrag till fakturor och projekt?
   - Hur hanterar man historik och revisionsspårning?

4. **Business Logic:**
   - När ska Rot-avdrag automatiskt föreslås?
   - Hur beräknas avdraget (procent, maxbelopp)?
   - Hur påverkar Rot-avdrag fakturering och bokföring?
   - Hur hanteras fakturor som delvis kvalificerar?

5. **UI/UX Förbättringar:**
   - Hur presenterar man Rot-avdrag för kunder?
   - Vilka fält behöver fyllas i?
   - Hur visar man status och framsteg?
   - Hur gör man det enkelt för användare?

6. **Integration med Befintliga System:**
   - Hur integrerar man Rot-avdrag med fakturering?
   - Hur påverkar det projektbudget och rapportering?
   - Hur synkas data med bokföringssystem (Fortnox/Visma)?

7. **Skatteverket Specifikt:**
   - Officiella dokumentationer och guider
   - API-dokumentation om den finns
   - Vanliga fel och hur man undviker dem
   - Tidsfrister och deadlines

8. **Best Practices:**
   - Hur gör andra byggföretag?
   - Vilka är vanliga problem?
   - Hur säkerställer man compliance?
   - Hur testar man integrationen?

FÖRVÄNTAT OUTPUT:
- Komplett guide för Rot-avdrag integration
- Database schema för Rot-avdrag tabeller
- API integration guide (om API finns)
- Business logic flow för Rot-avdrag process
- UI/UX recommendations
- Code examples för Next.js + Supabase
- Compliance checklist
- Vanliga pitfalls och lösningar
- Testning guide

Fokusera på praktiska, implementerbara lösningar som gör Rot-avdrag enkelt och automatiskt för användare.
```

---

## 🎯 Funktion 9: Implementera AI på alla hjälpsamma/relevanta sidor

### Perplexity Pro Research Prompt:

```
Du är research-assistent för Frost Solutions, ett svenskt byggföretags mjukvaruprojekt.

FORSKNINGSÄMNE: AI-assistenter och chatbots för byggföretags mjukvara - Implementation och best practices

KONTEKT:
- Vi har redan ett komplett byggföretags mjukvarusystem
- Teknisk stack: Next.js 16, Supabase (PostgreSQL), TypeScript, React
- Vi har redan AI-funktioner (AI-sammanfattning, budgetprediktion, offertgenerering)
- Vi vill lägga till AI-assistenter på alla relevanta sidor för att hjälpa användare

VAD JAG BEHÖVER VETA:

1. **AI Assistant Patterns:**
   - Vilka typer av AI-assistenter finns (chatbot, inline help, contextual suggestions)?
   - Vilka sidor/funktioner behöver AI-stöd?
   - Hur integrerar man AI-assistenter i befintliga UI-komponenter?
   - Best practices för AI UX i enterprise software?

2. **Teknisk Implementation:**
   - Hur bygger man en AI-chatbot i Next.js?
   - Vilka AI-tjänster är bäst (OpenAI, Anthropic, lokal model)?
   - Hur hanterar man context och conversation history?
   - Hur cachar man svar för att minska kostnader?
   - Hur integrerar man med Supabase för att hämta relevant data?

3. **Context-Aware AI:**
   - Hur gör man AI-assistenter context-aware (vet vilken sida användaren är på)?
   - Hur hämtar man relevant data från databasen för att ge bättre svar?
   - Hur strukturerar man prompts för olika sidor (projekt, fakturor, scheman)?
   - Hur hanterar man multi-tenant isolation i AI-svar?

4. **Sidor som Behöver AI:**
   - Projekt-sidor (hur skapar jag projekt, hur budgeterar jag?)
   - Fakturering (hur fakturerar jag, när ska jag fakturera?)
   - Schemaläggning (hur schemalägger jag effektivt?)
   - Arbetsorder (hur skapar jag arbetsorder, vad ska jag inkludera?)
   - Leverantörsfakturor (hur matchar jag fakturor till projekt?)
   - Rapporter (hur tolkar jag denna rapport?)
   - Inställningar (hur konfigurerar jag detta?)

5. **AI Features per Sida:**
   - Vad kan AI hjälpa till med på varje sida?
   - Vilka frågor kommer användare ställa?
   - Hur kan AI föreslå åtgärder baserat på data?
   - Hur kan AI förklara komplexa koncept?

6. **UI/UX för AI:**
   - Var placerar man AI-assistenter (floating button, sidebar, inline)?
   - Hur designar man AI-chat UI som passar vår design system?
   - Hur visar man att AI är "thinking"?
   - Hur hanterar man fel och timeout?
   - Hur gör man AI-svar actionable (knappar, länkar)?

7. **Cost Optimization:**
   - Hur minskar man AI API-kostnader?
   - Caching strategies för vanliga frågor
   - När ska man använda billigare modeller?
   - Hur begränsar man token usage?

8. **Privacy & Security:**
   - GDPR-kompatibilitet för AI-chat
   - Hur hanterar man känslig data i prompts?
   - Hur säkerställer man att AI inte läcker data mellan tenants?
   - Vilka data kan skickas till AI-tjänster?

9. **Implementation Architecture:**
   - Hur strukturerar man AI-service i Next.js?
   - API routes för AI-anrop
   - Database schema för conversation history
   - Real-time updates för AI-svar (streaming)

10. **Testing & Quality:**
    - Hur testar man AI-responses?
    - Hur säkerställer man att AI ger korrekta svar?
    - Hur hanterar man hallucinationer?
    - Fallback strategies om AI misslyckas

FÖRVÄNTAT OUTPUT:
- Komplett guide för AI-assistant implementation i Next.js
- Lista över alla sidor som behöver AI-stöd med specifika use cases
- Database schema för AI conversations och context
- Code examples för AI-chatbot komponenter
- Prompt templates för olika sidor och kontexter
- UI/UX recommendations för AI-assistenter
- Cost optimization strategies
- Security och privacy best practices
- Testing approach för AI-features
- Architecture diagram (text-baserat) för AI-integration

Fokusera på praktiska, implementerbara lösningar som gör AI-assistenter användbara och kostnadseffektiva.
```

---

## 📝 Ytterligare Information för AI Team

### Backend Implementation (GPT-5, Claude 4.5, Deepseek):
- Fokusera på API-integrationer, database schema, business logic
- Säkerställ multi-tenant isolation
- Implementera proper error handling och retry logic
- Optimera för performance och kostnad

### Frontend Implementation (Gemini 2.5, Claude 4.5):
- Skapa användarvänliga UI-komponenter
- Följ vårt design system (Tailwind CSS, Shadcn/ui)
- Säkerställ accessibility (WCAG)
- Implementera loading states och error handling

### Research (Perplexity Pro):
- Ge konkreta, implementerbara lösningar
- Inkludera code examples som matchar vår stack
- Fokusera på svenska specifika krav (GDPR, Skatteverket, etc.)
- Ta hänsyn till vår tech stack (Next.js 16, Supabase, TypeScript)

### Wildcard AIs (Kimi K2, Mistral AI):
- **Kimi K2**: Använd för långa research-dokument, komplexa analyser
- **Mistral AI**: Använd som alternativ till GPT-5 för kodgenerering, snabb prototyping

---

## ✅ Nästa Steg

1. **Kör Perplexity Pro prompts** ovan för att få research
2. **Dela research med backend AI:er** (GPT-5, Claude 4.5, Deepseek) för implementation
3. **Dela research med frontend AI:er** (Gemini 2.5, Claude 4.5) för UI-komponenter
4. **Använd Cursor Pro** för att integrera allt och göra final decisions
5. **Använd Kimi K2 eller Mistral AI** för specialiserade uppgifter om behövs

**Kom ihåg:** Du (Cursor Pro) har alltid final say på alla beslut! 🎯

