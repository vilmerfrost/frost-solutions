# AI Prompt: Supabase Connection Issues & 503 Errors

## Kontext
Jag arbetar med ett Next.js 16-projekt som använder Supabase för databas och autentisering. Projektet har en integrations-sida där användare kan koppla Fortnox och Visma-integrationer via OAuth 2.0.

## Problem
1. **503-fel på status-endpoints**: Flera integrationer får 503-fel när de försöker hämta status via `/api/integrations/[id]/status`
2. **Supabase Auth timeout**: `ERR_CONNECTION_TIMED_OUT` när Supabase försöker uppdatera tokens
3. **Kan inte koppla integrationer**: Användare kan inte koppla nya integrationer

## Teknisk stack
- **Framework**: Next.js 16.0.1 (App Router, Turbopack)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **State Management**: React Query (@tanstack/react-query)
- **Styling**: Tailwind CSS

## Projektstruktur
```
frost-demo/
├── app/
│   ├── api/integrations/
│   │   ├── [id]/status/route.ts  # Returnerar 503
│   │   └── route.ts               # Listar integrationer
│   ├── hooks/useIntegrations.ts   # React Query hooks
│   ├── components/integrations/  # UI-komponenter
│   └── utils/supabase/
│       ├── admin.ts               # Admin client (service role)
│       └── server.ts              # Server client
├── sql/
│   ├── CREATE_INTEGRATIONS_TABLES.sql
│   └── CREATE_INTEGRATION_HELPER_FUNCTIONS.sql
└── .env.local                     # Environment variables
```

## Detaljerade fel

### 1. 503-fel på status-endpoints
**Symptom:**
```
Failed to load resource: the server responded with a status of 503
/api/integrations/73dfefe2-0adf-43bc-8e14-a4360475bc76/status
```

**Kod som orsakar problemet:**
```typescript
// app/api/integrations/[id]/status/route.ts
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('integrations')
    .select('id, provider, status, last_synced_at, last_error, updated_at')
    .eq('id', params.id)
    .eq('tenant_id', tenantId)
    .single();
  // ...
}
```

**Vad jag har försökt:**
- Lagt till timeout-hantering (10 sekunder)
- Förbättrat felhantering med specifika 503-responses
- Lagt till retry-logik i React Query hooks
- Använt `Promise.allSettled` för statistik-queries

**Frågor:**
1. Varför returnerar Supabase 503 istället för timeout eller connection error?
2. Är det bättre att använda connection pooling eller connection retry-logik?
3. Bör jag cachea status-queries för att minska belastningen?

### 2. Supabase Auth Timeout
**Symptom:**
```
ERR_CONNECTION_TIMED_OUT
rwgqyozifwfgsxwyegoz.supabase.co/auth/v1/token?grant_type=refresh_token
AuthRetryableFetchError: Failed to fetch
```

**Kod:**
```typescript
// app/utils/supabase/admin.ts
export function createAdminClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  return createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
```

**Frågor:**
1. Varför timeout:ar Supabase Auth refresh-tokens?
2. Är det ett nätverksproblem eller Supabase-instansproblem?
3. Bör jag använda en annan auth-strategi för admin-klienten?

### 3. Database Schema
**Tabellstruktur:**
- Tabellerna ligger i `app` schema: `app.integrations`, `app.integration_mappings`
- VIEWs i `public` schema: `public.integrations`, `public.integration_mappings`
- RPC-funktioner för writes: `create_integration()`

**Frågor:**
1. Kan VIEWs orsaka performance-problem som leder till 503?
2. Är det bättre att använda RPC-funktioner för alla queries?
3. Bör jag ändra search_path eller använda explicit schema-qualifiering?

## Environment Variables
```bash
SUPABASE_URL=https://rwgqyozifwfgsxwyegoz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
NEXT_PUBLIC_SUPABASE_URL=https://rwgqyozifwfgsxwyegoz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

## Vad jag behöver hjälp med

1. **Diagnostisera 503-felen**: Varför får jag 503 istället för timeout eller connection errors?
2. **Supabase connection issues**: Hur kan jag förbättra anslutningsstabiliteten?
3. **Performance optimization**: Bör jag cachea queries eller använda connection pooling?
4. **Error handling**: Är min nuvarande felhantering optimal?
5. **Alternative approaches**: Finns det bättre sätt att hantera Supabase-queries i Next.js?

## Specifika frågor

1. **Timeout-hantering**: Min nuvarande timeout är 10 sekunder. Är det rimligt?
2. **Retry-logik**: Jag försöker inte igen vid 503-fel. Är det korrekt?
3. **Connection pooling**: Bör jag använda Supabase connection pooling?
4. **Caching**: Bör jag cachea status-queries i React Query längre?
5. **Error boundaries**: Bör jag lägga till error boundaries för integrations-komponenter?

## Önskat resultat

1. Stabil anslutning till Supabase utan 503-fel
2. Bättre felhantering som ger användaren tydliga meddelanden
3. Optimal performance utan onödiga queries
4. Robust system som hanterar nätverksproblem gracefully

## Ytterligare information

- **Supabase-projekt**: Aktivt och fungerar för andra delar av appen
- **Nätverk**: Lokal utveckling (localhost:3000)
- **Browser**: Chrome, Windows 10
- **Node version**: 18.x
- **Supabase client version**: @supabase/supabase-js@latest

## Vad jag redan har implementerat

1. ✅ Timeout-hantering i status-route (10 sekunder)
2. ✅ Retry-logik i React Query hooks (max 2 försök, exponential backoff)
3. ✅ Bättre felmeddelanden i UI
4. ✅ Graceful degradation (visar senast sparad status vid fel)
5. ✅ Detaljerad logging för debugging

## Vad jag behöver hjälp med

1. **Root cause analysis**: Varför får jag 503-fel?
2. **Best practices**: Hur hanterar man Supabase-queries optimalt i Next.js?
3. **Performance**: Hur kan jag optimera queries för bättre prestanda?
4. **Error handling**: Är min nuvarande approach optimal?
5. **Alternative solutions**: Finns det bättre sätt att implementera detta?

---

**Vänligen ge mig:**
1. En analys av varför 503-felen uppstår
2. Konkreta förbättringsförslag för koden
3. Best practices för Supabase + Next.js
4. Eventuella alternativa lösningar
5. Kod-exempel på förbättringar

