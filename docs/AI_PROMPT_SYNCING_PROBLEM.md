# 🚨 KRITISKT PROBLEM: Dashboard Analytics Syncing & 403-fel i Next.js 16 + Supabase

## 📋 SAMMANFATTNING AV PROBLEMET

Vi har en Next.js 16-applikation med Supabase som backend. **Dashboarden visar 0 timmar trots att det finns data i databasen**, och vi ser fortfarande **403 Forbidden-fel** från direkta Supabase REST-anrop (`.../rest/v1/time_entries`) i webbläsarens konsol, trots att vi har:

1. ✅ Migrerat analytics till RPC-funktioner (`get_tenant_dashboard_analytics`)
2. ✅ Skapat API-routes som använder service-role (`createAdminClient`)
3. ✅ Lagt till RLS-policy för service-role (`time_entries_service_read`)
4. ✅ Implementerat en guard i `supabaseClient.ts` som kastar fel i dev om någon försöker använda `supabase.from('time_entries')` i klientkod
5. ✅ Uppdaterat `TimeClock.tsx` att använda API-routes istället för direkta DB-anrop

**Men problemet kvarstår.** Dashboarden visar fortfarande 0 timmar och vi ser 403-fel i konsolen.

---

## 🔍 TEKNISK KONTEXT

### Stack
- **Frontend:** Next.js 16 (Turbopack), React 18, TypeScript
- **Backend:** Supabase (PostgreSQL med RLS)
- **State Management:** TanStack Query (React Query) med localStorage persistence
- **Multi-tenancy:** Varje användare tillhör en `tenant` (UUID)

### Arkitektur
- **RLS (Row Level Security):** Aktiverat på alla tabeller (`time_entries`, `projects`, `invoices`, `employees`)
- **Service Role:** Används i API-routes för att bypassa RLS
- **Client Components:** Använder `createBrowserClient` från `@supabase/ssr`
- **Server Components/API Routes:** Använder `createClient` (server) eller `createAdminClient` (service-role)

---

## 🐛 SYMPTOM

### 1. Dashboard visar 0 timmar trots data i databasen

**Vad som händer:**
- Dashboarden visar `totalHours: 0`, `activeProjects: 0`, etc.
- Men när vi kör SQL direkt i Supabase SQL Editor:
  ```sql
  SELECT COUNT(*), SUM(hours_total) 
  FROM time_entries 
  WHERE tenant_id = '8ee28f55-b780-4286-8137-9e70ea58ae56' 
  AND date >= CURRENT_DATE - INTERVAL '30 days';
  ```
  ...får vi korrekta värden (t.ex. 13 timmar, 5 entries).

**API-routen `/api/analytics/dashboard` returnerar:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalHours": 0,
      "activeProjects": 0,
      ...
    }
  }
}
```

### 2. 403 Forbidden-fel i webbläsarens konsol

**Felmeddelanden:**
```
GET https://rwgqyozifwfgsxwyegoz.supabase.co/rest/v1/time_entries?select=hours_total&date=gte.2025-10-31&tenant_id=eq.8ee28f55-b780-4286-8137-9e70ea58ae56&is_billed=eq.false 403 (Forbidden)
```

**Detta betyder att någon komponent fortfarande gör direkta Supabase-anrop från webbläsaren**, vilket RLS blockerar.

### 3. Syncing fungerar inte

- När användaren stämplar in/ut uppdateras inte dashboarden automatiskt
- Data synkas inte mellan komponenter (TimeClock → Dashboard → Projects)

---

## 🔧 VAD VI HAR GJORT HITTILLS

### 1. Skapat RPC-funktion för analytics

**SQL (`sql/20251107_time_entries_rls_and_rpc.sql`):**
```sql
CREATE OR REPLACE FUNCTION get_tenant_dashboard_analytics(
    p_tenant_id uuid,
    p_start_date timestamptz,
    p_end_date timestamptz
)
RETURNS TABLE (
    total_hours numeric,
    active_projects bigint,
    total_entries bigint
)
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(SUM(hours_total) / 3600.0, 0) AS total_hours,
        COALESCE(COUNT(DISTINCT project_id), 0) AS active_projects,
        COALESCE(COUNT(*), 0) AS total_entries
    FROM
        public.time_entries
    WHERE
        tenant_id = p_tenant_id
        AND date >= p_start_date::date
        AND date <= p_end_date::date;
END;
$$ LANGUAGE plpgsql;
```

### 2. Uppdaterat API-route (`/api/analytics/dashboard/route.ts`)

```typescript
export async function GET(req: NextRequest) {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'No tenant found' }, { status: 400 });
    }

    const admin = createAdminClient(8000, 'public');
    
    // Use RPC for aggregated data
    const { data: rpcData, error: rpcError } = await admin.rpc('get_tenant_dashboard_analytics', {
      p_tenant_id: tenantId,
      p_start_date: startDate.toISOString(),
      p_end_date: endDate.toISOString(),
    });

    // ... rest of logic
  }
}
```

### 3. Lagt till guard i klienten (`app/utils/supabase/supabaseClient.ts`)

```typescript
if (process.env.NODE_ENV !== 'production') {
  const blockedTables = new Set(['time_entries']);
  const originalFrom = supabase.from.bind(supabase);
  (supabase as any).from = ((table: string) => {
    if (blockedTables.has(table)) {
      const message = `[Supabase Guard] Client-side access to "${table}" is not allowed. Use a server API route instead.`;
      console.error(message);
      throw new Error(message);
    }
    return originalFrom(table);
  }) as typeof supabase.from;
}
```

### 4. Uppdaterat TimeClock att använda API-routes

- Dubblettkontroll: `/api/time-entries/list`
- Hämta aktiv entry: `/api/time-entries/get`
- Borttagning: `/api/time-entries/delete`

---

## 🔎 MISSTÄNKTA PROBLEM

### Problem 1: `DashboardClient.tsx` gör fortfarande direkta Supabase-anrop

**Kod som orsakar problem:**
```typescript
// app/dashboard/DashboardClient.tsx (rad 115-119, 177-183)
const { data: tenantVerify } = await supabase
  .from('tenants')  // ✅ Detta är OK (inte time_entries)
  .select('id')
  .eq('id', projectsTenantId)
  .maybeSingle()

// Men senare...
const { data, error } = await supabase
  .from('projects')  // ⚠️ Detta kan vara OK beroende på RLS-policy
  .select('id, name')
  .eq('tenant_id', projectsTenantId)
```

**Men vi ser INTE 403 för `projects` eller `tenants` i loggen**, så problemet är troligen någon annanstans.

### Problem 2: RPC-funktionen returnerar fel data eller fel format

**Möjliga orsaker:**
- `hours_total` är lagrat i sekunder, men vi dividerar med 3600 (vilket är korrekt för timmar)
- Datumfiltreringen fungerar inte korrekt (`date >= p_start_date::date` vs `date >= p_start_date`)
- RPC-funktionen körs med fel tenant_id

### Problem 3: `getTenantId()` returnerar fel värde

**Kod:**
```typescript
// app/lib/serverTenant.ts
export async function getTenantId(): Promise<string | null> {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    // Priority 1: JWT claim
    const claimTenant = (user.app_metadata as Record<string, unknown>)?.tenant_id;
    if (claimTenant && typeof claimTenant === 'string') {
      return claimTenant;
    }
    
    // Priority 2: Cookie
    const c = await cookies();
    const cookieTenant = c.get('tenant_id')?.value;
    if (cookieTenant) {
      return cookieTenant;
    }
    
    // Priority 3: user_roles table
    const admin = createAdminClient();
    const { data: roleData } = await admin
      .from('user_roles')
      .select('tenant_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();
    
    return roleData?.tenant_id ?? null;
  } catch (err) {
    return null;
  }
}
```

**Möjliga problem:**
- `getTenantId()` returnerar `null` eller fel tenant_id
- JWT-claim saknas eller är felaktig
- Cookie saknas eller är felaktig
- `user_roles`-tabellen saknar data

### Problem 4: React Query cache är stale eller felaktig

**Konfiguration (`app/lib/queryClient.ts`):**
```typescript
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      networkMode: 'always',
      refetchOnReconnect: true,
      refetchOnWindowFocus: true,
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});
```

**Möjliga problem:**
- Cache visar gamla värden (0 timmar)
- Query key matchar inte mellan komponenter
- `initialData` är felaktig från localStorage

### Problem 5: Någon komponent vi inte har hittat än gör direkta anrop

**Komponenter att kontrollera:**
- `app/dashboard/DashboardClient.tsx` (vi har sett den, men kanske missat något)
- `app/components/analytics/DashboardAnalytics.tsx` (om den finns)
- `app/hooks/useDashboardAnalytics.ts`
- `app/projects/ProjectsContent.tsx`
- Eventuella andra hooks eller komponenter som hämtar time_entries

---

## 📊 DIAGNOSTIK-DATA

### Konsol-loggar från webbläsaren

```
✅ TenantContext: Found tenant via centralized API: 8ee28f55-b780-4286-8137-9e70ea58ae56 source: jwt
🔍 Dashboard: Rendering TimeClock with: {employeeId: '47224e0b-5809-4894-8696-49dd2b5f71f0', projectsCount: 3, tenantId: '8ee28f55-b780-4286-8137-9e70ea58ae56'}
⚠️ Dashboard: Context tenantId not found in database, fetching from centralized API
✅ Dashboard: Got tenantId from centralized API: 8ee28f55-b780-4286-8137-9e70ea58ae56
```

**Men sen:**
```
GET https://rwgqyozifwfgsxwyegoz.supabase.co/rest/v1/time_entries?select=hours_total&date=gte.2025-10-31&tenant_id=eq.8ee28f55-b780-4286-8137-9e70ea58ae56&is_billed=eq.false 403 (Forbidden)
```

### API-response från `/api/analytics/dashboard`

**Request:**
```
GET /api/analytics/dashboard?period=month
```

**Response (exempel):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "activeProjects": 0,
      "totalEmployees": 0,
      "totalHours": 0,
      "totalRevenue": 0,
      "unpaidInvoices": 0,
      "unpaidAmount": 0
    },
    "kpis": {
      "budgetVariance": 0,
      "utilization": 0,
      "unbilledHours": 0
    },
    "projectPerformance": [],
    "period": "month"
  }
}
```

**Men SQL direkt i Supabase ger:**
```sql
SELECT COUNT(*), SUM(hours_total) 
FROM time_entries 
WHERE tenant_id = '8ee28f55-b780-4286-8137-9e70ea58ae56' 
AND date >= CURRENT_DATE - INTERVAL '30 days';
-- Resultat: 5 rader, 46800 sekunder (13 timmar)
```

---

## 🎯 SPECIFIKA FRÅGOR TILL AI-MODELLERNA

### 1. Varför returnerar RPC-funktionen 0 trots att data finns?

**Hypoteser att testa:**
- Är `hours_total` lagrat i sekunder eller timmar?
- Fungerar datumfiltreringen korrekt?
- Körs RPC-funktionen med rätt tenant_id?
- Är RPC-funktionen korrekt grantad till service_role?

**Vad vi behöver:**
- SQL-frågor för att verifiera RPC-funktionen direkt
- Logging i API-routen för att se vad RPC faktiskt returnerar
- Verifiering av `getTenantId()` returnerar korrekt värde

### 2. Var kommer 403-felen från?

**Vi har:**
- ✅ Guard i `supabaseClient.ts` som kastar fel i dev
- ✅ Uppdaterat `TimeClock.tsx` att använda API-routes
- ✅ Kontrollerat `DashboardClient.tsx` (men kanske missat något)

**Men vi ser fortfarande 403-fel i konsolen.**

**Vad vi behöver:**
- En metod för att spåra exakt vilken komponent/hook som gör anropet (stack trace)
- En lista över alla komponenter/hooks som kan göra direkta Supabase-anrop
- En strategi för att permanent blockera alla client-side DB-anrop

### 3. Varför synkar inte data mellan komponenter?

**Vi har:**
- ✅ React Query med localStorage persistence
- ✅ Event system (`timeEntryUpdated` event)
- ✅ `refetchOnReconnect` och `refetchOnWindowFocus`

**Men dashboarden uppdateras inte när TimeClock stämplar in/ut.**

**Vad vi behöver:**
- En strategi för att invalidera React Query cache när data ändras
- En metod för att synka data mellan komponenter utan att göra onödiga API-anrop
- En bättre event-baserad synkronisering

### 4. Är vår guard-implementation korrekt?

**Vår nuvarande guard:**
```typescript
if (process.env.NODE_ENV !== 'production') {
  const blockedTables = new Set(['time_entries']);
  const originalFrom = supabase.from.bind(supabase);
  (supabase as any).from = ((table: string) => {
    if (blockedTables.has(table)) {
      throw new Error(`[Supabase Guard] Client-side access to "${table}" is not allowed.`);
    }
    return originalFrom(table);
  }) as typeof supabase.from;
}
```

**Men vi ser fortfarande 403-fel, vilket betyder att guard:en inte fångar alla anrop.**

**Vad vi behöver:**
- En bättre guard-implementation som fångar ALLA anrop (inklusive indirekta)
- En metod för att logga alla Supabase-anrop i dev
- En ESLint-regel eller TypeScript-typ som förhindrar direkta anrop

---

## 🛠️ KONKRETA UPPGIFTER VI BEHÖVER HJÄLP MED

### Uppgift 1: Hitta alla källor till 403-felen

**Behöver:**
- En metod för att spåra exakt vilken komponent/hook som gör anropet
- En lista över alla filer som kan göra direkta Supabase-anrop
- En strategi för att permanent blockera alla client-side DB-anrop

**Förväntat resultat:**
- Inga 403-fel i konsolen
- Guard:en fångar alla försök att använda `supabase.from('time_entries')`

### Uppgift 2: Fixa RPC-funktionen så den returnerar korrekt data

**Behöver:**
- SQL-frågor för att verifiera RPC-funktionen direkt
- Logging i API-routen för att se vad RPC faktiskt returnerar
- Verifiering av `getTenantId()` returnerar korrekt värde

**Förväntat resultat:**
- Dashboarden visar korrekta timmar (13h istället för 0h)
- API-routen returnerar korrekt data från RPC-funktionen

### Uppgift 3: Fixa syncing mellan komponenter

**Behöver:**
- En strategi för att invalidera React Query cache när data ändras
- En metod för att synka data mellan komponenter utan att göra onödiga API-anrop
- En bättre event-baserad synkronisering

**Förväntat resultat:**
- Dashboarden uppdateras automatiskt när TimeClock stämplar in/ut
- Data synkas korrekt mellan alla komponenter

### Uppgift 4: Förbättra guard-implementationen

**Behöver:**
- En bättre guard-implementation som fångar ALLA anrop (inklusive indirekta)
- En metod för att logga alla Supabase-anrop i dev
- En ESLint-regel eller TypeScript-typ som förhindrar direkta anrop

**Förväntat resultat:**
- Guard:en fångar alla försök att använda `supabase.from('time_entries')`
- Tydliga felmeddelanden som visar exakt var problemet är

---

## 📝 KOD-RELEVANTA FILER

### Filer att granska:

1. **`app/api/analytics/dashboard/route.ts`** - Huvud-API-route för analytics
2. **`app/lib/serverTenant.ts`** - Funktion för att hämta tenant_id
3. **`app/utils/supabase/admin.ts`** - Admin client (service-role)
4. **`app/utils/supabase/supabaseClient.ts`** - Client-side Supabase client (med guard)
5. **`app/components/TimeClock.tsx`** - TimeClock-komponenten
6. **`app/dashboard/DashboardClient.tsx`** - Dashboard-komponenten
7. **`app/hooks/useDashboardAnalytics.ts`** - React Query hook för analytics
8. **`app/lib/queryClient.ts`** - React Query konfiguration
9. **`sql/20251107_time_entries_rls_and_rpc.sql`** - RPC-funktion och RLS-policy

---

## 🎯 SLUTSATS OCH ÖNSKAD HJÄLP

Vi behöver hjälp med att:

1. **Hitta alla källor till 403-felen** - Varför ser vi fortfarande direkta Supabase-anrop trots guard?
2. **Fixa RPC-funktionen** - Varför returnerar den 0 trots att data finns?
3. **Fixa syncing** - Varför uppdateras inte dashboarden när data ändras?
4. **Förbättra guard-implementationen** - Hur kan vi säkerställa att inga direkta anrop görs?

**Vi är öppna för alla förslag och idéer!** Tack för er hjälp! 🙏

