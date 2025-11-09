# 🔧 EXTERNAL AI PROMPTS: OAuth Redirect URI Mismatch Fix

## Problem Summary
We're getting OAuth redirect URI mismatch errors from both Fortnox and Visma:

**Fortnox Error:**
```json
{
  "error": "redirect_uri_mismatch",
  "error_description": "The redirect URI provided is missing or does not match",
  "error_uri": "http://tools.ietf.org/html/rfc6749#section-3.1.2"
}
```

**Visma Error:**
- `invalid_request` error page
- Tracking ID: 40030742-0000-cd00-b63f-84710c7967bb

**Current Implementation:**
- Next.js 16 App Router
- OAuth 2.0 Authorization Code Flow
- Dynamic redirect URI from request headers: `http://localhost:3000/api/integrations/callback/{provider}`
- Redirect URI stored in OAuth state parameter for consistency

**Current Code Flow:**
1. User clicks "Connect" → `/api/integrations/authorize/{provider}`
2. Route gets base URL from request headers: `const baseUrl = process.env.NEXT_PUBLIC_APP_URL || ${protocol}://${host}`
3. OAuthManager generates auth URL with redirect URI: `${baseUrl}/api/integrations/callback/{provider}`
4. Redirect URI stored in state parameter
5. Callback route uses redirect URI from state for token exchange

**What we've tried:**
- ✅ Fixed `undefined` in redirect URI by using request headers
- ✅ Stored redirect URI in state parameter
- ✅ Used same redirect URI in token exchange
- ❌ Still getting mismatch errors

---

## PROMPT 1: Claude 4.5 (Comprehensive Solution)

```
I'm implementing OAuth 2.0 integration for Fortnox and Visma in a Next.js 16 application and getting redirect_uri_mismatch errors.

**Current Setup:**
- Next.js 16 App Router with TypeScript
- OAuth 2.0 Authorization Code Flow
- Dynamic redirect URI: `http://localhost:3000/api/integrations/callback/{provider}`
- Base URL extracted from request headers: `const baseUrl = process.env.NEXT_PUBLIC_APP_URL || ${protocol}://${host}`

**Error Details:**
- Fortnox: `{"error":"redirect_uri_mismatch","error_description":"The redirect URI provided is missing or does not match"}`
- Visma: `invalid_request` error page

**Current Implementation:**
1. Authorize route (`/api/integrations/authorize/{provider}`) gets base URL from headers
2. OAuthManager generates auth URL with redirect URI: `${baseUrl}/api/integrations/callback/{provider}`
3. Redirect URI stored in OAuth state parameter
4. Callback route (`/api/integrations/callback/{provider}`) uses redirect URI from state for token exchange

**Questions:**
1. What are the exact requirements for registering redirect URIs in Fortnox and Visma developer portals?
2. Are there differences between localhost and production redirect URIs?
3. Should redirect URIs include trailing slashes or specific protocols?
4. How do we handle multiple redirect URIs (localhost, staging, production)?
5. What's the best practice for dynamic redirect URIs in OAuth flows?
6. Are there any Fortnox/Visma-specific OAuth requirements we're missing?

**Please provide:**
- Step-by-step guide for registering redirect URIs in both Fortnox and Visma developer portals
- Code fixes for our current implementation
- Best practices for handling multiple environments (dev/staging/prod)
- Debugging steps to verify redirect URI matches exactly
- Common pitfalls and how to avoid them
```

---

## PROMPT 2: ChatGPT 5 (Practical Debugging)

```
I need help debugging OAuth 2.0 redirect_uri_mismatch errors for Fortnox and Visma integrations.

**Problem:**
- Fortnox returns: `{"error":"redirect_uri_mismatch","error_description":"The redirect URI provided is missing or does not match"}`
- Visma returns: `invalid_request` error
- Both errors occur during OAuth authorization flow

**Current Code:**
```typescript
// Authorize route
const host = request.headers.get('host');
const protocol = request.headers.get('x-forwarded-proto') || 'http';
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;
const redirectUri = `${baseUrl}/api/integrations/callback/${provider}`;
```

**What I need:**
1. A debugging checklist to verify redirect URI matches exactly
2. How to log/verify what redirect URI is being sent vs what's registered
3. Common causes of redirect_uri_mismatch and how to fix them
4. How to register redirect URIs correctly in Fortnox/Visma developer portals
5. Code improvements to ensure redirect URI consistency
6. Testing strategies for OAuth flows in development vs production

**Please provide:**
- Debugging steps with code examples
- Console logging strategies to trace redirect URI through the flow
- Exact format requirements for Fortnox and Visma redirect URIs
- How to handle localhost vs production URLs
- Quick fixes we can implement immediately
```

---

## PROMPT 3: Gemini 2.5 (Fortnox/Visma Specific)

```
I'm integrating with Fortnox and Visma APIs using OAuth 2.0 and encountering redirect URI mismatch errors.

**Fortnox Error:**
```json
{
  "error": "redirect_uri_mismatch",
  "error_description": "The redirect URI provided is missing or does not match"
}
```

**Visma Error:**
- `invalid_request` error page

**Technical Context:**
- Next.js 16 App Router
- OAuth 2.0 Authorization Code Flow
- Redirect URI: `http://localhost:3000/api/integrations/callback/{provider}`
- Using dynamic base URL from request headers

**Specific Questions:**
1. What are Fortnox's exact requirements for redirect URI registration in their developer portal?
   - Where do I register redirect URIs?
   - What format is required?
   - Can I register multiple URIs (localhost, staging, production)?
   - Are there any restrictions on localhost URIs?

2. What are Visma eAccounting's exact requirements for redirect URI registration?
   - Where is the developer portal/app settings?
   - What format is required?
   - Any differences from standard OAuth 2.0?

3. Are there any Fortnox/Visma-specific OAuth quirks or requirements?
   - Special headers needed?
   - Different redirect URI handling?
   - Environment-specific requirements?

4. How should we structure redirect URIs for multi-environment setup?
   - Development: `http://localhost:3000/api/integrations/callback/{provider}`
   - Staging: `https://staging.example.com/api/integrations/callback/{provider}`
   - Production: `https://app.example.com/api/integrations/callback/{provider}`

**Please provide:**
- Exact steps to register redirect URIs in Fortnox developer portal
- Exact steps to register redirect URIs in Visma developer portal
- Code examples showing correct redirect URI handling
- Environment-specific configuration recommendations
- Any Fortnox/Visma-specific OAuth documentation links
```

---

## PROMPT 4: Deepseek Thinking (Technical Deep Dive)

```
I need a deep technical analysis of OAuth 2.0 redirect URI mismatch errors in a Next.js application integrating with Fortnox and Visma.

**Architecture:**
- Next.js 16 App Router (Server Components + API Routes)
- OAuth 2.0 Authorization Code Flow
- Multi-tenant Supabase backend
- Dynamic redirect URI generation from request headers

**Current Implementation Flow:**
```
1. User clicks "Connect" → GET /api/integrations/authorize/{provider}
2. Route extracts base URL: baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`
3. OAuthManager.generateAuthorizationUrl(provider, tenantId, baseUrl)
   - Constructs redirectUri: `${baseUrl}/api/integrations/callback/${provider}`
   - Stores redirectUri in OAuth state parameter
   - Returns authorization URL with redirect_uri query param
4. User authorizes → Provider redirects to callback URL
5. Callback route extracts redirectUri from state
6. Token exchange uses same redirectUri from state
```

**Error Analysis Needed:**
1. Why would redirect_uri_mismatch occur even when redirect URI is consistent?
2. Are there encoding/decoding issues with redirect URIs?
3. Could request header extraction be unreliable?
4. Are there OAuth 2.0 spec compliance issues?
5. Could provider-specific validation be stricter than standard OAuth?

**Technical Questions:**
1. RFC 6749 Section 3.1.2 compliance - are we following it correctly?
2. Redirect URI encoding: Should we URL-encode the redirect_uri parameter?
3. State parameter: Is storing redirect URI in state secure and reliable?
4. Request headers: Are `host` and `x-forwarded-proto` reliable in all environments?
5. Multiple redirect URIs: How should we handle dev/staging/prod?

**Please provide:**
- Deep technical analysis of OAuth 2.0 redirect URI requirements
- Code review of our current implementation
- Security considerations for redirect URI handling
- Best practices for multi-environment OAuth flows
- Alternative approaches (e.g., environment-based redirect URI selection)
- RFC 6749 compliance verification
- Provider-specific OAuth implementation details for Fortnox/Visma
```

---

## Expected Solutions

After receiving responses from all 4 AIs, we'll:
1. Compare solutions and identify common patterns
2. Implement the most robust solution
3. Add proper redirect URI registration documentation
4. Create environment-specific configuration
5. Add debugging/logging for redirect URI verification

