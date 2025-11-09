# Prompt 1: Claude 4.5 - Deep Analysis & Root Cause

Du är Claude 4.5 och agerar senior fullstack-utvecklare med expertis i Next.js 16, Supabase, React Query och PostgreSQL.

## Problembeskrivning

Vi har ett kritiskt problem i en Next.js 16-applikation med Supabase backend:

**Symptom:** När admin klickar på "Godkänn alla" tidsrapporter:
1. ✅ API-endpoint `/api/time-entries/approve-all` körs och returnerar success
2. ✅ Frontend visar toast "Alla tidsrapporter godkändes"
3. ❌ Efter 2-3 sekunder (när data refetchas) visar alla tidsrapporter fortfarande status "Ej godkänd"

**Teknisk stack:**
- Next.js 16 App Router
- Supabase (PostgreSQL) med RLS
- React Query för data fetching
- Offline sync system (localStorage + IndexedDB)

**Vad vi redan har implementerat:**
1. ✅ SQL migration som lägger till `approval_status`, `approved_at`, `approved_by` kolumner
2. ✅ API endpoint `/api/time-entries/approve-all` som uppdaterar dessa kolumner
3. ✅ API endpoint `/api/time-entries/list` som hämtar entries med approval-kolumner
4. ✅ Frontend som visar approval-status baserat på `approval_status` kolumnen
5. ✅ Offline sync som strippar approval-fält när syncing
6. ✅ SQL trigger som förhindrar regression från approved → pending

**Kod-struktur:**

`app/api/time-entries/approve-all/route.ts`:
- Använder `context.adminSupabase` (service role)
- Uppdaterar `approval_status = 'approved'`, `approved_at`, `approved_by`
- Filtrerar med `.neq('approval_status', 'approved')` för att bara uppdatera ej godkända
- Returnerar `{ success: true, updated: count, data: [...] }`

`app/api/time-entries/list/route.ts`:
- Använder `getTimeEntryColumnSet()` för att detektera kolumner
- Försöker alltid inkludera `approval_status`, `approved_at`, `approved_by` i SELECT
- Returnerar entries med dessa kolumner

`app/reports/page.tsx`:
- Hämtar data via `/api/time-entries/list`
- Visar status baserat på `isEntryApproved()` funktion som kollar `approval_status === 'approved'`
- Refetchar efter godkännande via `setRefreshTrigger`

**Misstänkta orsaker:**
1. Supabase cache/RLS som returnerar gammal data
2. Race condition där refetch händer innan commit är klar
3. Offline sync som skriver över statusen efter godkännande
4. List-API:et som inte faktiskt returnerar `approval_status` trots att vi försöker
5. Frontend som inte mappar `approval_status` korrekt från API-svaret

**Vad jag behöver:**
1. Systematisk felsökningsmetod för att identifiera exakt var i flödet statusen tappas
2. Konkreta kodändringar för att fixa problemet
3. Verifieringssteg för att bekräfta att fixen fungerar

**Begränsningar:**
- Kan inte ändra Supabase schema (migrationen är redan körda)
- Måste använda service role client för admin-operationer
- Offline sync måste fungera utan att skriva över approval-status

Ge mig en detaljerad analys med konkreta kodändringar och en steg-för-steg felsökningsplan.

