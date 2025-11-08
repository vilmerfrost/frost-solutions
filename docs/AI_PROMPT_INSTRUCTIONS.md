# 📋 INSTRUKTIONER: Använda AI-Prompts för Syncing-Problem

## 📁 Filer skapade

1. **`docs/AI_PROMPT_SYNCING_PROBLEM.md`** - Omfattande prompt för alla AI-modeller
2. **`docs/CLAUDE_PROMPT.md`** - Fokuserad prompt för Claude 4.5 Sonnet
3. **`docs/QUICK_PROMPT.md`** - Kort prompt för GitHub Copilot och snabba svar

---

## 🎯 Hur du använder prompts

### För Claude 4.5 Sonnet
1. Öppna Claude 4.5 Sonnet
2. Kopiera innehållet från `docs/CLAUDE_PROMPT.md`
3. Lägg till relevant kod om Claude ber om det (t.ex. `app/api/analytics/dashboard/route.ts`, `app/lib/serverTenant.ts`)

### För ChatGPT (GPT-4/GPT-5)
1. Öppna ChatGPT
2. Kopiera innehållet från `docs/AI_PROMPT_SYNCING_PROBLEM.md`
3. Bifoga relevanta filer om ChatGPT ber om det

### För Gemini 2.5
1. Öppna Gemini
2. Kopiera innehållet från `docs/AI_PROMPT_SYNCING_PROBLEM.md`
3. Bifoga relevanta filer om Gemini ber om det

### För Grok AI
1. Öppna Grok
2. Kopiera innehållet från `docs/AI_PROMPT_SYNCING_PROBLEM.md`
3. Bifoga relevanta filer om Grok ber om det

### För GitHub Copilot (Browser)
1. Öppna GitHub Copilot Browser
2. Kopiera innehållet från `docs/QUICK_PROMPT.md`
3. Bifoga relevanta filer om Copilot ber om det

---

## 📝 Ytterligare information att bifoga (om AI-modellen ber om det)

### Viktiga filer att bifoga:
1. `app/api/analytics/dashboard/route.ts` - Huvud-API-route
2. `app/lib/serverTenant.ts` - Tenant-hämtning
3. `app/utils/supabase/admin.ts` - Admin client
4. `app/utils/supabase/supabaseClient.ts` - Client med guard
5. `app/components/TimeClock.tsx` - TimeClock-komponenten
6. `app/dashboard/DashboardClient.tsx` - Dashboard-komponenten
7. `app/hooks/useDashboardAnalytics.ts` - React Query hook
8. `sql/20251107_time_entries_rls_and_rpc.sql` - RPC-funktion

### Konsol-loggar att bifoga:
- Kopiera 403-fel från webbläsarens konsol
- Kopiera API-respons från `/api/analytics/dashboard`
- Kopiera SQL-resultat från Supabase SQL Editor

---

## 🎯 Vad vi förväntar oss från AI-modellerna

### 1. Hitta alla källor till 403-felen
- Exakt vilken komponent/hook som gör anropet
- Varför guard:en inte fångar det
- Strategi för att permanent blockera alla client-side anrop

### 2. Fixa RPC-funktionen
- Varför returnerar den 0 trots data?
- SQL-frågor för att testa RPC direkt
- Logging-strategi för att spåra problem

### 3. Fixa syncing
- Hur invaliderar vi React Query cache korrekt?
- Hur synkar vi mellan komponenter utan onödiga API-anrop?

### 4. Förbättra guard-implementationen
- Bättre guard som fångar ALLA anrop
- ESLint-regel eller TypeScript-typ som förhindrar direkta anrop

---

## ✅ Nästa steg efter att ha fått svar

1. **Samla alla svar** från AI-modellerna i en fil
2. **Jämför lösningar** och välj de bästa
3. **Implementera ändringar** baserat på rekommendationerna
4. **Testa** att allt fungerar (ingen 403, korrekta timmar, syncing fungerar)
5. **Uppdatera dokumentation** med lösningen

---

## 🚀 Lycka till!

Om du behöver hjälp med att implementera lösningarna efter att ha fått svar från AI-modellerna, säg bara till! 🙏

