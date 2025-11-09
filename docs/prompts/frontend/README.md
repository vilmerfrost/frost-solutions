# 🎨 FRONTEND DEVELOPER PROMPTS - FROST SOLUTIONS
## OCR Document Processing UI Implementation

**Projekt:** Frost Solutions - OCR Document Processing Frontend  
**Datum:** November 2025  
**Backend:** Se `BACKEND_DEVELOPER_PROMPTS.md` för API-dokumentation

---

## 📁 FILSTRUKTUR

```
docs/prompts/frontend/
├── PROMPT_GPT5_UI_COMPONENTS.md      # GPT-5: UI Components & Forms
├── PROMPT_GEMINI_WORKFLOWS.md        # Gemini: Workflow UI & Real-time
├── PROMPT_CLAUDE_UX.md               # Claude: UX Design & Accessibility
├── PROMPT_DEEPSEEK_PERFORMANCE.md    # Deepseek: Performance & Optimization
└── PROMPT_KIMI_TESTING.md           # Kimi: Frontend Testing
```

---

## 👥 UPPDELNING AV ARBETE

| Utvecklare | Modell | Ansvar | Fil |
|------------|--------|--------|-----|
| **Developer 1** | GPT-5 | UI Components & Forms | `PROMPT_GPT5_UI_COMPONENTS.md` |
| **Developer 2** | Gemini | Workflow UI & Real-time | `PROMPT_GEMINI_WORKFLOWS.md` |
| **Developer 3** | Claude | UX Design & Accessibility | `PROMPT_CLAUDE_UX.md` |
| **Developer 4** | Deepseek | Performance & Optimization | `PROMPT_DEEPSEEK_PERFORMANCE.md` |
| **Developer 5** | Kimi K2 | Frontend Testing | `PROMPT_KIMI_TESTING.md` |

---

## 🎯 VARJE PROMPTS FOKUS

### 1. GPT-5: UI Components & Forms
- ✅ React components för OCR upload
- ✅ Form components med validation
- ✅ File upload med drag-drop
- ✅ Progress indicators
- ✅ Error handling UI

### 2. Gemini: Workflow UI & Real-time
- ✅ Real-time status updates (Supabase Realtime)
- ✅ Workflow progress visualization
- ✅ Auto-fill forms från OCR data
- ✅ Notification system
- ✅ Live updates

### 3. Claude: UX Design & Accessibility
- ✅ Swedish language support
- ✅ Accessibility (WCAG 2.1)
- ✅ Mobile responsive design
- ✅ User feedback & error messages
- ✅ Loading states & skeletons

### 4. Deepseek: Performance & Optimization
- ✅ Code splitting & lazy loading
- ✅ Image optimization
- ✅ Virtual scrolling för lists
- ✅ Memoization & React optimization
- ✅ Bundle size optimization

### 5. Kimi K2: Frontend Testing
- ✅ Component tests (React Testing Library)
- ✅ E2E tests (Playwright)
- ✅ Visual regression tests
- ✅ Accessibility tests
- ✅ Performance tests

---

## 📋 IMPLEMENTATION ORDER

### Vecka 1: Foundation
1. **Claude** - Design system & accessibility
2. **GPT-5** - Core UI components
3. **Deepseek** - Performance optimization

### Vecka 2: Features
4. **Gemini** - Workflow UI & real-time
5. **Kimi K2** - Tests parallellt

### Vecka 3: Polish
6. **Alla** - Code review och integration
7. **Alla** - Bug fixes och optimering

---

## 🔗 API ENDPOINTS

### Delivery Notes
- `POST /api/delivery-notes/process` - Upload och processera följesedel
- `GET /api/delivery-notes` - Lista följesedlar
- `GET /api/delivery-notes/[id]` - Hämta specifik följesedel

### Supplier Invoices
- `POST /api/supplier-invoices/process` - Upload och processera faktura
- `GET /api/supplier-invoices` - Lista fakturor
- `GET /api/supplier-invoices/[id]` - Hämta specifik faktura
- `POST /api/supplier-invoices/[id]/approve` - Godkänn faktura

### Forms
- `GET /api/form-templates` - Lista form templates
- `POST /api/form-submissions` - Skicka formulär
- `GET /api/form-submissions/[id]` - Hämta submission

---

## ✅ DEFINITION OF DONE

Varje komponent är klar när:
- ✅ Implementation enligt prompt-specifikation
- ✅ Code review godkänd
- ✅ Tests skrivna (Kimi K2)
- ✅ Tests passerar
- ✅ Accessibility verified (Claude)
- ✅ Performance targets met (Deepseek)
- ✅ Integration med backend fungerar

---

**Lycka till med frontend-implementationen! 🚀**

