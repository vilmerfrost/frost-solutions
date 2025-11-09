# 🎯 PROMPT FÖR GPT-4o (UPPDATERAD)

## 🎨 PAYROLL EXPORT: FRONTEND & UX-FOKUS FÖR TIME_ENTRIES KOLUMNER

### Problem

Payroll export kraschar när `time_entries`-tabellen saknar optional-kolumner. Vi behöver **bättre UX och felhantering** när kolumner saknas, inte bara backend-fixar.

### Nuvarande UX-problem

- ❌ Export misslyckas helt om en kolumn saknas
- ❌ Användaren får generiskt felmeddelande "500 Internal Server Error"
- ❌ Ingen indikation om vilka kolumner som saknas eller varför

### Teknisk kontext

- **Backend**: Exporter (`fortnox.ts`, `visma.ts`) försöker SELECT:a saknade kolumner
- **Frontend**: `ExportButton.tsx` visar generiska fel
- **Format-funktioner**: Redan hanterar null-värden, men queryn failar innan data når format-funktionerna

### Uppgift

**Förbättra UX genom att**:

1. **Hantera saknade kolumner gracefully** - Export ska lyckas med varningar, inte krascha
2. **Visa tydliga varningar** - Användare ska se exakt vilka kolumner som saknas
3. **Förbättra error messages** - Specifika meddelanden istället för generiska 500-fel
4. **Optimistisk UI** - Visa loading state medan kolumndetektering pågår

### Specifika UX-förbättringar

- **Warning toast** när kolumner saknas: "Export lyckades, men övertidsinformation saknas p.g.a. saknade kolumner"
- **Detaljerad varning-lista** i `ValidationIssues`-komponenten
- **Progress indicator** för kolumndetektering (om det tar tid)

### Önskad output

1. **Backend-fix** - Dynamisk kolumndetektering för time_entries
2. **Frontend-förbättringar** - Bättre error/warning-hantering i `ExportButton`
3. **UX-patterns** - Hur vi visar varningar på ett användarvänligt sätt
4. **Error message-exempel** - Specifika meddelanden för olika scenarion

---

**Fokus**: Användarupplevelse och tydlig kommunikation. Lösningen ska göra det uppenbart för användaren vad som saknas och varför exporten ändå lyckades.

