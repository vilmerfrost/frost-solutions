# Prompt för Claude 4.5 Sonnet: Dashboard Syncing Problem

## Problem
Next.js 16 + Supabase-applikation där dashboarden visar **0 timmar trots data i databasen** och vi ser **403 Forbidden-fel** från direkta Supabase REST-anrop i webbläsaren.

## Teknisk Stack
- Next.js 16 (Turbopack), React 18, TypeScript
- Supabase (PostgreSQL med RLS)
- TanStack Query med localStorage persistence
- Multi-tenancy (UUID-baserad tenant_id)

## Vad vi redan gjort
1. ✅ Skapat RPC-funktion `get_tenant_dashboard_analytics` (SECURITY DEFINER)
2. ✅ Uppdaterat `/api/analytics/dashboard` att använda RPC + service-role
3. ✅ Lagt till guard i `supabaseClient.ts` som kastar fel i dev om `supabase.from('time_entries')` används
4. ✅ Uppdaterat `TimeClock.tsx` att använda API-routes istället för direkta DB-anrop

## Symptom

### 1. Dashboard visar 0 timmar
- API returnerar: `{ totalHours: 0, activeProjects: 0 }`
- Men SQL direkt: `SELECT SUM(hours_total) FROM time_entries WHERE tenant_id = '...'` ger **13 timmar**

### 2. 403-fel i konsolen
```
GET .../rest/v1/time_entries?select=hours_total&date=gte.2025-10-31&tenant_id=eq.8ee28f55... 403 (Forbidden)
```
Detta betyder att någon komponent fortfarande gör direkta Supabase-anrop från webbläsaren.

### 3. Syncing fungerar inte
- Dashboard uppdateras inte när TimeClock stämplar in/ut
- Data synkas inte mellan komponenter

## Misstänkta problem

### Problem A: RPC returnerar 0
**Möjliga orsaker:**
- `hours_total` är i sekunder, men vi dividerar med 3600 (korrekt för timmar)
- Datumfiltrering fungerar inte: `date >= p_start_date::date` vs `date >= p_start_date`
- `getTenantId()` returnerar fel värde eller `null`

**Behöver:**
- SQL-frågor för att testa RPC direkt
- Logging i API-routen för att se vad RPC returnerar
- Verifiering att `getTenantId()` returnerar korrekt UUID

### Problem B: 403-fel kommer från okänd källa
**Vi har guard, men ser fortfarande 403-fel.**

**Behöver:**
- Metod för att spåra exakt vilken komponent/hook som gör anropet (stack trace)
- Lista över alla komponenter som kan göra direkta Supabase-anrop
- Strategi för att permanent blockera alla client-side DB-anrop

### Problem C: React Query cache är stale
**Cache visar gamla värden (0 timmar).**

**Behöver:**
- Strategi för att invalidera cache när data ändras
- Bättre event-baserad synkronisering mellan komponenter

## Specifika frågor

1. **Varför returnerar RPC 0 trots data?**
   - Är `hours_total` i sekunder eller timmar?
   - Fungerar datumfiltreringen?
   - Körs RPC med rätt tenant_id?

2. **Var kommer 403-felen från?**
   - Vilken komponent gör anropet?
   - Varför fångar inte guard:en det?
   - Hur blockerar vi alla client-side anrop permanent?

3. **Varför synkar inte data?**
   - Hur invaliderar vi React Query cache korrekt?
   - Hur synkar vi mellan komponenter utan onödiga API-anrop?

## Önskad output

Ge oss:
1. **Konkreta kod-fixar** för varje problem
2. **SQL-frågor** för att testa RPC direkt
3. **Logging-strategi** för att spåra problem
4. **Test-checklista** för att verifiera att allt fungerar

**Fokusera på praktiska, körbara lösningar!** 🚀

