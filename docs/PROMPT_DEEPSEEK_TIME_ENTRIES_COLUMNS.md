# 🎯 PROMPT FÖR DEEPSEEK THINKING

## 🚨 KRITISKT PROBLEM: PAYROLL EXPORT KRASCHAR PÅ SAKNADE KOLUMNER

### Problembeskrivning

Efter implementering av robust kolumndetektering för `employees`-tabellen uppstår nu ett liknande problem med `time_entries`-tabellen. Export-funktionen försöker hämta kolumner som inte existerar i databasen, vilket leder till 500-fel.

### Specifikt fel

```
POST /api/payroll/periods/[id]/export → 500 Internal Server Error
Error: "column time_entries.ot_type does not exist"
```

### Teknisk kontext

- **Stack**: Next.js 16.0.1, Supabase (PostgreSQL), TypeScript
- **Problem**: Exporter-funktionerna (`fortnox.ts`, `visma.ts`) försöker SELECT:a kolumner som kan saknas:
  - `ot_type` (övertidstyp)
  - `allowance_code` (ersättningskod)
  - `absence_code` (frånvarokod)

### Nuvarande implementation

**`app/lib/payroll/exporters/fortnox.ts`** och **`app/lib/payroll/exporters/visma.ts`**:
```typescript
.select('id, employee_id, date, hours_total, ob_type, ot_type, allowance_code, absence_code')
```

Detta kraschar om någon av de sista tre kolumnerna saknas.

### Vad som redan är implementerat

1. ✅ Robust kolumndetektering för `employees` med RPC-funktion `get_existing_columns()`
2. ✅ Caching och mutex-skydd för kolumndetektering
3. ✅ Fallback-logik för saknade employee-kolumner
4. ✅ Format-funktioner (`paxml.ts`, `visma.ts`) som hanterar saknade kolumner

### Uppgift

**Skapa en robust lösning för dynamisk kolumndetektering av `time_entries`-kolumner**, liknande den som redan finns för `employees`, men **optimerad för export-prestanda**.

### Specifika krav

1. **Prestanda**: Kolumndetektering ska inte påverka export-hastigheten nämnvärt
2. **Robusthet**: Export ska lyckas även om alla optional-kolumner saknas
3. **Varningar**: Användare ska informeras om saknade kolumner via `warnings[]`
4. **Konsistens**: Använd samma pattern som `employeeColumns.ts` men optimera för time_entries

### Önskad output

1. **Kod-implementation** för dynamisk time_entry kolumndetektering
2. **Integration** i `fortnox.ts` och `visma.ts`
3. **Förklaring** av prestanda-optimeringar
4. **Test-steg** för att verifiera lösningen

### Bonus

Om du har idéer för att **cacha time_entry kolumner** på samma sätt som employee-kolumner (men med kortare TTL eftersom time_entries ändras oftare), inkludera det!

---

**Viktigt**: Lösningen ska vara kompatibel med befintlig kod och inte bryta export-funktionaliteten för användare som HAR alla kolumner.

