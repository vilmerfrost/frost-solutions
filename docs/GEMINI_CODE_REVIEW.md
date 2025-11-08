# Gemini Frontend Code Review - Problem & Fixes

## 🔴 KRITISKA PROBLEM

### 1. **Saknade Dependencies**
- ❌ `date-fns` - Används men inte installerat
- ❌ `react-hook-form` - Används men inte installerat
- ✅ `@tanstack/react-query` - Finns
- ✅ `sonner` - Finns
- ✅ `lucide-react` - Finns

**Fix:** Använd native Date API eller installera dependencies. Använd native forms eller installera react-hook-form.

### 2. **Saknade UI Components**
- ❌ `app/components/ui/` mapp finns inte
- ❌ `Button`, `Input`, `Dialog`, `Select`, `Table`, `Badge`, `Skeleton`, `DropdownMenu`, `Checkbox`, `Textarea` saknas

**Fix:** Skapa enkla wrapper-komponenter eller använd native HTML elements med Tailwind.

### 3. **Fel API Response Format**
- ❌ Gemini förväntar sig `data.data` men backend returnerar `{ success: true, data }`
- ❌ API client hanterar inte `success` field korrekt

**Fix:** Uppdatera API client att hantera både format.

### 4. **Fel API Endpoints**
- ❌ `PUT /api/quotes/${quoteId}/items/${itemId}` - Backend har bara `PUT /api/quotes/${quoteId}/items` med body.id
- ❌ `DELETE /api/quotes/${quoteId}/items/${itemId}` - Backend har bara `DELETE /api/quotes/${quoteId}/items` med body.id
- ❌ Send quote API tar bara `{ to }` men Gemini skickar `{ email, subject, body }`

**Fix:** Uppdatera hooks att matcha backend API.

### 5. **Fel Imports**
- ❌ `useTenant` från `@/app/hooks/useTenant` - Ska vara `@/context/TenantContext`
- ❌ `extractErrorMessage` från `@/app/lib/api` - Redan finns i `@/lib/errorUtils`
- ❌ `useClients` och `useProjects` simulerade - Redan finns riktiga hooks

**Fix:** Uppdatera alla imports.

### 6. **Saknade Types**
- ❌ `QuoteItem` type saknas i detail page komponent
- ❌ Vissa komponenter saknar imports

**Fix:** Lägg till alla imports.

### 7. **React Hook Form Issues**
- ❌ Använder `useFormContext` men RHF inte installerat
- ❌ `useFieldArray` kräver RHF

**Fix:** Använd native forms eller installera RHF.

### 8. **Date Formatting**
- ❌ Använder `date-fns` med `sv` locale men inte installerat

**Fix:** Använd native `toLocaleDateString` eller installera date-fns.

---

## ✅ VAD SOM ÄR BRA

1. ✅ Struktur är bra - tydlig separation av concerns
2. ✅ React Query hooks är korrekt implementerade
3. ✅ Error handling är konsekvent
4. ✅ TypeScript types är bra definierade
5. ✅ Komponentstruktur är logisk

---

## 🔧 REKOMMENDATIONER

### Alternativ 1: Installera Dependencies (Rekommenderat)
```bash
npm install react-hook-form date-fns
```

### Alternativ 2: Använd Native Forms (Snabbare)
- Ersätt React Hook Form med native forms
- Ersätt date-fns med native Date API
- Skapa enkla UI wrapper-komponenter

### Alternativ 3: Be en annan AI (Om Gemini är för dålig)
- **Claude 4.5** - Bättre på att följa existerande kodbas
- **GPT-5** - Bättre på att skapa kompletta komponenter
- **Cursor Composer** - Bäst på att integrera med befintlig kod

---

## 📋 FIXES SOM MÅSTE GÖRAS

1. **API Client** - Fixa response format handling
2. **Hooks** - Fixa API endpoints (items PUT/DELETE)
3. **Imports** - Fixa alla felaktiga imports
4. **Forms** - Välj: RHF eller native forms
5. **UI Components** - Skapa eller använd native HTML
6. **Date Formatting** - Välj: date-fns eller native
7. **Send Quote** - Fixa payload format

---

## 🎯 SLUTSATS

Geminis kod är **strukturellt bra** men har **många integration-problem** med befintlig kodbas. 

**Rekommendation:** 
- Fixa alla kritiska problem ovan
- Eller be **Claude 4.5** eller **GPT-5** att göra en ny implementation som bättre matchar kodbasen

**Vill du att jag:**
1. Fixar alla problem och implementerar koden?
2. Skapar en ny prompt för Claude/GPT?
3. Installerar dependencies och fixar koden?

