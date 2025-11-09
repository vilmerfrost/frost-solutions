# 🎯 PROMPT FÖR CHATGPT 5 (UPPDATERAD)

## 🔧 PAYROLL EXPORT: TIME_ENTRIES KOLUMN-DETECTION - DATABAS-FOKUS

### Problem

Efter att ha implementerat robust kolumndetektering för `employees`-tabellen med RPC-funktionen `get_existing_columns()`, behöver vi nu **samma robusthet för `time_entries`-tabellen**.

### Specifikt fel

```
Error: column time_entries.ot_type does not exist
Status: 500 Internal Server Error
```

### Databas-kontext

- **PostgreSQL** via Supabase PostgREST
- **RPC-funktion** `public.get_existing_columns(p_table_schema, p_table_name, p_candidates)` finns redan
- **Time entries** kan vara många (tusentals) → query-prestanda är viktig
- **Optional-kolumner**: `ot_type`, `allowance_code`, `absence_code`

### Nuvarande SELECT-query

```typescript
.select('id, employee_id, date, hours_total, ob_type, ot_type, allowance_code, absence_code')
```

Detta kraschar om någon optional-kolumn saknas.

### Uppgift

**Använd RPC-funktionen för att dynamiskt detektera time_entry kolumner**:

1. **Anropa RPC** med `p_table_name = 'time_entries'` och `p_candidates = ['ot_type', 'allowance_code', 'absence_code']`
2. **Bygg dynamisk SELECT** baserat på resultatet
3. **Cacha resultatet** (time entry schema ändras sällan)
4. **Integrera i exporter** (`fortnox.ts`, `visma.ts`)

### Databas-optimering

- **Använd RPC istället för probing** - RPC är snabbare och mer pålitlig
- **Cacha i minst 10 minuter** - Schema ändras sällan
- **Hantera RPC-fel gracefully** - Fallback till minimal SELECT om RPC misslyckas

### Önskad output

1. **Helper-funktion** som använder RPC för time_entry kolumner
2. **SQL-verifiering** - Test-queries för att verifiera RPC fungerar
3. **Integration-kod** för exporter
4. **Error handling** för RPC-fel

---

**Fokus**: Databas-optimering och RPC-användning. Lösningen ska vara robust och snabb genom att utnyttja PostgreSQL's `information_schema` effektivt.

