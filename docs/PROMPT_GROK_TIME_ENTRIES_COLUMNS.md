# 🎯 PROMPT FÖR GROK 4

## ⚡ PAYROLL EXPORT: PERFORMANCE-OPTIMERAD KOLUMN-DETECTION

### Problem

Payroll export kraschar när `time_entries.ot_type` (och andra optional-kolumner) saknas. Vi behöver **snabbt och effektivt** detektera vilka kolumner som finns innan vi kör SELECT-queryn.

### Nuvarande situation

- ✅ `employees` har robust kolumndetektering med RPC + caching
- ❌ `time_entries` har hårdkodad SELECT som kraschar på saknade kolumner
- ⚠️ Time entries kan vara **många** (tusentals rader) → prestanda är kritisk

### Teknisk stack

- Next.js 16.0.1 App Router
- Supabase (PostgreSQL) med PostgREST
- TypeScript
- RPC-funktion `get_existing_columns()` redan implementerad

### Uppgift

**Skapa en PERFORMANCE-OPTIMERAD lösning** som:

1. **Återanvänder RPC-funktionen** - `get_existing_columns('public', 'time_entries', [...])`
2. **Cachar aggressivt** - Time entry schema ändras sällan
3. **Minimerar round-trips** - En RPC-anrop, inte progressiv probing
4. **Integrerar smidigt** - Minimal kod-ändring i exporter

### Prestanda-krav

- Kolumndetektering ska ta < 100ms (RPC är snabb)
- Export av 1000 time entries ska inte påverkas nämnvärt
- Caching ska vara aggressiv (10+ minuter TTL)

### Önskad output

1. **Optimerad helper-funktion** med fokus på prestanda
2. **Benchmark-data** eller prestanda-beräkningar
3. **Integration-kod** för exporter
4. **Förklaring** av prestanda-val

---

**Fokus**: Prestanda och snabbhet. Lösningen ska vara så snabb att användaren inte märker kolumndetekteringen.

