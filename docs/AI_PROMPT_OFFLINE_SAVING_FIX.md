# Prompt för AI: Fixa offline-sparande av tidsrapporter

## Problembeskrivning

Jag har en Next.js 16-applikation med Supabase som backend. Användaren rapporterar att offline-sparande av tidsrapporter inte fungerar korrekt. Trots att jag har implementerat en offline queue med localStorage, får användaren fortfarande felmeddelandet "Ingen internetanslutning. Du kan inte spara tidsrapporter offline. Försök igen när du är online." även när de är online.

## Teknisk kontext

- **Framework:** Next.js 16 (Turbopack)
- **Backend:** Supabase (PostgreSQL med RLS)
- **State management:** React Query (TanStack Query)
- **Offline storage:** localStorage (IndexedDB finns också men används för work_orders)
- **Komponent:** `app/reports/new/page.tsx` - formulär för att skapa nya tidsrapporter

## Nuvarande implementation

### Offline Queue (`app/lib/offline/timeEntriesQueue.ts`)
- Sparar time entries i localStorage med nyckel `frost:offline_time_entries`
- Funktioner: `addToOfflineQueue()`, `getPendingTimeEntries()`, `syncPendingTimeEntries()`
- Synkar automatiskt när användaren kommer online igen

### handleSubmit-funktion (`app/reports/new/page.tsx`)
- Kontrollerar `isOnline` state (boolean | null)
- Om offline (`isOnline === false`): Sparar till offline queue via `saveOffline()`
- Om online: Försöker spara direkt via `/api/time-entries/create`, fallback till offline queue vid fel
- Visar toast-meddelanden: "Tidsrapport sparad offline och synkas när du är online igen!"

### Online-detection
```typescript
const [isOnline, setIsOnline] = useState<boolean | null>(null)

useEffect(() => {
  if (typeof window === 'undefined') {
    setIsOnline(true)
    return
  }
  
  const initialOnline = navigator.onLine
  setIsOnline(initialOnline)
  
  const handleOnline = () => setIsOnline(true)
  const handleOffline = () => setIsOnline(false)
  
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
  
  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
}, [tenantId])
```

## Problem

1. **Användaren får felmeddelande även när online:** Meddelandet "Du kan inte spara tidsrapporter offline" visas trots att användaren är online
2. **isOnline kan vara null:** Vid första render kan `isOnline` vara `null`, vilket kan orsaka problem
3. **Cached kod:** Next.js kan ha cached gammal kod i `.next` mappen som fortfarande innehåller den gamla offline-guarden

## Vad jag behöver hjälp med

1. **Identifiera var felet kommer ifrån:**
   - Finns det någon gammal guard som blockerar sparande?
   - Är `isOnline` state korrekt uppdaterad?
   - Kommer felet från TimeClock-komponenten eller från reports/new-sidan?

2. **Fixa offline-sparande:**
   - Säkerställ att `handleSubmit` aldrig blockerar sparande (bara sparar offline om nödvändigt)
   - Hantera `isOnline === null` korrekt (antag online som default)
   - Lägg till bättre error handling och logging

3. **Förbättra synkning:**
   - Säkerställ att synkning triggas korrekt när användaren kommer online
   - Lägg till retry-logik för misslyckade synkningar
   - Visa tydlig feedback om synkningsstatus

## Filer att granska

- `frost-demo/app/reports/new/page.tsx` - Huvudkomponenten för att skapa tidsrapporter
- `frost-demo/app/lib/offline/timeEntriesQueue.ts` - Offline queue implementation
- `frost-demo/app/components/TimeClock.tsx` - TimeClock-komponenten (kan också ha offline-guards)
- `frost-demo/app/api/time-entries/create/route.ts` - API endpoint för att skapa time entries

## Ytterligare kontext

- Användaren kan navigera mellan sidor offline utan problem
- Problemet uppstår specifikt när man försöker spara en tidsrapport
- Felet visas även när användaren är online (enligt användaren)
- Det kan vara cached kod i `.next` mappen som orsakar problemet

## Önskat resultat

1. Användaren ska kunna spara tidsrapporter offline utan felmeddelanden
2. Tidsrapporter ska sparas i localStorage när offline
3. Automatisk synkning när användaren kommer online igen
4. Tydlig feedback om synkningsstatus
5. Ingen blocking av sparande - alltid tillåt spara (offline eller online)

## Test-scenarier att verifiera

1. **Online:** Spara tidsrapport → ska sparas direkt till servern
2. **Offline:** Spara tidsrapport → ska sparas till localStorage, visa toast "sparad offline"
3. **Offline → Online:** Kom online igen → ska automatiskt synka pending entries
4. **Online men API felar:** Spara tidsrapport → ska fallback till offline queue
5. **isOnline === null:** Vid första render → ska antaga online och tillåta sparande

## Ytterligare tips

- Kolla om det finns några guards i TimeClock-komponenten som kan påverka
- Verifiera att localStorage fungerar korrekt (kan vara disabled i vissa browsers)
- Lägg till console.log för att debugga `isOnline` state
- Rensa `.next` cache om det finns cached kod
- Kontrollera om det finns några globala error handlers som kan fånga upp fel

---

**Vänligen analysera koden och ge konkreta förslag på fixar med kod-exempel.**

