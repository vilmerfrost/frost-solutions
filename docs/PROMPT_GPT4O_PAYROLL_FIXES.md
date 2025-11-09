# 🐛 PAYROLL EXPORT: FRONTEND & STATE MANAGEMENT DEBUGGING - GPT-4o

## 🎯 UPPGIFT

Du ska hjälpa till att debugga och fixa frontend-problem i en payroll export-funktionalitet, med fokus på React Query, state management, och Next.js HMR-problem.

## 📋 PROBLEMBESKRIVNING

### Problem 1: HMR Error med Download-ikon
```
Module [project]/frost-demo/node_modules/lucide-react/dist/esm/icons/download.js [app-client] (ecmascript) 
<export default as Download> was instantiated because it was required from module 
[project]/frost-demo/app/components/payroll/ExportButton.tsx [app-client] (ecmascript), 
but the module factory is not available. It might have been deleted in an HMR update.
```

**Kontext:**
- `Download`-ikon har tagits bort från `ExportButton.tsx`
- Next.js 16.0.1 med Turbopack cache-problem
- Felet uppstår även i `ValidationIssues.tsx` som importeras av `ExportButton.tsx`
- Cache rensad men problemet kvarstår

**Nuvarande kod:**
```typescript
// app/components/payroll/ExportButton.tsx
'use client';
import { Upload, Loader2, AlertTriangle } from 'lucide-react'; // Download borttagen
```

**Försökta lösningar:**
- ✅ Tog bort `Download` från imports
- ✅ Rensat `.next` cache
- ✅ Lagt till explicit default export

### Problem 2: Period-skapande fungerar inte
- Användaren kan inte skapa nya löneperioder
- Inga specifika felmeddelanden
- React Query hook `useCreatePayrollPeriod` används

**Relevanta filer:**
- `app/components/payroll/PeriodForm.tsx` - Formulär med react-hook-form
- `app/hooks/usePayrollPeriods.ts` - React Query hooks
- `app/lib/api/payroll.ts` - API client

### Problem 3: Export fungerar inte
- Export-funktionaliteten fungerar inte
- React Query mutation `useExportPayrollPeriod` används
- Troligen relaterat till state management eller API-hantering

**Relevanta filer:**
- `app/components/payroll/ExportButton.tsx` - Export-knapp
- `app/hooks/usePayrollPeriods.ts` - React Query mutation
- `app/lib/api/payroll.ts` - API client för export

## 🔍 FRONTEND-FOKUS

### React Query
- Mutation-hantering för period-skapande och export
- Error handling och retry-logik
- State synchronization mellan komponenter

### Next.js HMR
- Turbopack cache-problem
- Modul-factory saknas efter import-borttagning
- Hot reload fungerar inte korrekt

### State Management
- Warning state i ExportButton
- Form state i PeriodForm
- Query invalidation efter mutationer

## 🛠️ NUVARANDE IMPLEMENTATION

### React Query Hooks
```typescript
// useCreatePayrollPeriod
export function useCreatePayrollPeriod() {
  return useMutation({
    mutationFn: async (payload) => await PayrollAPI.create(payload),
    onSuccess: (newPeriod) => {
      queryClient.invalidateQueries({ queryKey: ['payroll-periods'] });
      toast.success('Löneperiod skapad!');
    },
    onError: (error) => {
      toast.error(`Kunde inte skapa period: ${error.message}`);
    },
  });
}

// useExportPayrollPeriod
export function useExportPayrollPeriod(id: string) {
  return useMutation({
    mutationFn: async () => await PayrollAPI.export(id),
    retry: false, // Förhindra retry spam
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['payroll-periods', id] });
      toast.success('Export lyckades!');
      if (result.signedUrl) window.open(result.signedUrl, '_blank');
    },
    onError: (error) => {
      toast.error(`Export misslyckades: ${error.message}`);
    },
  });
}
```

## 📝 ÖNSKAD OUTPUT

1. **HMR-fix** - Lösning för Turbopack cache-problem
2. **React Query förbättringar** - Bättre error handling och state management
3. **Komponent-fixar** - Förbättra ExportButton och PeriodForm
4. **Debugging-steg** - Hur man identifierar problem i framtiden

## 🎯 SPECIFIKA FRÅGOR

1. **HMR-problem:**
   - Varför triggar Turbopack felet även efter att importen tagits bort?
   - Hur fixar man modul-factory problem i Next.js 16 + Turbopack?
   - Är det relaterat till hur komponenter importeras?

2. **Period-skapande:**
   - Varför fungerar inte React Query mutation?
   - Är det ett problem med form validation eller API-anrop?
   - Behöver vi förbättra error handling?

3. **Export:**
   - Varför fungerar inte export-mutation?
   - Är det ett problem med state synchronization?
   - Behöver vi förbättra warning-hantering?

## 🛠️ FÖRSLAG TILL LÖSNINGAR

### För HMR-problem:
- Använd dynamic imports för ikoner
- Lägg till explicit module boundaries
- Försök med `next/dynamic` för problematiska komponenter
- Verifiera att alla imports är korrekta

### För React Query:
- Lägg till omfattande logging i mutations
- Förbättra error handling med tydliga meddelanden
- Verifiera query invalidation fungerar korrekt
- Kolla att API-anrop returnerar korrekt format

### För State Management:
- Verifiera att state uppdateras korrekt efter mutationer
- Förbättra warning-hantering i ExportButton
- Säkerställ att form state resetas korrekt

---

**Viktigt:** Lösningarna ska vara kompatibla med Next.js 16.0.1, Turbopack, React Query, och react-hook-form. Alla ändringar ska vara bakåtkompatibla.

