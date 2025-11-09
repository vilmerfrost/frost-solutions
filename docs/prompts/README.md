# 🚀 BACKEND DEVELOPER PROMPTS - FROST SOLUTIONS

## Översikt

Detta är optimerade prompts för 5 backend-utvecklare som implementerar OCR-baserat dokumenthanteringssystem för Frost Solutions.

**Projekt:** EDI Orderbekräftelse, OCR Fakturor & Förbättrat Formulärsystem  
**Datum:** November 2025  
**Research Dokument:** `frost_tre_funktioner_complete_guide.md`

---

## 📁 Filstruktur

```
docs/
├── BACKEND_DEVELOPER_PROMPTS.md          # Sammanfattning av alla prompts
├── RESEARCH_PROMPT_PRIORITY2_FEATURES.md # Original research prompt
├── IMPLEMENTATION_PLAN_PRIORITY2.md      # Implementation plan
└── prompts/
    ├── PROMPT_GPT5_API.md               # GPT-5: API Implementation
    ├── PROMPT_GEMINI_WORKFLOWS.md       # Gemini: Workflow Orchestration
    ├── PROMPT_CLAUDE_DATABASE.md        # Claude 4.5: Database Design
    ├── PROMPT_DEEPSEEK_ALGORITHMS.md    # Deepseek: Algorithms & Performance
    └── PROMPT_KIMI_TESTING.md           # Kimi K2: Testing & Validation
```

---

## 👥 Uppdelning av Arbete

| Utvecklare | Modell | Ansvar | Fil |
|------------|--------|--------|-----|
| **Developer 1** | GPT-5 | API Routes & Error Handling | `PROMPT_GPT5_API.md` |
| **Developer 2** | Gemini | Workflow Orchestration | `PROMPT_GEMINI_WORKFLOWS.md` |
| **Developer 3** | Claude 4.5 | Database Schema & Architecture | `PROMPT_CLAUDE_DATABASE.md` |
| **Developer 4** | Deepseek | Algorithms & Performance | `PROMPT_DEEPSEEK_ALGORITHMS.md` |
| **Developer 5** | Kimi K2 | Testing & Validation | `PROMPT_KIMI_TESTING.md` |

---

## 🎯 Varje Prompts Fokus

### 1. GPT-5: API Implementation
- ✅ Robust error handling
- ✅ Type safety (strict TypeScript)
- ✅ Production-ready API routes
- ✅ Retry logic och fallbacks
- ✅ Comprehensive logging

### 2. Gemini: Workflow Orchestration
- ✅ Integration mellan system
- ✅ Event-driven architecture
- ✅ Background job queues
- ✅ Google Cloud services
- ✅ Supabase Realtime

### 3. Claude 4.5: Database Design
- ✅ Complete schema design
- ✅ RLS policies för multi-tenant
- ✅ Database functions & triggers
- ✅ Indexes och performance
- ✅ Migration scripts

### 4. Deepseek: Algorithms & Performance
- ✅ Fuzzy matching optimization
- ✅ OCR parsing efficiency
- ✅ Caching strategies
- ✅ Performance metrics
- ✅ Algorithm improvements

### 5. Kimi K2: Testing & Validation
- ✅ Comprehensive test suite
- ✅ Edge cases & error scenarios
- ✅ Performance tests
- ✅ Security tests
- ✅ Swedish-specific validation

---

## 📋 Implementation Order

### Vecka 1: Foundation
1. **Claude 4.5** - Design database schema
2. **GPT-5** - Implementera API routes
3. **Deepseek** - Optimera algorithms

### Vecka 2: Integration
4. **Gemini** - Implementera workflows
5. **Kimi K2** - Skriv tests parallellt

### Vecka 3: Testing & Polish
6. **Kimi K2** - Complete test suite
7. **Alla** - Code review och integration
8. **Alla** - Bug fixes och optimering

---

## 🔗 Dependencies

```
Claude 4.5 (Database)
    ↓
GPT-5 (API Routes) ──→ Gemini (Workflows)
    ↓                        ↓
Deepseek (Algorithms) ──→ Kimi K2 (Tests)
```

---

## 📖 Användning

1. **Varje utvecklare** får sin specifika prompt-fil
2. **Läs research-dokumentet** först: `frost_tre_funktioner_complete_guide.md`
3. **Följ din prompt** och implementera enligt specifikationer
4. **Konsultera andra prompts** för integration points
5. **Commit ofta** med beskrivande commit messages

---

## ✅ Definition of Done

Varje komponent är klar när:
- ✅ Implementation enligt prompt-specifikation
- ✅ Code review godkänd
- ✅ Tests skrivna (Kimi K2)
- ✅ Tests passerar
- ✅ Dokumentation uppdaterad
- ✅ Integration med andra komponenter fungerar

---

## 🚨 Viktiga Noteringar

- **Multi-tenant:** Alla tables måste ha `tenant_id` och RLS policies
- **Error Handling:** Alla errors ska vara hanterade och loggade
- **Swedish Support:** Hantera åäö och svenska format (datum, belopp, etc.)
- **GDPR:** Följ GDPR-krav för dokumenthantering
- **Performance:** Target metrics finns i Deepseek-prompten

---

## 📞 Support

Om du har frågor:
1. Konsultera research-dokumentet
2. Kolla andra prompts för integration points
3. Fråga team lead om oklara specifikationer

---

**Lycka till med implementationen! 🚀**

