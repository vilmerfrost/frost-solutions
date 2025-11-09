# 🔍 PAYROLL EXPORT: FULLSTACK DEBUGGING - CLAUDE 4.5

## 🎯 UPPGIFT

Du ska hjälpa till att debugga och fixa kritiska problem i en payroll export-funktionalitet som stoppat fungera efter en större refaktorering. Problemen är komplexa och kräver fullstack-analys.

## 📋 PROBLEMBESKRIVNING

### Problem 1: HMR Error (Next.js/Turbopack)
```
Module [project]/frost-demo/node_modules/lucide-react/dist/esm/icons/download.js [app-client] (ecmascript) 
<export default as Download> was instantiated because it was required from module 
[project]/frost-demo/app/components/payroll/ExportButton.tsx [app-client] (ecmascript), 
but the module factory is not available. It might have been deleted in an HMR update.
```

**Kontext:**
- `Download`-ikon har tagits bort från `ExportButton.tsx`
- Next.js 16.0.1 med Turbopack cache-problem
- Felet uppstår även i `ValidationIssues.tsx` som inte importerar Download
- Cache rensad men problemet kvarstår

**Nuvarande kod:**
```typescript
// app/components/payroll/ExportButton.tsx
'use client';
import { Upload, Loader2, AlertTriangle } from 'lucide-react'; // Download borttagen
```

### Problem 2: Period-skapande fungerar inte
- Användaren kan inte skapa nya löneperioder
- Inga specifika felmeddelanden
- Funktionaliteten fungerar helt enkelt inte

**Relevanta filer:**
- `app/lib/payroll/periods.ts` - `createPeriod()` funktion
- `app/api/payroll/periods/route.ts` - API route
- `app/components/payroll/PeriodForm.tsx` - Formulär
- `app/hooks/usePayrollPeriods.ts` - React Query hook

### Problem 3: Export fungerar inte
- Export-funktionaliteten fungerar inte
- Troligen relaterat till ny kolumndetektering

**Relevanta filer:**
- `app/lib/payroll/employeeColumns.ts` - Kolumndetektering med RPC
- `app/lib/payroll/exporters/helpers.ts` - Använder kolumndetektering
- `app/lib/payroll/exporters/fortnox.ts` - Fortnox exporter
- `app/lib/payroll/exporters/visma.ts` - Visma exporter
- `sql/migrations/20251108_1200_get_existing_columns_rpc.sql` - RPC-funktion

## 🔍 TEKNISK ANALYS BEHÖVS

### 1. HMR-problem
- Varför triggar Turbopack felet även efter att importen tagits bort?
- Är det ett cache-problem eller strukturellt problem?
- Hur påverkar `ValidationIssues.tsx` som importeras av `ExportButton.tsx`?

### 2. Period-skapande
- Vilka är de vanligaste orsakerna till att period-skapande misslyckas?
- Är det relaterat till den nya kolumndetekteringen?
- Behöver vi lägga till mer felhantering?

### 3. Export-funktionalitet
- Fungerar RPC-anropet `get_existing_columns` korrekt?
- Är det något problem med hur vi hanterar saknade kolumner?
- Behöver vi förbättra fallback-logiken?

## 🛠️ IMPLEMENTERAD LÖSNING (FÖR REFERENS)

### Kolumndetektering
1. **RPC-funktion** `public.get_existing_columns()` för kolumndetektering
2. **Caching** med 5 minuters TTL och mutex-skydd
3. **Fallback** till progressiv probing om RPC misslyckas
4. **Minimal query** som sista utväg

### Frontend
- React Query hooks med `retry: false` för export
- Bättre warning-hantering i UI
- ExportButton visar varningar tydligt

## 📝 ÖNSKAD OUTPUT

1. **Root cause analysis** för varje problem
2. **Konkreta kod-fixar** med förklaringar
3. **Förbättringar** för att förhindra liknande problem
4. **Test-steg** för att verifiera fixarna

## 🎯 FOKUSOMRÅDEN

### Prioritet 1: HMR-problem
- Analysera Turbopack cache-mekanismer
- Identifiera varför modul-factory saknas
- Lösning som fungerar med Next.js 16 + Turbopack

### Prioritet 2: Period-skapande
- Fullstack-analys av skapande-flödet
- Identifiera var det går fel
- Förbättra felhantering och logging

### Prioritet 3: Export-funktionalitet
- Verifiera RPC-funktion fungerar korrekt
- Förbättra kolumndetektering och fallback
- Säkerställ att exporter får korrekt data

---

**Viktigt:** Lösningarna ska vara kompatibla med Next.js 16.0.1, Turbopack, Supabase, och React Query. Alla ändringar ska vara bakåtkompatibla.

