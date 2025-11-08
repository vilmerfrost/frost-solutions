# Snabb Prompt: Dashboard Syncing Problem

## Problem
Next.js 16 + Supabase: Dashboard visar **0 timmar** trots data i DB. Ser **403-fel** från direkta Supabase-anrop i webbläsaren.

## Stack
- Next.js 16, React 18, TypeScript
- Supabase (RLS aktiverat)
- TanStack Query + localStorage persistence

## Redan gjort
1. ✅ RPC `get_tenant_dashboard_analytics` (SECURITY DEFINER)
2. ✅ API `/api/analytics/dashboard` använder RPC + service-role
3. ✅ Guard i `supabaseClient.ts` blockerar `supabase.from('time_entries')` i dev
4. ✅ `TimeClock.tsx` använder API-routes

## Symptom
- Dashboard: `totalHours: 0` (ska vara 13h)
- Konsol: `403 Forbidden` från `.../rest/v1/time_entries`
- Syncing: Dashboard uppdateras inte när TimeClock stämplar

## Frågor
1. Varför returnerar RPC 0? (SQL ger 13h)
2. Var kommer 403-felen från? (guard fångar inte allt)
3. Varför synkar inte React Query cache?

## Behöver
- Konkreta kod-fixar
- SQL för att testa RPC
- Logging-strategi
- Test-checklista

**Ge praktiska, körbara lösningar!**

