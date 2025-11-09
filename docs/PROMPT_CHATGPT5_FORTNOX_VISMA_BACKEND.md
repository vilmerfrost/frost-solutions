# 🎯 PROMPT FÖR CHATGPT 5: API CLIENTS & DATA MAPPING

## 🔧 UPPGIFT: PRAKTISK API CLIENT IMPLEMENTATION

### Kontext

Du är ChatGPT 5 och ska implementera **praktiska, direkt användbara API clients** för Fortnox och Visma. Du har Perplexity's research guide med alla API endpoints, och nu ska du skapa **production-ready TypeScript clients** med robust error handling och data mapping.

### Teknisk Stack

- **Framework**: Next.js 16 App Router
- **Language**: TypeScript (strict mode)
- **Database**: Supabase (PostgreSQL)
- **API Client**: Fetch API (native, no axios)

### Perplexity Research Guide

Du har tillgång till komplett research guide med:
- ✅ Fortnox API endpoints (`/customers`, `/invoices`, etc.)
- ✅ Visma API endpoints (`/customers`, `/invoices`, etc.)
- ✅ OAuth token management
- ✅ Data structures för båda providers
- ✅ Error codes och handling

### Dina Specifika Uppgifter

#### 1. **Fortnox API Client** (Högsta prioritet)
- Implementera `FortnoxAPIClient` class med alla endpoints
- Methods: `createCustomer()`, `updateCustomer()`, `getCustomer()`, `listCustomers()`
- Methods: `createInvoice()`, `updateInvoice()`, `getInvoice()`, `listInvoices()`
- Automatic token refresh before API calls
- Rate limiting (300 requests/minute)
- Error handling med retry logic

#### 2. **Visma API Client** (Högsta prioritet)
- Implementera `VismaAPIClient` class med alla endpoints
- Methods: `createCustomer()`, `updateCustomer()`, `getCustomer()`, `listCustomers()`
- Methods: `createInvoice()`, `updateInvoice()`, `getInvoice()`, `listInvoices()`
- Automatic token refresh before API calls
- Rate limiting (Visma limits)
- Error handling med retry logic

#### 3. **Data Mapping** (Hög prioritet)
- Map Frost Solutions `clients` → Fortnox `Customer` format
- Map Frost Solutions `clients` → Visma `Customer` format
- Map Frost Solutions `invoices` → Fortnox `Invoice` format
- Map Frost Solutions `invoices` → Visma `Invoice` format
- Handle field differences (e.g., `zip_code` vs `ZipCode`)
- Handle missing fields gracefully

#### 4. **OAuth Token Management** (Hög prioritet)
- Token refresh logic (refresh before expiry)
- Token storage integration (Supabase Vault)
- Token validation before API calls
- Error handling för expired tokens

#### 5. **Error Handling & Retry** (Hög prioritet)
- Retry logic med exponential backoff
- Handle rate limit errors (429)
- Handle authentication errors (401) - refresh token
- Handle validation errors (400) - don't retry
- Error categorization (retryable vs non-retryable)

### Specifika Implementation-Krav

1. **Type Safety**: Alla API responses ska ha TypeScript types
2. **Validation**: Validera data innan API calls (Zod schemas)
3. **Idempotency**: Support för idempotency keys
4. **Logging**: Logga alla API calls (request/response)
5. **Error Messages**: Tydliga error messages för debugging

### Önskad Output

1. **FortnoxAPIClient Class**
   ```typescript
   export class FortnoxAPIClient {
     constructor(
       private accessToken: string,
       private refreshToken: string,
       private tokenRefreshFn: () => Promise<string>
     ) {}
     
     async createCustomer(customer: FortnoxCustomer): Promise<FortnoxCustomerResponse>
     async createInvoice(invoice: FortnoxInvoice): Promise<FortnoxInvoiceResponse>
     // ... alla metoder
   }
   ```

2. **VismaAPIClient Class**
   ```typescript
   export class VismaAPIClient {
     // Samma struktur som FortnoxAPIClient
   }
   ```

3. **Data Mappers**
   ```typescript
   export function mapFrostClientToFortnox(client: Client): FortnoxCustomer
   export function mapFrostInvoiceToFortnox(invoice: Invoice): FortnoxInvoice
   export function mapFrostClientToVisma(client: Client): VismaCustomer
   export function mapFrostInvoiceToVisma(invoice: Invoice): VismaInvoice
   ```

4. **Token Manager**
   ```typescript
   export class TokenManager {
     async getValidAccessToken(provider: 'fortnox' | 'visma'): Promise<string>
     async refreshToken(provider: 'fortnox' | 'visma'): Promise<string>
   }
   ```

5. **Error Handler**
   ```typescript
   export class APIErrorHandler {
     static isRetryable(error: APIError): boolean
     static handleError(error: APIError, context: string): never
   }
   ```

### Exempel Implementation

```typescript
// Exempel: Fortnox customer creation med full error handling
export async function createFortnoxCustomer(
  customer: FortnoxCustomer,
  accessToken: string
): Promise<{ Customer: { CustomerNumber: string } }> {
  // Validate input
  const validationErrors = validateFortnoxCustomer(customer);
  if (validationErrors.length > 0) {
    throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
  }

  // Make API call with retry
  return retryWithBackoff(async () => {
    const response = await fetch('https://api.fortnox.se/3/customers', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ Customer: customer })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new APIError(error, response.status);
    }

    return response.json();
  });
}
```

### Fokusområden

- ✅ **Praktisk kod**: Direkt användbar, production-ready
- ✅ **Type Safety**: Full TypeScript coverage
- ✅ **Error Handling**: Robust error handling med retry
- ✅ **Data Mapping**: Tydlig mapping mellan formats

### Viktigt

- Använd Perplexity's research guide för API endpoints
- Implementera ALLA metoder (inte bara stub)
- Fokusera på praktisk, direkt användbar kod
- Tydlig error handling och logging

---

**Fokus**: Praktisk implementation, direkt användbar kod, robust error handling, tydlig data mapping. Lösningen ska vara production-ready och lätt att använda.

