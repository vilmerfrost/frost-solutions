# Auth Redirect Fix for ngrok and Multi-Origin Support

## Problem

When accessing the app via ngrok (e.g., `https://abc123.ngrok-free.dev`), the login flow was redirecting to hard-coded `http://localhost:3001/dashboard` instead of staying on the ngrok domain. This broke access for external agents and users accessing via the public ngrok URL.

## Root Cause

The app had several places with hard-coded localhost URLs:
1. **Supabase auth email redirects** - Used `NEXT_PUBLIC_SITE_URL` which was set to localhost
2. **OAuth redirects** - Used static `NEXT_PUBLIC_APP_URL` 
3. **Internal API calls** - Some used hard-coded localhost URLs instead of relative paths
4. **Email links** - Invoice/quote links used hard-coded localhost

## Solution

### 1. Created `getBaseUrl()` Utility (`app/utils/url.ts`)

A new utility that:
- **In the browser**: Always uses `window.location.origin` (works with localhost, ngrok, production)
- **On the server**: Falls back to `NEXT_PUBLIC_SITE_URL` or `NEXT_PUBLIC_APP_URL`

This ensures redirects always use the current origin, regardless of how the app is accessed.

### 2. Fixed Supabase Auth Redirects

**File: `app/auth/actions.ts`**
- Changed `emailRedirectTo` to use `getBaseUrlFromHeaders()` which extracts origin from request headers
- Works with ngrok's `x-forwarded-host` and `x-forwarded-proto` headers

**File: `app/login/page.tsx`**
- Already correctly uses `window.location.origin` for OAuth redirects ✅

**File: `app/auth/callback/page.tsx`**
- Already uses relative paths for redirects ✅

### 3. Fixed Internal API Calls

**File: `app/dashboard/page.tsx`**
- Changed hard-coded localhost fetch to relative path: `/api/auth/link-employee`

**File: `app/api/clients/[id]/archive/route.ts`**
- Changed hard-coded localhost fetch to use request URL origin

### 4. Fixed Email Links

**File: `app/invoices/[id]/actions.ts`**
- Changed to use `getBaseUrlFromHeaders()` for invoice view URLs in emails

**File: `app/api/quotes/[id]/send/route.ts`**
- Changed to use `getBaseUrlFromHeaders()` for email tracking URLs

### 5. OAuth Integrations (Fortnox/Visma)

**Files: `app/lib/integrations/oauth/providers.ts`, `app/lib/integrations/oauth/OAuthManager.ts`, `app/api/integrations/authorize/[provider]/route.ts`**

- Added support for dynamic base URLs via `overrideBaseUrl` parameter
- The authorize route now extracts origin from request headers and passes it to OAuthManager
- **Important**: OAuth providers (Fortnox/Visma) require redirect URIs to be pre-registered in their developer portals. If using ngrok, you'll need to register the ngrok URL there as well.

## How It Works Now

### Browser (Client-Side)
```typescript
// Always uses current origin
const baseUrl = getBaseUrl(); // Returns window.location.origin
```

### Server-Side
```typescript
// Extracts from request headers (works with ngrok, proxies, etc.)
const headers = await headers();
const baseUrl = getBaseUrlFromHeaders(headers);
```

### Redirects
- All internal navigation uses **relative paths** (`/dashboard`, `/login`, etc.)
- Only external links (emails, OAuth callbacks) use full URLs with `getBaseUrl()`

## Testing

### Manual Test Plan

1. **Local Development**
   ```bash
   npm run dev
   # App runs on http://localhost:3001
   ```
   - Visit `http://localhost:3001/login`
   - Login with existing flow
   - ✅ Should redirect to `http://localhost:3001/dashboard`

2. **ngrok Testing**
   ```bash
   npm run dev
   ngrok http 3001
   # ngrok provides URL like https://abc123.ngrok-free.dev
   ```
   - Visit `https://abc123.ngrok-free.dev/login`
   - Login with existing flow
   - ✅ Should redirect to `https://abc123.ngrok-free.dev/dashboard`
   - ✅ Should **never** see `http://localhost:3001` in address bar

3. **Production**
   - Visit `https://frostsolutions.se/login`
   - Login with existing flow
   - ✅ Should redirect to `https://frostsolutions.se/dashboard`

## Environment Variables

The following environment variables are still used as fallbacks but are no longer hard-coded in redirects:

- `NEXT_PUBLIC_SITE_URL` - Used as fallback on server when headers aren't available
- `NEXT_PUBLIC_APP_URL` - Used for OAuth integrations (Fortnox/Visma) as default

**Note**: For ngrok usage, you don't need to change these - the app will automatically detect and use the ngrok origin from request headers.

## Supabase Dashboard Configuration

In Supabase Auth settings, you should manually add:
- `http://localhost:3001/*` (for local development)
- `https://<your-ngrok>.ngrok-free.dev/*` (for ngrok testing)
- `https://frostsolutions.se/*` (for production)

The app will automatically use the correct origin based on the current request.

## OAuth Provider Configuration

For OAuth integrations (Fortnox/Visma) to work with ngrok:
1. Register the ngrok redirect URI in Fortnox/Visma developer portals:
   - `https://<your-ngrok>.ngrok-free.dev/api/integrations/callback/fortnox`
   - `https://<your-ngrok>.ngrok-free.dev/api/integrations/callback/visma`
2. The app will automatically use the ngrok URL when accessed via ngrok

## Files Modified

- `app/utils/url.ts` (new) - Base URL utility
- `app/auth/actions.ts` - Use getBaseUrlFromHeaders for email redirects
- `app/dashboard/page.tsx` - Use relative path for API call
- `app/invoices/[id]/actions.ts` - Use getBaseUrlFromHeaders for email links
- `app/api/quotes/[id]/send/route.ts` - Use getBaseUrlFromHeaders for tracking URLs
- `app/api/clients/[id]/archive/route.ts` - Use request origin for API call
- `app/lib/integrations/oauth/providers.ts` - Support dynamic base URLs
- `app/lib/integrations/oauth/OAuthManager.ts` - Accept overrideBaseUrl parameter
- `app/api/integrations/authorize/[provider]/route.ts` - Extract origin from request

## Summary

All redirects now stay on the same origin as the current request:
- ✅ `http://localhost:3001/login` → `http://localhost:3001/dashboard`
- ✅ `https://abc123.ngrok-free.dev/login` → `https://abc123.ngrok-free.dev/dashboard`
- ✅ `https://frostsolutions.se/login` → `https://frostsolutions.se/dashboard`

No more hard-coded localhost redirects! 🎉

