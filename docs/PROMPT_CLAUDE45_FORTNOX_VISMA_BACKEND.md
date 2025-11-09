# 🎯 PROMPT FÖR CLAUDE 4.5: FULLSTACK FORTNOX/VISMA INTEGRATION

## 🚀 UPPGIFT: KOMPLETT OAUTH & SYNC ARCHITECTURE IMPLEMENTATION

### Kontext

Du är Claude 4.5 och ska implementera **komplett OAuth 2.0 flow och sync architecture** för Fortnox/Visma integration i Frost Solutions. Du har Perplexity's research guide som grund, men behöver nu skapa en **production-ready implementation** med omfattande logging, error handling och root cause analysis.

### Teknisk Stack

- **Framework**: Next.js 16 App Router
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL) med RLS
- **Authentication**: Supabase Auth
- **Multi-tenant**: RLS policies per tenant_id

### Befintlig Kod-Struktur

- Vi har payroll export för Fortnox/Visma (`app/lib/payroll/exporters/`)
- Vi har integration stub (`app/api/integrations/`)
- Vi har `clients` och `invoices` tabeller i Supabase
- Vi använder Supabase RLS för multi-tenant isolation
- Vi har `accounting_integrations` och `sync_logs` tabeller (enligt FEATURE_SPECIFICATIONS.md)

### Perplexity Research Guide

Du har tillgång till komplett research guide (`frost_fortnox_visma_api_guide.md`) med:
- ✅ OAuth 2.0 implementation för både Fortnox och Visma
- ✅ API endpoints och data structures
- ✅ Sync strategies (webhooks + polling)
- ✅ Error handling patterns
- ✅ Security & token management
- ✅ Multi-tenant implementation

### Dina Specifika Uppgifter

#### 1. **OAuth 2.0 Implementation** (Högsta prioritet)
- Implementera komplett OAuth flow för Fortnox och Visma
- Authorization URL generation med state parameter (tenantId)
- Token exchange endpoint (`/api/integrations/callback/[provider]`)
- Token refresh logic med automatic refresh before expiry
- Error handling för OAuth errors (user denied, invalid code, etc.)

#### 2. **Sync Architecture Design** (Högsta prioritet)
- Designa hybrid sync-strategi (webhooks + polling fallback)
- Implementera `AccountingSyncOrchestrator` class
- Conflict resolution logic för bidirectional sync
- Idempotency keys för att förhindra duplicering
- Sync queue system för reliable processing

#### 3. **Omfattande Logging** (Hög prioritet)
- Logga alla OAuth flows (authorization start, callback, token refresh)
- Logga alla sync-operationer (create, update, delete)
- Logga errors med full context (tenantId, provider, resource type)
- Logga performance metrics (duration_ms, retry_count)
- Strukturerad logging för easy debugging

#### 4. **Root Cause Analysis** (Hög prioritet)
- Analysera VARFÖR sync-operationer misslyckas
- Identifiera vanliga fel-scenarion (token expiry, rate limits, network errors)
- Implementera diagnostic endpoints för troubleshooting
- Error categorization (retryable vs non-retryable)

#### 5. **API Route Implementation**
- `/api/integrations/authorize/[provider]` - Start OAuth flow
- `/api/integrations/callback/[provider]` - Handle OAuth callback
- `/api/integrations/sync-invoice` - Manual sync invoice
- `/api/integrations/sync-customer` - Manual sync customer
- `/api/integrations/status` - Get sync status and logs
- `/api/integrations/webhook/[provider]` - Handle webhooks

### Specifika Krav

1. **Multi-tenant Safety**: Alla queries MÅSTE inkludera `tenant_id` filter
2. **Token Security**: Använd Supabase Vault för token storage (encrypted)
3. **Error Recovery**: Implementera retry logic med exponential backoff
4. **Rate Limiting**: Respektera Fortnox (300 req/min) och Visma rate limits
5. **Idempotency**: Alla sync-operationer måste vara idempotenta

### Önskad Output

1. **Komplett OAuth Implementation**
   - Authorization URL generation
   - Callback handler med error handling
   - Token refresh manager
   - Token vault integration

2. **Sync Architecture**
   - `AccountingSyncOrchestrator` class
   - Conflict resolution logic
   - Idempotency key system
   - Sync queue implementation

3. **API Routes**
   - Alla routes implementerade med proper error handling
   - Request validation (Zod schemas)
   - Response formatting

4. **Logging System**
   - Structured logging för alla operations
   - Error logging med context
   - Performance logging

5. **Root Cause Analysis**
   - Error categorization
   - Diagnostic endpoints
   - Troubleshooting guide

### Fokusområden

- ✅ **Fullstack-perspektiv**: Se både backend och frontend integration
- ✅ **Production-ready**: Robust error handling, logging, monitoring
- ✅ **Maintainability**: Tydlig kod-struktur, dokumentation
- ✅ **Debugging**: Omfattande logging för easy troubleshooting

### Exempel på Vad Du Ska Implementera

```typescript
// Exempel: OAuth callback handler med omfattande logging
export async function GET(
  request: NextRequest,
  { params }: { params: { provider: 'fortnox' | 'visma' } }
) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('[OAuth Callback] 🚀 STARTING');
  console.log('[OAuth Callback] Provider:', params.provider);
  
  // ... implementation med logging på varje steg
  
  console.log('[OAuth Callback] ✅ SUCCESS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}
```

### Viktigt

- Använd Perplexity's research guide som grund
- Implementera ALLA delar (inte bara stub)
- Fokusera på production-ready kod med robust error handling
- Tänk på long-term maintainability

---

**Fokus**: Fullstack-analys, komplett implementation, omfattande logging, root cause analysis. Lösningen ska vara production-ready och lätt att debugga.

