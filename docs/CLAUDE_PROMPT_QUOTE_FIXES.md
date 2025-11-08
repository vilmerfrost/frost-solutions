# Claude 4.5 Prompt - Quote System Frontend Fixes

Du är en expert på Next.js 16 App Router, React, TypeScript och Supabase. Du ska hjälpa mig fixa några problem med Quote-systemet i en Frost Solutions-app.

## Problem att lösa:

### 1. Hydration Mismatch Error
- **Fel:** Server och client renderar olika HTML för sidebar navigation items
- **Orsak:** Klasser `flex-shrink-0` och `truncate` läggs till client-side men inte server-side
- **Nuvarande lösning:** Använder `isMounted` state för att lägga till klasserna efter mount
- **Problem:** Detta löser inte hydration mismatch helt eftersom server fortfarande renderar utan klasserna
- **Önskad lösning:** Fixa så att server och client renderar identiskt HTML, eller använd `suppressHydrationWarning` på rätt sätt

### 2. "Lägg till Artiklar" syns inte tydligt
- **Nuvarande:** Knappen finns i `QuoteItemsEditor` komponenten
- **Problem:** Användaren kan inte hitta den eller den syns inte när den ska
- **Önskad lösning:** Gör knappen mer synlig och tydlig, eller lägg till en guide/placeholder när inga artiklar finns

### 3. API Route Error Handling
- **Nuvarande:** GET `/api/quotes/[id]` hämtar data separat (quote, items, customer, project)
- **Problem:** Om någon query misslyckas kan det ge otydliga felmeddelanden
- **Önskad lösning:** Förbättra felhantering och loggning för att göra debugging enklare

## Teknisk kontext:

- **Framework:** Next.js 16 med App Router
- **Styling:** Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **State Management:** React Query (@tanstack/react-query)
- **TypeScript:** Strikt typing

## Filer att fokusera på:

1. `app/components/SidebarClient.tsx` - Fix hydration mismatch
2. `app/components/quotes/QuoteItemsEditor.tsx` - Förbättra synlighet för "Lägg till artikel"
3. `app/api/quotes/[id]/route.ts` - Förbättra felhantering

## Krav:

- Lösningar ska vara production-ready
- Inga breaking changes
- Behåll befintlig funktionalitet
- Använd TypeScript strikt
- Följ Next.js 16 best practices
- Använd Tailwind CSS för styling

## Önskad output:

1. Fixad `SidebarClient.tsx` utan hydration mismatch
2. Förbättrad `QuoteItemsEditor.tsx` med tydligare "Lägg till artikel" funktionalitet
3. Förbättrad felhantering i API route med bättre loggning

Ge mig komplett kod för alla tre filerna med förklaringar av ändringarna.

