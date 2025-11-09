# 🎯 PROMPT FÖR KIMI K2

## 🔥 AKUT: TIME_ENTRIES KOLUMN-DETECTION FÖR PAYROLL EXPORT

### Situation

Payroll export-systemet har nu robust kolumndetektering för `employees`-tabellen, men **`time_entries`-tabellen saknar samma skydd**. När exporter försöker hämta optional-kolumner som `ot_type`, `allowance_code`, eller `absence_code` som inte finns i databasen → **500 Internal Server Error**.

### Felmeddelande

```
POST http://localhost:3000/api/payroll/periods/[id]/export
Status: 500
Response: {"success": false, "error": "column time_entries.ot_type does not exist"}
```

### Teknisk stack

- Next.js 16.0.1 (App Router)
- Supabase (PostgreSQL via PostgREST)
- TypeScript
- React Query för frontend state

### Nuvarande kod-struktur

**Exporter-funktioner** (`app/lib/payroll/exporters/fortnox.ts`, `visma.ts`):
```typescript
const { data: entries } = await admin
  .from('time_entries')
  .select('id, employee_id, date, hours_total, ob_type, ot_type, allowance_code, absence_code')
  .eq('tenant_id', tenantId)
```

**Format-funktioner** (`app/lib/payroll/formats/paxml.ts`, `visma.ts`):
- Använder `te.ot_type`, `te.allowance_code`, `te.absence_code` för att bestämma lönekoder
- Har redan null-checks men kolumnerna hämtas inte om de saknas → query failar

### Vad som redan fungerar

✅ `employeeColumns.ts` - Robust kolumndetektering med RPC + caching  
✅ `fetchEmployeesForPayroll()` - Dynamisk SELECT baserat på tillgängliga kolumner  
✅ Format-funktioner hanterar saknade fält (null-checks)

### Uppgift

**Skapa en lättvikts-lösning för time_entry kolumndetektering** som:

1. **Inte påverkar prestanda** - Export ska vara snabb även med kolumndetektering
2. **Använder samma RPC-funktion** - `get_existing_columns()` som redan finns
3. **Integrerar smidigt** - Minimal kod-ändring i exporter-funktionerna
4. **Ger tydliga varningar** - Användare ska veta vilka kolumner som saknas

### Specifika frågor att besvara

1. **Ska vi cacha time_entry kolumner?** (De ändras sällan, men mer ofta än employees)
2. **Ska vi använda samma RPC-funktion eller skapa en dedikerad?**
3. **Hur optimerar vi för export-prestanda?** (Många time_entries kan vara långsamma att probe:a)

### Önskad output

1. **Kod-implementation** med prestanda i fokus
2. **Förklaring** av prestanda-val
3. **Integration-guide** för exporter-funktionerna
4. **Benchmark-förslag** för att verifiera att prestanda inte påverkas

---

**Fokus**: Prestanda och minimal kod-ändring. Lösningen ska vara "set and forget" - en gång implementerad ska den fungera för alla framtida schema-ändringar.

