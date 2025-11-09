# 🔍 PERPLEXITY PRO RESEARCH PROMPT: FORTNOX/VISMA BOKFÖRINGSINTEGRATION

## Research Uppgift: Fortnox & Visma API Integration för Auto-Sync Bokföring

### Kontext
Vi bygger en Next.js 16 App Router-applikation (TypeScript, Supabase) som behöver integrera med Fortnox och Visma för automatisk synkronisering av fakturor och kunder. Vi har redan en stub-implementation och behöver nu komplett integration.

### Specifika Research-Frågor

#### 1. FORTNOX API INTEGRATION
- **OAuth 2.0 Flow**: Hur fungerar Fortnox OAuth 2.0 authorization code flow? Vilka endpoints används?
- **API Endpoints**: Vilka är de viktigaste API-endpoints för:
  - Skapa/uppdatera kunder (`/customers`)
  - Skapa/uppdatera fakturor (`/invoices`)
  - Hämta fakturor (`/invoices`)
  - Webhook support för real-time updates
- **Rate Limits**: Vilka är Fortnox API rate limits och best practices för att hantera dem?
- **Error Handling**: Vanliga felkoder och hur man hanterar dem (401, 429, 500, etc.)
- **Token Refresh**: Hur fungerar refresh token flow? Hur ofta behöver tokens uppdateras?
- **Data Mapping**: Hur mappar man Frost Solutions data-struktur till Fortnox format?
  - Kunder: `clients` → Fortnox `customers`
  - Fakturor: `invoices` → Fortnox `invoices`
  - Projekt: `projects` → Fortnox `projects` (om stöds)
- **Bokföring**: Hur bokför man fakturor automatiskt i Fortnox? Vilka konton används?
- **Best Practices**: Rekommenderade patterns för Fortnox integration i Node.js/TypeScript

#### 2. VISMA API INTEGRATION
- **OAuth 2.0 Flow**: Hur fungerar Visma eAccounting OAuth 2.0 flow? Skillnader från Fortnox?
- **API Endpoints**: Vilka är de viktigaste API-endpoints för:
  - Kunder (`/customers` eller `/contacts`)
  - Fakturor (`/invoices` eller `/sales`)
  - Bokföring (`/accounting` eller `/vouchers`)
- **Rate Limits**: Visma API rate limits och throttling strategies
- **Error Handling**: Visma-specifika felkoder och hantering
- **Token Refresh**: Visma refresh token mechanism
- **Data Mapping**: Frost Solutions → Visma data mapping
- **Bokföring**: Automatisk bokföring i Visma eAccounting
- **Best Practices**: Visma integration patterns för Node.js/TypeScript

#### 3. SYNC STRATEGIES & ARCHITECTURE
- **Bidirectional Sync**: Hur hanterar man tvåvägs-synkronisering utan konflikter?
- **Conflict Resolution**: Best practices för att lösa konflikter när data ändras i båda systemen
- **Incremental Sync**: Hur synkar man endast ändringar (delta sync) istället för full sync?
- **Webhook vs Polling**: När ska man använda webhooks vs polling för real-time updates?
- **Background Jobs**: Hur implementerar man bakgrundsjobb för auto-sync (cron, queue, etc.)?
- **Idempotency**: Hur säkerställer man att sync-operationer är idempotenta?
- **Data Validation**: Validering av data innan sync till Fortnox/Visma

#### 4. SECURITY & COMPLIANCE
- **Token Storage**: Säker lagring av OAuth tokens (encryption, Supabase Vault, etc.)
- **API Key Management**: Best practices för att hantera API keys och secrets
- **GDPR Compliance**: Datahantering enligt GDPR när man synkar mellan system
- **Audit Logging**: Logging av alla sync-operationer för spårbarhet

#### 5. ERROR HANDLING & RESILIENCE
- **Retry Strategies**: Exponential backoff, circuit breaker patterns
- **Partial Failures**: Hantera när vissa fakturor synkar men andra misslyckas
- **Queue System**: Använda kösystem (BullMQ, pg_cron) för reliable sync
- **Monitoring**: Hur övervakar man sync-status och fel?

#### 6. USER EXPERIENCE
- **Connection Flow**: UX för att ansluta Fortnox/Visma (OAuth redirect flow)
- **Sync Status**: Visa sync-status i UI (synkad, synkar, fel, etc.)
- **Manual Sync**: Möjlighet att manuellt trigga sync
- **Error Messages**: Tydliga felmeddelanden när sync misslyckas

### Teknisk Stack
- **Framework**: Next.js 16 App Router
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **API Client**: Fetch API eller axios
- **Background Jobs**: Supabase Edge Functions eller pg_cron

### Befintlig Kod-Struktur
- Vi har redan payroll export för Fortnox/Visma (`app/lib/payroll/exporters/`)
- Vi har integration stub (`app/api/integrations/`)
- Vi har `clients` och `invoices` tabeller i Supabase
- Vi använder Supabase RLS för multi-tenant isolation

### Önskad Output
1. **Komplett OAuth 2.0 implementation guide** för både Fortnox och Visma
2. **API client examples** i TypeScript för båda providers
3. **Sync architecture diagram** och best practices
4. **Error handling patterns** med konkreta exempel
5. **Security recommendations** för token storage och API key management
6. **Performance optimizations** för stora datasets
7. **Testing strategies** för integration testing

### Prioritering
1. **Högsta prioritet**: OAuth flow, API endpoints, data mapping
2. **Hög prioritet**: Sync strategies, error handling, security
3. **Medel prioritet**: Performance, monitoring, UX

### Specifika Krav
- Lösningen måste fungera med Supabase multi-tenant architecture
- Måste hantera flera tenants som kan ha olika Fortnox/Visma-konton
- Måste vara resilient mot API-fel och nätverksproblem
- Måste följa GDPR för datahantering

---

**Fokus**: Ge konkreta, implementerbara lösningar med kod-exempel och best practices för production-ready integration.

