# 🎯 PROMPT FÖR COPILOT PRO

## 💡 PAYROLL EXPORT: TIME_ENTRIES KOLUMN-DETECTION PATTERN

### Kontext

Vi har redan implementerat robust kolumndetektering för `employees`-tabellen i payroll export-systemet. Nu behöver vi **samma pattern för `time_entries`-tabellen** för att förhindra export-krascher när optional-kolumner saknas.

### Problem

Export-funktionerna (`fortnox.ts`, `visma.ts`) försöker SELECT:a kolumner som kan saknas:
- `ot_type` (övertidstyp)
- `allowance_code` (ersättningskod)  
- `absence_code` (frånvarokod)

När dessa saknas → **500 Internal Server Error** → Export misslyckas.

### Befintlig lösning (för referens)

**`app/lib/payroll/employeeColumns.ts`**:
- Använder RPC-funktion `get_existing_columns()` för kolumndetektering
- Caching med 5 minuters TTL
- Mutex-skydd för samtidiga detekteringar
- Fallback till progressiv probing om RPC misslyckas

**`app/lib/payroll/exporters/helpers.ts`**:
- `fetchEmployeesForPayroll()` använder dynamisk SELECT
- Genererar varningar för saknade kolumner

### Uppgift

**Skapa en liknande men optimerad lösning för `time_entries`-kolumner**:

1. **Återanvänd RPC-funktionen** - `get_existing_columns()` kan användas för både employees och time_entries
2. **Lägg till helper-funktion** - `fetchTimeEntriesForPayroll()` som använder dynamisk SELECT
3. **Integrera i exporter** - Uppdatera `fortnox.ts` och `visma.ts` att använda helper-funktionen
4. **Behåll format-logik** - Format-funktionerna behöver inte ändras (de hanterar redan null)

### Specifika krav

- **Konsistens**: Använd samma pattern som `employeeColumns.ts`
- **Prestanda**: Time entries kan vara många → optimera för stora dataset
- **Varningar**: Lägg till varningar i `warningList` när kolumner saknas
- **Type safety**: Behåll TypeScript-typer

### Önskad output

1. **Helper-funktion** `fetchTimeEntriesForPayroll()` i `helpers.ts`
2. **Uppdaterade exporter** (`fortnox.ts`, `visma.ts`)
3. **Type-definitioner** för time entry rows
4. **Test-exempel** för att verifiera funktionalitet

---

**Fokus**: Konsistens med befintlig kod och TypeScript type safety. Lösningen ska kännas som en naturlig del av den befintliga koden.

