# 🎯 AI-FÖRDELNING: FORTNOX/VISMA BOKFÖRINGSINTEGRATION

## 📋 ÖVERSIKT

Vi ska implementera komplett Fortnox/Visma integration för auto-sync fakturor och kunder. Här är fördelningen av AI:er mellan backend och frontend.

---

## 🔧 BACKEND-FOKUSERADE AI:ER (4 st)

### 1. **Claude 4.5** ⭐ (Fullstack - Både Backend & Frontend)
**Fokus**: Fullstack-analys, OAuth implementation, sync architecture
**Uppgifter**:
- Designa komplett OAuth 2.0 flow för Fortnox/Visma
- Implementera API clients med robust error handling
- Designa sync architecture med conflict resolution
- Implementera background jobs för auto-sync
- Root cause analysis av sync-problem

**Varför Claude 4.5**: 
- ✅ Bäst på fullstack-analys (bevisat i tidigare uppgifter)
- ✅ Omfattande logging och error handling
- ✅ Bra på arkitektur-design

---

### 2. **ChatGPT 5** 🔧
**Fokus**: API integration, OAuth implementation, data mapping
**Uppgifter**:
- Implementera Fortnox API client med TypeScript
- Implementera Visma API client med TypeScript
- OAuth 2.0 token management och refresh
- Data mapping mellan Frost Solutions ↔ Fortnox/Visma
- Error handling och retry strategies

**Varför ChatGPT 5**:
- ✅ Mycket bra på API-integrationer (bevisat i payroll export)
- ✅ Praktisk och direkt användbar kod
- ✅ Bra på OAuth flows

---

### 3. **Gemini 2.5** 🏗️
**Fokus**: Sync architecture, conflict resolution, scalability
**Uppgifter**:
- Designa sync-strategi för bidirectional sync
- Implementera conflict resolution logic
- Designa queue system för reliable sync
- Incremental sync strategies
- Database schema för integrations och sync jobs

**Varför Gemini 2.5**:
- ✅ Bäst på arkitektur och long-term solutions
- ✅ Bra på schema evolution och maintainability
- ✅ Tänker på edge cases och scalability

---

### 4. **Deepseek Thinking** ⚡
**Fokus**: Performance optimization, rate limiting, background jobs
**Uppgifter**:
- Optimera sync-prestanda för stora datasets
- Implementera rate limiting strategies
- Background job optimization
- Batch processing för bulk sync
- Caching strategies för API calls

**Varför Deepseek**:
- ✅ Bra på prestanda-optimering
- ✅ Praktiska lösningar för production
- ✅ Bra på batch processing

---

## 🎨 FRONTEND-FOKUSERADE AI:ER (4 st)

### 1. **GPT-4o** 💅
**Fokus**: UX design, connection flow, sync status UI
**Uppgifter**:
- Designa OAuth connection flow UI
- Implementera sync status indicators
- Error message design och user feedback
- Manual sync button och controls
- Loading states och progress indicators

**Varför GPT-4o**:
- ✅ Bäst på UX och frontend (bevisat i tidigare uppgifter)
- ✅ Bra på användarupplevelse
- ✅ Tydlig kommunikation med användare

---

### 2. **Claude 4.5** ⭐ (Fullstack - Både Backend & Frontend)
**Fokus**: Frontend integration, React Query hooks, error handling
**Uppgifter**:
- Implementera React Query hooks för sync operations
- Frontend error handling och retry logic
- Integration med backend API routes
- Real-time sync status updates
- Form validation för integration settings

**Varför Claude 4.5**:
- ✅ Fullstack-perspektiv (ser både backend och frontend)
- ✅ Bra på React Query patterns
- ✅ Omfattande error handling

---

### 3. **Gemini 2.5** 🎯 (Kan vara båda)
**Fokus**: Settings UI architecture, component structure
**Uppgifter**:
- Designa integrations settings page architecture
- Component structure för sync management
- State management för sync status
- Form handling för integration configuration
- Accessibility och responsive design

**Varför Gemini 2.5**:
- ✅ Bra på arkitektur även på frontend
- ✅ Tänker på maintainability
- ✅ Future-proof solutions

---

### 4. **Copilot Pro** 🔄
**Fokus**: Consistency, TypeScript types, component patterns
**Uppgifter**:
- TypeScript types för integration data
- Konsistent component patterns med resten av appen
- Reusable components för sync status
- Form components för integration settings
- Integration med befintlig design system

**Varför Copilot Pro**:
- ✅ Bra på konsistens med befintlig kod
- ✅ Type safety
- ✅ Följer etablerade patterns

---

## 📊 SAMMANFATTNING

### Backend Team (4 AI:er)
1. **Claude 4.5** - Fullstack-analys, OAuth, sync architecture
2. **ChatGPT 5** - API clients, OAuth, data mapping
3. **Gemini 2.5** - Sync architecture, conflict resolution
4. **Deepseek** - Performance, rate limiting, background jobs

### Frontend Team (4 AI:er)
1. **GPT-4o** - UX design, connection flow, sync status UI
2. **Claude 4.5** - React Query hooks, frontend integration
3. **Gemini 2.5** - Settings UI architecture, component structure
4. **Copilot Pro** - Consistency, TypeScript types, patterns

### Överlappande AI:er
- **Claude 4.5**: Både backend OCH frontend (fullstack)
- **Gemini 2.5**: Kan hjälpa både backend (arkitektur) och frontend (UI-struktur)

---

## 🎯 IMPLEMENTERINGSORDNING

### Steg 1: Research (Perplexity Pro)
- ✅ Research Fortnox/Visma API documentation
- ✅ Research OAuth flows
- ✅ Research best practices

### Steg 2: Backend Implementation
1. **Claude 4.5**: Designa sync architecture
2. **ChatGPT 5**: Implementera API clients
3. **Gemini 2.5**: Implementera sync logic
4. **Deepseek**: Optimera prestanda

### Steg 3: Frontend Implementation
1. **GPT-4o**: Designa UX och connection flow
2. **Claude 4.5**: Implementera React Query hooks
3. **Gemini 2.5**: Bygga settings UI
4. **Copilot Pro**: Säkerställa konsistens

---

## 📝 PROMPT-TEMPLATES

Varje AI får en unik prompt som fokuserar på deras specifika styrkor och uppgifter. Prompts kommer att skapas efter Perplexity research är klar.

