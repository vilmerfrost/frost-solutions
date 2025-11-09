# 🎯 PROMPT FÖR GEMINI 2.5

## 🧠 PAYROLL EXPORT: SCHEMA EVOLUTION & BACKWARD COMPATIBILITY

### Problem-analys behövs

Payroll export-systemet kraschar när `time_entries`-tabellen saknar optional-kolumner (`ot_type`, `allowance_code`, `absence_code`). Vi har redan löst detta för `employees`-tabellen, men behöver nu **samma robusthet för `time_entries`**.

### Filosofiska frågor

1. **Schema evolution**: Hur hanterar vi att databas-schemat kan variera mellan miljöer?
2. **Backward compatibility**: Hur säkerställer vi att gamla exports fortsätter fungera när nya kolumner läggs till?
3. **Performance vs robustness**: Var är balansen mellan prestanda och robusthet?

### Teknisk kontext

- **Befintlig lösning**: `employeeColumns.ts` med RPC + caching + fallback
- **Problem**: Time entries kan vara många (tusentals) → kolumndetektering måste vara snabb
- **Constraint**: Exporter måste fungera även om alla optional-kolumner saknas

### Uppgift

**Analysera och föreslå en lösning som balanserar**:

1. **Schema-flexibilitet** - Hantera varierande scheman mellan miljöer
2. **Prestanda** - Snabb export även med kolumndetektering
3. **Maintainability** - Enkel att underhålla och utöka
4. **User experience** - Tydliga varningar när kolumner saknas

### Specifika frågor

- **Ska vi cacha time_entry kolumner separat eller tillsammans med employees?**
- **Hur hanterar vi schema-ändringar under runtime?** (t.ex. migration körs medan export pågår)
- **Vad är bästa pattern för att hantera "partial schema" i TypeScript?**

### Önskad output

1. **Arkitektur-analys** - Varför denna lösning är bäst
2. **Implementation** - Kod med förklaringar
3. **Edge cases** - Hur hanterar vi schema-ändringar under export?
4. **Framtida utökningar** - Hur gör vi det enkelt att lägga till nya optional-kolumner?

---

**Fokus**: Djup analys och långsiktig maintainability. Lösningen ska vara "future-proof" och hantera schema-evolution elegant.

