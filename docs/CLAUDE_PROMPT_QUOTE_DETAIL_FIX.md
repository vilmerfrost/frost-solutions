# Claude 4.5 Prompt: Fix Quote Detail View "Kunde inte hämta offert" Error

## Problembeskrivning

När användaren klickar på en offert i listan för att se detaljvyn, visas felmeddelandet "Kunde inte hämta offert" (eller "Offerten hittades inte"). Detta händer trots att offerten finns i databasen och visas korrekt i listan.

## Teknisk Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** Supabase (PostgreSQL)
- **State Management:** React Query (@tanstack/react-query)
- **Authentication:** Supabase Auth
- **Multi-tenancy:** Tenant-isolerad via `tenant_id` i alla tabeller

## Relevant Kod

### 1. Frontend - Quote Detail Page
**Fil:** `app/quotes/[id]/page.tsx`
```typescript
'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import { useQuote } from '@/hooks/useQuotes'
import { QuoteDetail } from '@/components/quotes/QuoteDetail'
import Sidebar from '@/components/Sidebar'

export default function QuoteDetailPage() {
  const params = useParams()
  const quoteId = params.id as string

  const { data: quote, isLoading, error } = useQuote(quoteId)

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <main className="flex-1 lg:ml-0">
          <div className="container mx-auto px-4 py-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (error || !quote) {
    return (
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <main className="flex-1 lg:ml-0">
          <div className="container mx-auto px-4 py-8">
            <p className="text-red-600">Offerten hittades inte</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 lg:ml-0">
        <div className="container mx-auto px-4 py-8">
          <QuoteDetail quote={quote} />
        </div>
      </main>
    </div>
  )
}
```

### 2. Frontend - useQuote Hook
**Fil:** `app/hooks/useQuotes.ts`
```typescript
export function useQuote(id: string | null) {
  const { tenantId } = useTenant()

  return useQuery({
    queryKey: ['quotes', id],
    queryFn: () => QuotesAPI.get(id!),
    enabled: !!id && !!tenantId
  })
}
```

### 3. Frontend - QuotesAPI.get()
**Fil:** `app/lib/api/quotes.ts`
```typescript
// Get single quote
static async get(id: string): Promise<Quote> {
  const res = await fetch(`/api/quotes/${id}`)
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(extractErrorMessage(errorData.error || 'Failed to fetch quote'))
  }

  const result: ApiResponse<Quote> = await res.json()
  if (!result.data) throw new Error('No quote data returned')
  return result.data
}
```

### 4. Backend - GET API Route
**Fil:** `app/api/quotes/[id]/route.ts`
```typescript
export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const quoteId = params.id
  const startTime = Date.now()

  try {
    // Step 1: Tenant validation
    const tenantId = await getTenantId()
    if (!tenantId) {
      logError('GET /api/quotes/[id]', 'No tenant ID found', { quoteId })
      return createErrorResponse('Unauthorized: No tenant found', 401)
    }

    console.log(`[API] GET /api/quotes/${quoteId}`, {
      tenantId,
      timestamp: new Date().toISOString(),
    })

    const admin = createAdminClient()

    // Step 2: Fetch quote with error handling
    let quote
    try {
      const { data: quoteData, error: quoteError } = await admin
        .from('quotes')
        .select('*')
        .eq('id', quoteId)
        .eq('tenant_id', tenantId)
        .maybeSingle()

      if (quoteError) {
        throw new Error(`Failed to fetch quote: ${quoteError.message}`)
      }

      if (!quoteData) {
        logError('GET /api/quotes/[id]', 'Quote not found', { quoteId, tenantId })
        return createErrorResponse('Quote not found', 404, { quoteId })
      }

      quote = quoteData
      console.log(`[API] Quote fetched successfully`, { quoteId, status: quote.status })
    } catch (error: any) {
      logError('GET /api/quotes/[id] - Quote fetch', error, { quoteId, tenantId })
      return createErrorResponse(
        'Failed to fetch quote',
        500,
        { originalError: error.message }
      )
    }

    // Step 3: Fetch related data in parallel with individual error handling
    const [itemsResult, customerResult, projectResult] = await Promise.allSettled([
      // Items
      admin
        .from('quote_items')
        .select('*')
        .eq('quote_id', quoteId)
        .eq('tenant_id', tenantId)
        .order('order_index', { ascending: true })
        .then(res => ({ data: res.data, error: res.error })),
      
      // Customer (optional)
      quote.customer_id
        ? admin
            .from('clients')
            .select('id, name, email')
            .eq('id', quote.customer_id)
            .eq('tenant_id', tenantId)
            .maybeSingle()
            .then(res => ({ data: res.data, error: res.error }))
        : Promise.resolve({ data: null, error: null }),
      
      // Project (optional)
      quote.project_id
        ? admin
            .from('projects')
            .select('id, name')
            .eq('id', quote.project_id)
            .eq('tenant_id', tenantId)
            .maybeSingle()
            .then(res => ({ data: res.data, error: res.error }))
        : Promise.resolve({ data: null, error: null }),
    ])

    // Process items result
    let items = []
    if (itemsResult.status === 'fulfilled') {
      if (itemsResult.value.error) {
        logError('GET /api/quotes/[id] - Items fetch', itemsResult.value.error, {
          quoteId,
          tenantId,
        })
        console.warn(`[API] Failed to fetch items for quote ${quoteId}, continuing with empty array`)
      } else {
        items = itemsResult.value.data || []
      }
    } else {
      logError('GET /api/quotes/[id] - Items fetch rejected', itemsResult.reason, {
        quoteId,
        tenantId,
      })
    }

    // Process customer result
    let customer = null
    if (customerResult.status === 'fulfilled') {
      if (customerResult.value.error) {
        logError('GET /api/quotes/[id] - Customer fetch', customerResult.value.error, {
          quoteId,
          customerId: quote.customer_id,
        })
      } else {
        customer = customerResult.value.data
      }
    } else {
      logError('GET /api/quotes/[id] - Customer fetch rejected', customerResult.reason, {
        quoteId,
        customerId: quote.customer_id,
      })
    }

    // Process project result
    let project = null
    if (projectResult.status === 'fulfilled') {
      if (projectResult.value.error) {
        logError('GET /api/quotes/[id] - Project fetch', projectResult.value.error, {
          quoteId,
          projectId: quote.project_id,
        })
      } else {
        project = projectResult.value.data
      }
    } else {
      logError('GET /api/quotes/[id] - Project fetch rejected', projectResult.reason, {
        quoteId,
        projectId: quote.project_id,
      })
    }

    // Assemble response
    const response = {
      ...quote,
      items,
      customer,
      project,
    }

    const duration = Date.now() - startTime
    console.log(`[API] GET /api/quotes/${quoteId} completed`, {
      duration: `${duration}ms`,
      itemsCount: items.length,
      hasCustomer: !!customer,
      hasProject: !!project,
    })

    return NextResponse.json({ data: response })
  } catch (error: any) {
    const duration = Date.now() - startTime
    logError('GET /api/quotes/[id] - Unexpected error', error, {
      quoteId: params.id,
      duration: `${duration}ms`,
    })

    return createErrorResponse(
      'An unexpected error occurred',
      500,
      {
        message: error?.message,
        type: error?.constructor?.name,
      }
    )
  }
}
```

### 5. Tenant Resolution
**Fil:** `app/lib/serverTenant.ts`
```typescript
export async function getTenantId(): Promise<string | null> {
  try {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }

    // Priority 1: JWT claim (authoritative)
    const claimTenant = (user.app_metadata as Record<string, unknown>)?.tenant_id
    if (claimTenant && typeof claimTenant === 'string') {
      return claimTenant
    }

    // Priority 2: httpOnly cookie (convenience, set by /api/auth/set-tenant)
    const c = await cookies()
    const cookieTenant = c.get('tenant_id')?.value
    if (cookieTenant) {
      return cookieTenant
    }

    // Priority 3: fall back to user_roles via service-role client
    try {
      const admin = createAdminClient()
      const { data: roleData } = await admin
        .from('user_roles')
        .select('tenant_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()

      if (roleData?.tenant_id) {
        return roleData.tenant_id
      }
    } catch (roleError) {
      console.error('getTenantId: failed to resolve tenant via user_roles', roleError)
    }

    return null
  } catch (err) {
    return null
  }
}
```

## Möjliga Orsaker

1. **Tenant ID saknas:** `getTenantId()` returnerar `null`, vilket leder till 401 Unauthorized
2. **Timing-problem:** `useTenant()` hooken har inte laddat `tenantId` ännu när `useQuote` körs
3. **Params-hantering:** `params.id` kan vara `undefined` eller fel format
4. **API Response Format:** Backend returnerar `{ data: ... }` men frontend förväntar sig kanske annat format
5. **CORS/Authentication:** Cookies eller session kan saknas i API-anropet
6. **Error Handling:** Felmeddelanden från API:n når inte frontend korrekt

## Vad Behöver Fixas

1. **Förbättra felhantering i frontend:**
   - Visa mer detaljerade felmeddelanden (status code, error message från API)
   - Logga fel till konsolen för debugging
   - Hantera olika fel-scenarier (401, 404, 500)

2. **Förbättra tenant resolution:**
   - Säkerställ att `tenantId` är tillgängligt innan API-anrop görs
   - Lägg till retry-logik om tenant inte är tillgängligt direkt
   - Bättre fallback-strategier

3. **Förbättra API-routen:**
   - Mer detaljerad logging för att identifiera var problemet uppstår
   - Bättre felmeddelanden som inkluderar mer kontext
   - Validera att `params.id` är en giltig UUID

4. **Förbättra React Query-konfiguration:**
   - Lägg till `retry`-logik
   - Bättre `enabled`-villkor
   - Hantera loading states bättre

## Önskad Lösning

Jag vill ha en komplett fix som:

1. **Identifierar rotorsaken** genom att lägga till omfattande logging
2. **Fixar tenant resolution** så att den alltid fungerar korrekt
3. **Förbättrar felhantering** både i frontend och backend
4. **Förbättrar användarupplevelsen** med tydliga felmeddelanden
5. **Säkerställer robusthet** med retry-logik och fallbacks

## Ytterligare Kontext

- Systemet använder Supabase med RLS (Row Level Security)
- Alla API-routes använder `createAdminClient()` för att bypassa RLS
- Tenant-isolering är kritisk - användare ska bara se sina egna offerter
- Systemet har fungerande offert-lista (GET `/api/quotes` fungerar)
- Problemet uppstår specifikt när man försöker hämta en enskild offert

## Testfall att Verifiera

1. ✅ Offert-listan laddas korrekt
2. ❌ Klicka på en offert → "Kunde inte hämta offert"
3. ✅ Offerten finns i databasen med korrekt `tenant_id`
4. ✅ Användaren är inloggad och har korrekt `tenant_id` i JWT/cookie

## Begärda Filer att Fixa

1. `app/api/quotes/[id]/route.ts` - Förbättra felhantering och logging
2. `app/hooks/useQuotes.ts` - Förbättra `useQuote` hook
3. `app/lib/api/quotes.ts` - Förbättra `QuotesAPI.get()` error handling
4. `app/quotes/[id]/page.tsx` - Förbättra felvisning och debugging

## Viktiga Punkter

- **Använd samma felhanteringsmönster** som i resten av koden (`extractErrorMessage`, `logError`)
- **Behåll tenant-isolering** - säkerställ att användare bara ser sina egna offerter
- **Lägg till omfattande logging** för debugging
- **Förbättra användarupplevelsen** med tydliga felmeddelanden
- **Säkerställ robusthet** med retry-logik och fallbacks

---

**Tack för din hjälp! Jag behöver en komplett, produktionsklar lösning som fixar detta problem permanent.**

