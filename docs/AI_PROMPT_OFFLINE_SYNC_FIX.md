# Prompt för Claude 4.5: Fixa offline-synkning av tidsrapporter

## Problembeskrivning

Jag har en Next.js 16-applikation med Supabase som backend. Användaren kan spara tidsrapporter offline (det fungerar!), men när de går online igen synkas inte de sparade tidsrapporterna automatiskt till servern. Användaren säger att det står att tidsrapporten sparas, men den synkas inte när de går online.

## Teknisk kontext

- **Framework:** Next.js 16 (Turbopack)
- **Backend:** Supabase (PostgreSQL med RLS)
- **Offline storage:** localStorage för offline queue
- **Komponent:** `app/reports/new/page.tsx` - formulär för att skapa nya tidsrapporter
- **Queue:** `app/lib/offline/timeEntriesQueue.ts` - hanterar offline queue och synkning

## Nuvarande implementation

### Offline Queue (`app/lib/offline/timeEntriesQueue.ts`)

- `addToOfflineQueue()` - Sparar time entries i localStorage med nyckel `frost:offline_time_entries`
- `getPendingTimeEntries()` - Hämtar alla osynkade entries
- `syncPendingTimeEntries(tenantId)` - Synkar alla pending entries till `/api/time-entries/create`
- `markAsSynced()` - Markerar entry som synkad
- `removeFromOfflineQueue()` - Tar bort entry efter synkning

### Online Event Listener (`app/reports/new/page.tsx`)

```typescript
useEffect(() => {
  const handleOnline = async () => {
    if (!tenantId) {
      console.warn('⚠️ Cannot sync: tenantId is missing')
      return
    }

    const pending = getPendingTimeEntries()
    if (pending.length === 0) {
      console.log('✅ No pending entries to sync')
      setPendingCount(0)
      return
    }

    console.log(`🔄 Syncing ${pending.length} pending time entries...`)
    const result = await syncPendingTimeEntries(tenantId)
    
    if (result.synced > 0) {
      toast.success(`${result.synced} tidsrapporter synkade!`)
    }
    if (result.failed > 0) {
      toast.error(`${result.failed} tidsrapporter kunde inte synkas.`)
    }
    
    setPendingCount(getPendingTimeEntries().length)
  }

  // Sync immediately if online and we have pending entries
  if (isOnline === true && tenantId) {
    const pending = getPendingTimeEntries()
    if (pending.length > 0) {
      handleOnline()
    }
  }

  // Listen for online events
  window.addEventListener('online', handleOnline)
  return () => window.removeEventListener('online', handleOnline)
}, [isOnline, tenantId])
```

### Sync Function (`app/lib/offline/timeEntriesQueue.ts`)

```typescript
export async function syncPendingTimeEntries(tenantId: string | null | undefined): Promise<{ synced: number; failed: number }> {
  if (!tenantId) {
    console.warn('⚠️ Cannot sync: tenantId is missing')
    return { synced: 0, failed: 0 }
  }

  const pending = getPendingTimeEntries()
  if (pending.length === 0) {
    return { synced: 0, failed: 0 }
  }

  let synced = 0
  let failed = 0

  for (const entry of pending) {
    try {
      const payload = {
        tenant_id: entry.tenant_id || tenantId,
        employee_id: entry.employee_id,
        project_id: entry.project_id,
        date: entry.date,
        start_time: entry.start_time,
        end_time: entry.end_time,
        hours_total: entry.hours_total,
        ob_type: entry.ob_type,
        amount_total: entry.amount_total,
        is_billed: entry.is_billed,
        break_minutes: entry.break_minutes,
        comment: entry.comment,
        work_type: entry.work_type,
      }

      const response = await fetch('/api/time-entries/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const responseData = await response.json()

      if (response.ok && !responseData.error) {
        markAsSynced(entry.id)
        setTimeout(() => removeFromOfflineQueue(entry.id), 1000)
        synced++
      } else {
        console.error('Failed to sync:', responseData.error)
        failed++
      }
    } catch (error) {
      console.error('Error syncing:', error)
      failed++
    }
  }

  return { synced, failed }
}
```

## Problemet

Trots att implementationen ser korrekt ut, så synkas inte tidsrapporterna när användaren går online. Möjliga orsaker:

1. **Online event triggas inte:** `window.addEventListener('online')` kanske inte triggas korrekt
2. **tenantId saknas:** `tenantId` kanske är null när synkningen försöker köras
3. **API-anrop misslyckas:** `/api/time-entries/create` kanske returnerar fel som inte hanteras korrekt
4. **Timing-problem:** Synkningen kanske körs innan nätverket är helt redo
5. **localStorage-problem:** Entries kanske inte sparas korrekt eller läses fel

## Vad jag behöver hjälp med

1. **Debugging och logging:**
   - Lägg till omfattande logging för att se vad som händer
   - Verifiera att online event faktiskt triggas
   - Kontrollera att entries finns i localStorage
   - Verifiera att API-anrop görs och vad de returnerar

2. **Förbättra synkning:**
   - Säkerställ att synkningen väntar på att nätverket är redo
   - Lägg till retry-logik för misslyckade synkningar
   - Förbättra error handling
   - Lägg till progress feedback

3. **Verifiera data:**
   - Kontrollera att offline entries har alla nödvändiga fält
   - Verifiera att tenantId finns i entries
   - Säkerställ att API payload är korrekt formaterad

## Filer att granska

- `frost-demo/app/reports/new/page.tsx` - Online event listener (rad ~110-134)
- `frost-demo/app/lib/offline/timeEntriesQueue.ts` - Sync funktion (rad ~114-164)
- `frost-demo/app/api/time-entries/create/route.ts` - API endpoint för att skapa entries

## Ytterligare kontext

- Offline-sparande fungerar perfekt
- Problemet är specifikt synkningen när användaren går online
- Användaren säger att det står "sparad" men synkas inte
- Detta tyder på att entries sparas i localStorage men synkningen inte körs eller misslyckas

## Önskat resultat

1. När användaren går online ska alla pending entries automatiskt synkas
2. Tydlig feedback om synkningsstatus (success/error)
3. Retry-logik för misslyckade synkningar
4. Omfattande logging för debugging

## Test-scenarier att verifiera

1. **Offline → Online:** Spara tidsrapport offline → gå online → ska automatiskt synkas
2. **Multiple entries:** Spara flera tidsrapporter offline → gå online → alla ska synkas
3. **API error:** Om API returnerar fel → ska visa tydligt felmeddelande
4. **Network delay:** Om nätverket är långsamt → ska vänta och försöka igen

## Ytterligare tips

- `navigator.onLine` kan vara opålitligt - överväg att testa med faktiska fetch-anrop
- Lägg till en manuell "Synka nu"-knapp som fallback
- Överväg att använda Background Sync API (service worker) för mer robust synkning
- Verifiera att `tenantId` är tillgänglig när synkningen körs
- Lägg till debouncing för online events (de kan triggas flera gånger)

---

**Vänligen analysera koden och ge konkreta förslag på fixar med kod-exempel. Fokusera på att säkerställa att synkningen faktiskt körs när användaren går online och att den hanterar alla edge cases korrekt.**

