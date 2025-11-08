# Claude 4.5 Prompt: Fix Quote System Issues & Add Missing Features

## Problembeskrivning

Jag har ett Next.js 16 + Supabase + TypeScript-projekt med ett offertsystem som har flera problem som behöver fixas:

### 1. Hydration Mismatch Error (KRITISKT)
**Fel:** Hydration mismatch i `SidebarClient.tsx` och `QuoteFilters.tsx`

**Detaljer:**
- Server-renderad HTML har `className="text-xl"` men client förväntar sig `className="text-xl flex-shrink-0"`
- Server-renderad HTML har `className="block text-sm font-medium text-gray-700 mb-1"` men client förväntar sig `className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"`
- Detta händer i både `navItems` och `adminNavItems` i SidebarClient
- Detta händer också i `QuoteFilters` komponenten där `Select` och `Input` komponenter används

**Kod som orsakar problemet:**
- `app/components/SidebarClient.tsx` - navItems och adminNavItems rendering
- `app/components/quotes/QuoteFilters.tsx` - använder Select och Input komponenter
- `app/components/ui/select.tsx` och `app/components/ui/input.tsx` - har uppdaterade default-klasser men används med className override

**Lösning behövs:**
- Säkerställ att alla spans i SidebarClient har `flex-shrink-0` och `truncate` konsekvent
- Säkerställ att Select och Input komponenter renderas identiskt på server och client
- Ta bort className-overrides som kan orsaka mismatch

### 2. AI Quote Generation Error
**Fel:** "AI service failed" när man försöker generera offert via AI

**Detaljer:**
- API-routen `/api/quotes/ai-generate` försöker anropa `/api/ai/summarize` med type 'quote-generation'
- `/api/ai/summarize` stöder inte 'quote-generation' typen och returnerar fel
- Detta gör att hela AI-genereringen misslyckas

**Nuvarande kod:**
```typescript
// app/api/quotes/ai-generate/route.ts
const aiResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ai/summarize`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    resourceType: 'quote',
    type: 'quote-generation',
    data: { prompt, context },
  }),
})
```

**Lösning behövs:**
- Antingen: Lägg till stöd för 'quote-generation' i `/api/ai/summarize`
- Eller: Skapa en dedikerad AI-rout för offert-generering
- Eller: Använd en enklare lösning som inte kräver extern AI-tjänst (fallback)

### 3. Materialdatabas-sida saknas
**Problem:** Det finns ingen sida för att hantera material i databasen

**Nuvarande situation:**
- Det finns en `materials` tabell i databasen (från SQL migration)
- Det finns en `MaterialPicker` komponent som används i offerter
- Det finns en `useMaterials` hook
- Men det finns INGEN sida `/materials` för att skapa/redigera/ta bort material

**Behövs:**
- En sida `/materials` för att lista alla material
- CRUD-funktionalitet (Create, Read, Update, Delete)
- API routes för materials CRUD
- Premium UI som matchar resten av appen

**Tabellstruktur (från SQL):**
```sql
create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  sku text,
  name text not null,
  category text,
  unit text not null default 'st',
  price numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, sku)
);
```

### 4. KMA-sida saknas
**Problem:** Användaren frågar om KMA ska ha en egen vy/sida

**Nuvarande situation:**
- KMA (Kostnads- & Miljöanalys) finns som en checkbox i offert-formuläret
- Det finns en `kma_enabled` boolean i quotes-tabellen
- Men det finns ingen dedikerad sida för att hantera KMA-analyser

**Behövs:**
- En sida `/kma` eller `/quotes/kma` för att hantera KMA-analyser
- Lista offerter med KMA aktiverat
- Möjlighet att skapa/redigera KMA-analyser
- Koppling till offerter

**Förslag:**
- Skapa en `/kma` sida som visar alla offerter med `kma_enabled = true`
- Möjlighet att skapa KMA-analys för en offert
- Formulär för att fylla i kostnads- och miljödata

## Teknisk Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth med tenant isolation
- **Styling:** Tailwind CSS med dark mode
- **State Management:** React Query (@tanstack/react-query)
- **TypeScript:** Strikt typing

## Viktiga Filer

### SidebarClient.tsx
```typescript
// app/components/SidebarClient.tsx
const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊', gradient: 'from-pink-500 to-purple-600' },
  // ... fler items
]

// Rendering:
{navItems.map((item) => {
  return (
    <button>
      <span className="text-xl flex-shrink-0">{item.icon}</span>
      <span className="truncate">{item.name}</span>
    </button>
  )
})}
```

### QuoteFilters.tsx
```typescript
// app/components/quotes/QuoteFilters.tsx
<Select
  label="Status"
  value={filters.status || ''}
  onChange={...}
  className="bg-white dark:bg-gray-800"
>
```

### Input/Select Components
```typescript
// app/components/ui/input.tsx och select.tsx
// Har nyligen uppdaterats med nya default-klasser:
className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-700..."
```

## Önskad Lösning

### 1. Fix Hydration Mismatch
- Säkerställ att ALLA spans i SidebarClient har exakt samma klasser på server och client
- Ta bort className-overrides från QuoteFilters som kan orsaka mismatch
- Använd `suppressHydrationWarning` endast som sista utväg, föredra att fixa root cause

### 2. Fix AI Generation
- Skapa en enkel lösning som fungerar direkt
- Antingen: Lägg till stöd i `/api/ai/summarize` för 'quote-generation'
- Eller: Använd en fallback-lösning som inte kräver extern AI
- Säkerställ att offerten skapas korrekt även om AI-svaret är enkelt

### 3. Skapa Materialdatabas-sida
- Skapa `/app/materials/page.tsx` - lista alla material
- Skapa `/app/materials/new/page.tsx` - skapa nytt material
- Skapa `/app/materials/[id]/edit/page.tsx` - redigera material
- Skapa API routes:
  - `GET /api/materials` - lista material
  - `POST /api/materials` - skapa material
  - `PUT /api/materials/[id]` - uppdatera material
  - `DELETE /api/materials/[id]` - ta bort material
- Lägg till länk i SidebarClient: `{ name: 'Materialdatabas', href: '/materials', icon: '📦', gradient: '...' }`
- Premium UI som matchar resten av appen

### 4. Skapa KMA-sida
- Skapa `/app/kma/page.tsx` - lista offerter med KMA aktiverat
- Visa KMA-status och länkar till offerter
- Möjlighet att aktivera/deaktivera KMA för offerter
- Premium UI som matchar resten av appen

## Krav

1. **Alla ändringar måste vara kompatibla med Next.js 16 App Router**
2. **Alla API routes måste använda `getTenantId()` för tenant isolation**
3. **Alla komponenter måste ha dark mode support**
4. **Premium UI/UX som matchar resten av appen (gradients, shadows, etc.)**
5. **TypeScript strikt typing**
6. **Error handling med `extractErrorMessage`**
7. **React Query för data fetching**

## Test Cases

### Hydration Fix
- [ ] Inga hydration warnings i console när man navigerar till `/quotes`
- [ ] Sidebar renderas korrekt på alla sidor
- [ ] QuoteFilters renderas korrekt utan warnings

### AI Generation Fix
- [ ] AI-generering fungerar utan fel
- [ ] Offert skapas korrekt med AI-data
- [ ] Användaren kan navigera till den skapade offerten

### Materialdatabas
- [ ] `/materials` sida visar lista över material
- [ ] Kan skapa nytt material
- [ ] Kan redigera befintligt material
- [ ] Kan ta bort material
- [ ] Material visas i MaterialPicker när man skapar offert

### KMA-sida
- [ ] `/kma` sida visar offerter med KMA aktiverat
- [ ] Kan aktivera/deaktivera KMA för offerter
- [ ] UI är premium och matchar resten av appen

## Ytterligare Kontext

- Projektet använder Supabase med RLS (Row Level Security)
- Alla queries måste inkludera `tenant_id` för säkerhet
- Det finns redan hooks som `useMaterials`, `useClients`, `useProjects` som kan användas
- Det finns redan UI-komponenter som `Button`, `Input`, `Select` som kan användas
- Det finns redan en `Sidebar` komponent som wrappar `SidebarClient`

## Prioritering

1. **HÖGST:** Fixa hydration mismatch (blockerar användning)
2. **HÖG:** Fixa AI-generering (användare kan inte använda funktionen)
3. **MEDEL:** Skapa materialdatabas-sida (användare behöver denna funktionalitet)
4. **MEDEL:** Skapa KMA-sida (användare frågade om denna)

---

**Ge mig komplett, produktionsklar kod för alla dessa problem!** 🚀

