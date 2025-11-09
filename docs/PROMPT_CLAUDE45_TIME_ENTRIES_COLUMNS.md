# 🎯 PROMPT FÖR CLAUDE 4.5 (UPPDATERAD)

## 🔍 PAYROLL EXPORT: FULLSTACK ANALYS AV TIME_ENTRIES KOLUMN-DETECTION

### Problem

Payroll export-systemet har nu robust kolumndetektering för `employees`, men `time_entries` saknar samma skydd. När exporter försöker hämta optional-kolumner som inte finns → **500 Internal Server Error**.

### Root cause analysis behövs

1. **Varför kraschar det här?** - Är det PostgREST som validerar kolumner innan query körs?
2. **Varför fungerar format-funktionerna inte?** - De har null-checks men queryn failar innan data når dem
3. **Hur påverkar detta prestanda?** - Time entries kan vara många, behöver vi optimera?

### Teknisk stack

- Next.js 16.0.1 App Router
- Supabase PostgREST (PostgreSQL)
- TypeScript
- Befintlig RPC: `get_existing_columns(p_table_schema, p_table_name, p_candidates)`

### Befintlig implementation (för referens)

**`app/lib/payroll/employeeColumns.ts`**:
- RPC-baserad detektering med caching
- Mutex-skydd för race conditions
- Fallback till progressiv probing
- Minimal fallback om allt misslyckas

**`app/lib/payroll/exporters/helpers.ts`**:
- `fetchEmployeesForPayroll()` använder dynamisk SELECT
- Genererar varningar för saknade kolumner

### Uppgift

**Skapa en komplett fullstack-lösning** som:

1. **Återanvänder RPC-funktionen** - Samma `get_existing_columns()` för time_entries
2. **Integrerar i exporter** - Uppdatera `fortnox.ts` och `visma.ts`
3. **Förbättrar error handling** - Tydliga felmeddelanden om kolumndetektering misslyckar
4. **Optimiserar prestanda** - Caching-strategi för time_entry kolumner

### Specifika analyser behövs

- **PostgREST behavior**: Validerar PostgREST kolumner innan query körs?
- **Caching-strategi**: Ska time_entry kolumner cachas längre/shorter än employee-kolumner?
- **Error propagation**: Hur bubblar vi upp kolumn-fel till användaren?

### Önskad output

1. **Root cause analysis** - Varför queryn failar innan format-funktionerna når data
2. **Komplett implementation** - Backend + frontend-fixar
3. **Prestanda-analys** - Hur påverkar detta export-hastighet?
4. **Error handling-strategi** - Tydliga felmeddelanden för alla edge cases

---

**Fokus**: Fullstack-analys och robusthet. Lösningen ska hantera alla edge cases och ge tydlig feedback till både utvecklare och användare.

