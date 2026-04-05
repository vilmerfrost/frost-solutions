# Phase 1: Foundation Hardening — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every existing feature production-grade — consistent API patterns, hardened Stripe billing, consolidated AI provider, proper tests, and verified security.

**Architecture:** Introduce shared infrastructure (response helpers, auth middleware, validation schemas) that all 162+ API routes use. Fix Stripe webhook reliability with idempotency. Consolidate 6 AI providers into OpenRouter. Split oversized components. Add unit + integration tests for all business logic.

**Tech Stack:** Next.js 16, TypeScript strict, Zod 4, Supabase, Stripe, OpenRouter, Jest, Playwright

**Spec:** `docs/superpowers/specs/2026-04-05-frost-solutions-v2-overhaul-design.md` (Phase 1)

---

## Task 1: Shared API Infrastructure

Create reusable helpers that standardize auth, validation, responses, and error handling across all API routes. This is the foundation everything else builds on.

**Files:**
- Create: `app/lib/api/response.ts`
- Create: `app/lib/api/auth.ts`
- Create: `app/lib/api/validate.ts`
- Create: `app/lib/api/errors.ts`
- Test: `__tests__/lib/api/response.test.ts`
- Test: `__tests__/lib/api/auth.test.ts`
- Test: `__tests__/lib/api/validate.test.ts`

### Step 1.1: Write failing tests for API response helpers

- [ ] Create `__tests__/lib/api/response.test.ts`:

```typescript
import { apiSuccess, apiError, apiPaginated } from '@/lib/api/response'

describe('apiSuccess', () => {
  it('returns 200 with data wrapped in standard shape', () => {
    const res = apiSuccess({ projects: [{ id: '1' }] })
    expect(res.status).toBe(200)
    // Response is NextResponse, parse body
  })

  it('accepts custom status code', () => {
    const res = apiSuccess({ id: '1' }, 201)
    expect(res.status).toBe(201)
  })
})

describe('apiError', () => {
  it('returns error with status and message', () => {
    const res = apiError('Not found', 404)
    expect(res.status).toBe(404)
  })

  it('defaults to 500', () => {
    const res = apiError('Something broke')
    expect(res.status).toBe(500)
  })
})

describe('apiPaginated', () => {
  it('includes pagination metadata', () => {
    const res = apiPaginated([], { page: 1, limit: 20, total: 100 })
    expect(res.status).toBe(200)
  })
})
```

- [ ] Run: `pnpm test -- __tests__/lib/api/response.test.ts`
- Expected: FAIL — module not found

### Step 1.2: Implement API response helpers

- [ ] Create `app/lib/api/response.ts`:

```typescript
import { NextResponse } from 'next/server'

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status })
}

export function apiError(message: string, status = 500, details?: Record<string, unknown>) {
  return NextResponse.json(
    { success: false, error: message, ...(details && { details }) },
    { status }
  )
}

export function apiPaginated<T>(
  data: T[],
  meta: { page: number; limit: number; total: number }
) {
  return NextResponse.json({
    success: true,
    data,
    meta: {
      ...meta,
      totalPages: Math.ceil(meta.total / meta.limit),
      hasMore: meta.page * meta.limit < meta.total,
    },
  })
}
```

- [ ] Run: `pnpm test -- __tests__/lib/api/response.test.ts`
- Expected: PASS

### Step 1.3: Write failing tests for auth helper

- [ ] Create `__tests__/lib/api/auth.test.ts`:

```typescript
import { resolveAuth } from '@/lib/api/auth'

// Mock Supabase
jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(),
}))

describe('resolveAuth', () => {
  it('returns error response when no user session', async () => {
    const result = await resolveAuth()
    expect(result.error).toBeDefined()
  })

  it('returns user and tenantId when authenticated', async () => {
    // Test with mocked session
  })
})
```

- [ ] Run: `pnpm test -- __tests__/lib/api/auth.test.ts`
- Expected: FAIL

### Step 1.4: Implement auth helper

- [ ] Create `app/lib/api/auth.ts`:

```typescript
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { apiError } from './response'

type AuthResult =
  | { user: { id: string; email: string; app_metadata: Record<string, unknown> }; tenantId: string; error: null }
  | { user: null; tenantId: null; error: ReturnType<typeof apiError> }

export async function resolveAuth(): Promise<AuthResult> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return { user: null, tenantId: null, error: apiError('Unauthorized', 401) }
  }

  const tenantId = (user.app_metadata as Record<string, string>)?.tenant_id
  if (!tenantId) {
    return { user: null, tenantId: null, error: apiError('No tenant associated with user', 403) }
  }

  return { user: { id: user.id, email: user.email ?? '', app_metadata: user.app_metadata ?? {} }, tenantId, error: null }
}

export async function resolveAuthAdmin() {
  const result = await resolveAuth()
  if (result.error) return result

  const admin = createAdminClient()
  return { ...result, admin }
}
```

- [ ] Run: `pnpm test -- __tests__/lib/api/auth.test.ts`
- Expected: PASS

### Step 1.5: Implement validation helper with Zod

- [ ] Create `app/lib/api/validate.ts`:

```typescript
import { z } from 'zod'
import { apiError } from './response'
import { NextRequest } from 'next/server'

export async function parseBody<T extends z.ZodSchema>(
  req: NextRequest,
  schema: T
): Promise<{ data: z.infer<T>; error: null } | { data: null; error: ReturnType<typeof apiError> }> {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return { data: null, error: apiError('Invalid JSON body', 400) }
  }

  const result = schema.safeParse(body)
  if (!result.success) {
    const issues = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`)
    return { data: null, error: apiError('Validation failed', 400, { issues }) }
  }

  return { data: result.data, error: null }
}

export function parseSearchParams<T extends z.ZodSchema>(
  req: NextRequest,
  schema: T
): { data: z.infer<T>; error: null } | { data: null; error: ReturnType<typeof apiError> } {
  const params = Object.fromEntries(req.nextUrl.searchParams.entries())
  const result = schema.safeParse(params)
  if (!result.success) {
    const issues = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`)
    return { data: null, error: apiError('Invalid query parameters', 400, { issues }) }
  }
  return { data: result.data, error: null }
}
```

- [ ] Create `__tests__/lib/api/validate.test.ts` with tests for both `parseBody` and `parseSearchParams`

- [ ] Run: `pnpm test -- __tests__/lib/api/validate.test.ts`
- Expected: PASS

### Step 1.6: Create shared error utilities

- [ ] Create `app/lib/api/errors.ts`:

```typescript
import { apiError } from './response'

export function handleRouteError(error: unknown) {
  if (error instanceof Error) {
    const status = 'status' in error ? (error as { status: number }).status : 500
    return apiError(error.message, status)
  }
  return apiError('An unexpected error occurred', 500)
}
```

### Step 1.7: Create barrel export

- [ ] Create `app/lib/api/index.ts`:

```typescript
export { apiSuccess, apiError, apiPaginated } from './response'
export { resolveAuth, resolveAuthAdmin } from './auth'
export { parseBody, parseSearchParams } from './validate'
export { handleRouteError } from './errors'
```

### Step 1.8: Commit

- [ ] Run:
```bash
git add app/lib/api/ __tests__/lib/api/
git commit -m "feat: add shared API infrastructure (response, auth, validation helpers)"
```

---

## Task 2: Migrate API Routes to Shared Infrastructure

Apply the new shared helpers to all API routes. Start with 5 representative routes, then systematically migrate the rest.

**Files:**
- Modify: `app/api/projects/route.ts`
- Modify: `app/api/materials/route.ts`
- Modify: `app/api/clients/create/route.ts`
- Modify: `app/api/employees/create/route.ts`
- Modify: `app/api/invoices/create/route.ts`
- Modify: All remaining `app/api/**/route.ts` files

### Step 2.1: Migrate projects route as reference implementation

- [ ] Rewrite `app/api/projects/route.ts` using the new helpers:

```typescript
import { z } from 'zod'
import { resolveAuthAdmin, parseBody, apiSuccess, handleRouteError } from '@/lib/api'

const CreateProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  client_id: z.string().uuid().optional(),
  description: z.string().optional(),
  status: z.enum(['planned', 'active', 'completed', 'archived']).default('planned'),
  budget: z.number().positive().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const body = await parseBody(req, CreateProjectSchema)
    if (body.error) return body.error

    const { data, error } = await auth.admin
      .from('projects')
      .insert({ ...body.data, tenant_id: auth.tenantId })
      .select()
      .single()

    if (error) throw error
    return apiSuccess({ project: data }, 201)
  } catch (error) {
    return handleRouteError(error)
  }
}
```

- [ ] Run: `pnpm dev` and test the route manually or with existing E2E tests
- Expected: Same behavior, cleaner code

### Step 2.2: Migrate materials, clients, employees, invoices routes

- [ ] Apply the same pattern to each route:
  1. Replace manual auth with `resolveAuth()` or `resolveAuthAdmin()`
  2. Replace manual validation with Zod schema + `parseBody()`
  3. Replace manual response construction with `apiSuccess()` / `apiError()`
  4. Replace catch blocks with `handleRouteError()`
  5. Remove `as any` casts — use proper types from Zod schemas

- [ ] For each route, verify the Zod schema matches all fields the frontend sends

### Step 2.3: Systematically migrate remaining routes

- [ ] Work through `app/api/` directory by directory:
  - `app/api/time-entries/` — CRUD routes
  - `app/api/payroll/` — payroll calculation routes
  - `app/api/rot/` — ROT application routes
  - `app/api/quotes/` — quote management
  - `app/api/work-orders/` — work order routes
  - `app/api/supplier-invoices/` — supplier invoice routes
  - `app/api/suppliers/` — supplier management
  - `app/api/notifications/` — notification routes
  - `app/api/auth/` — auth-related routes
  - `app/api/integrations/` — Fortnox/Visma integration routes
  - `app/api/cron/` — cron job routes
  - `app/api/subscriptions/` — subscription routes

- [ ] For each route: add Zod schema, use shared auth, use shared response, remove `as any`

### Step 2.4: Commit after each directory

- [ ] Commit after each directory is migrated:
```bash
git add app/api/<directory>/
git commit -m "refactor: migrate <directory> API routes to shared infrastructure"
```

---

## Task 3: Stripe Hardening

Fix all critical Stripe reliability issues: webhook idempotency, dynamic checkout, API version, grace period.

**Files:**
- Create: `app/lib/stripe/client.ts`
- Create: `app/lib/stripe/idempotency.ts`
- Modify: `app/api/stripe/webhook/route.ts`
- Modify: `app/api/stripe/create-checkout/route.ts`
- Modify: `app/api/stripe/create-payment-intent/route.ts`
- Modify: `app/api/subscriptions/current/route.ts`
- Modify: `app/settings/subscription/page.tsx`
- Modify: `app/components/SubscriptionCTA.tsx`
- Create: `supabase/migrations/phase1_stripe_events.sql`
- Test: `__tests__/lib/stripe/idempotency.test.ts`

### Step 3.1: Create shared Stripe client

- [ ] Create `app/lib/stripe/client.ts`:

```typescript
import Stripe from 'stripe'

let stripeInstance: Stripe | null = null

export function getStripe(): Stripe {
  if (stripeInstance) return stripeInstance

  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY is not configured')

  stripeInstance = new Stripe(key, {
    apiVersion: '2025-12-18.acacia', // Latest stable version
  })

  return stripeInstance
}
```

**Note:** Check the latest stable Stripe API version at https://stripe.com/docs/upgrades before using. Replace `2025-12-18.acacia` with whatever is current. The key point is replacing the test version `2025-12-15.clover`.

### Step 3.2: Create Stripe events migration for idempotency

- [ ] Create `supabase/migrations/phase1_stripe_events.sql`:

```sql
-- Stripe webhook event deduplication table
CREATE TABLE IF NOT EXISTS public.stripe_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'processed' CHECK (status IN ('processed', 'failed')),
  error_message TEXT,
  payload JSONB
);

CREATE INDEX idx_stripe_events_stripe_id ON public.stripe_events(stripe_event_id);
CREATE INDEX idx_stripe_events_status ON public.stripe_events(status);

-- Add past_due_since column to subscriptions if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'past_due_since'
  ) THEN
    ALTER TABLE public.subscriptions ADD COLUMN past_due_since TIMESTAMPTZ;
  END IF;
END $$;

-- RLS
ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON public.stripe_events
  FOR ALL USING (auth.role() = 'service_role');
```

- [ ] Run: `supabase db push` to apply migration

### Step 3.3: Write failing test for idempotency helper

- [ ] Create `__tests__/lib/stripe/idempotency.test.ts`:

```typescript
import { isEventProcessed, markEventProcessed } from '@/lib/stripe/idempotency'

// Mock Supabase admin client
jest.mock('@/utils/supabase/admin', () => ({
  createAdminClient: () => ({
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue({ data: null }),
    insert: jest.fn().mockResolvedValue({ error: null }),
  }),
}))

describe('isEventProcessed', () => {
  it('returns false for new events', async () => {
    const result = await isEventProcessed('evt_new_123')
    expect(result).toBe(false)
  })
})

describe('markEventProcessed', () => {
  it('stores event ID in database', async () => {
    await expect(markEventProcessed('evt_123', 'payment_intent.succeeded')).resolves.not.toThrow()
  })
})
```

- [ ] Run: `pnpm test -- __tests__/lib/stripe/idempotency.test.ts`
- Expected: FAIL

### Step 3.4: Implement idempotency helper

- [ ] Create `app/lib/stripe/idempotency.ts`:

```typescript
import { createAdminClient } from '@/utils/supabase/admin'

export async function isEventProcessed(stripeEventId: string): Promise<boolean> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('stripe_events')
    .select('id')
    .eq('stripe_event_id', stripeEventId)
    .maybeSingle()

  return data !== null
}

export async function markEventProcessed(
  stripeEventId: string,
  eventType: string,
  payload?: unknown
): Promise<void> {
  const admin = createAdminClient()
  await admin.from('stripe_events').insert({
    stripe_event_id: stripeEventId,
    event_type: eventType,
    status: 'processed',
    payload: payload ?? null,
  })
}

export async function markEventFailed(
  stripeEventId: string,
  eventType: string,
  errorMessage: string,
  payload?: unknown
): Promise<void> {
  const admin = createAdminClient()
  await admin.from('stripe_events').upsert({
    stripe_event_id: stripeEventId,
    event_type: eventType,
    status: 'failed',
    error_message: errorMessage,
    payload: payload ?? null,
  }, { onConflict: 'stripe_event_id' })
}
```

- [ ] Run: `pnpm test -- __tests__/lib/stripe/idempotency.test.ts`
- Expected: PASS

### Step 3.5: Update webhook handler with idempotency

- [ ] Modify `app/api/stripe/webhook/route.ts`:
  1. Replace inline `getStripe()` with import from `@/lib/stripe/client`
  2. After signature verification, add idempotency check:

```typescript
import { isEventProcessed, markEventProcessed, markEventFailed } from '@/lib/stripe/idempotency'

// After constructEvent succeeds:
if (await isEventProcessed(event.id)) {
  return NextResponse.json({ received: true, skipped: 'duplicate' })
}

try {
  // ... existing switch/case handler ...
  await markEventProcessed(event.id, event.type, event.data.object)
} catch (handlerError) {
  await markEventFailed(event.id, event.type, (handlerError as Error).message, event.data.object)
  throw handlerError
}
```

  3. In `handleSubscriptionUpdated`, when status changes to `past_due`, set `past_due_since`:

```typescript
if (subscription.status === 'past_due') {
  updateData.past_due_since = new Date().toISOString()
}
if (subscription.status === 'active') {
  updateData.past_due_since = null // Clear when payment succeeds
}
```

### Step 3.6: Fix grace period logic

- [ ] Modify `app/api/subscriptions/current/route.ts`:
  - Remove `updated_at` fallback, require `past_due_since`:

```typescript
if (subscription.status === 'past_due' && subscription.past_due_since) {
  const pastDueDate = new Date(subscription.past_due_since)
  gracePeriodEnd = new Date(pastDueDate.getTime() + GRACE_PERIOD_DAYS * 86400000).toISOString()
  graceDaysRemaining = Math.max(0, Math.ceil((new Date(gracePeriodEnd).getTime() - Date.now()) / 86400000))
  isInGracePeriod = graceDaysRemaining > 0
}
```

### Step 3.7: Replace hardcoded payment links

- [ ] Modify `app/settings/subscription/page.tsx`:
  - Replace line 68 (`const paymentLink = 'https://buy.stripe.com/...'`) with a call to `/api/stripe/create-checkout`:

```typescript
const handleStartSubscription = async () => {
  setLoading(true)
  try {
    const res = await fetch('/app/api/stripe/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ billing_cycle: selectedCycle }),
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
  } catch (error) {
    toast.error('Kunde inte starta checkout')
  } finally {
    setLoading(false)
  }
}
```

- [ ] Modify `app/components/SubscriptionCTA.tsx`:
  - Replace hardcoded link (line 14) with same dynamic checkout pattern

### Step 3.8: Update Stripe client imports across all Stripe routes

- [ ] In `app/api/stripe/create-checkout/route.ts`, `create-payment-intent/route.ts`:
  - Replace inline `getStripe()` function with `import { getStripe } from '@/lib/stripe/client'`
  - Remove the duplicated function definition

### Step 3.9: Commit

- [ ] Run:
```bash
git add app/lib/stripe/ app/api/stripe/ app/api/subscriptions/ app/settings/subscription/ app/components/SubscriptionCTA.tsx supabase/migrations/phase1_stripe_events.sql __tests__/lib/stripe/
git commit -m "fix: harden Stripe with webhook idempotency, dynamic checkout, and stable API version"
```

---

## Task 4: AI Provider Consolidation

Migrate all remaining AI endpoints from Gemini/HuggingFace/OpenAI to OpenRouter. Create a single AI client that all endpoints use.

**Files:**
- Create: `app/lib/ai/openrouter-client.ts`
- Modify: `app/api/ai/invoice-ocr/route.ts`
- Modify: `app/api/ai/receipt-ocr/route.ts`
- Modify: `app/api/ai/delivery-note-ocr/route.ts`
- Modify: `app/api/ai/identify-material/route.ts`
- Modify: `app/api/ai/summarize/route.ts`
- Modify: `app/api/ai/rot-summary/route.ts`
- Modify: `app/api/ai/monthly-report/route.ts`
- Modify: `app/api/ai/predict-budget/route.ts`
- Modify: `app/api/ai/project-insights/route.ts`
- Modify: `app/api/ai/validate-payroll/route.ts`
- Delete: `app/lib/ai/openai-client.ts`
- Delete: `app/lib/ai/claude.ts`
- Delete: `app/lib/services/ai.service.ts`
- Modify: `app/lib/ai/frost-bygg-ai-integration.ts`
- Test: `__tests__/lib/ai/openrouter-client.test.ts`

### Step 4.1: Create unified OpenRouter client

- [ ] Create `app/lib/ai/openrouter-client.ts`:

```typescript
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'

export const MODELS = {
  default: 'google/gemini-flash-2.0-exp', // Fast, good for most tasks
  vision: 'google/gemini-flash-2.0-exp',  // Vision-capable for OCR
  powerful: 'google/gemini-2.5-flash-preview', // Complex reasoning
} as const

type ModelKey = keyof typeof MODELS

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string | Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }>
}

interface OpenRouterResponse {
  choices: Array<{
    message: { content: string; role: string }
    finish_reason: string
  }>
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number }
}

export async function chatCompletion(
  messages: ChatMessage[],
  options: {
    model?: ModelKey | string
    temperature?: number
    maxTokens?: number
    responseFormat?: 'json' | 'text'
  } = {}
): Promise<{ content: string; usage: OpenRouterResponse['usage'] }> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is not configured')

  const model = options.model
    ? (MODELS[options.model as ModelKey] ?? options.model)
    : MODELS.default

  const body: Record<string, unknown> = {
    model,
    messages,
    temperature: options.temperature ?? 0.3,
    max_tokens: options.maxTokens ?? 4096,
  }

  if (options.responseFormat === 'json') {
    body.response_format = { type: 'json_object' }
  }

  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://frostsolutions.se',
      'X-Title': 'Frost Solutions',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenRouter API error (${response.status}): ${errorText}`)
  }

  const data: OpenRouterResponse = await response.json()
  const content = data.choices[0]?.message?.content ?? ''

  return { content, usage: data.usage }
}

export async function visionCompletion(
  prompt: string,
  imageBase64: string,
  mimeType: string = 'image/jpeg',
  options: { model?: ModelKey | string; temperature?: number; maxTokens?: number; responseFormat?: 'json' | 'text' } = {}
): Promise<{ content: string; usage: OpenRouterResponse['usage'] }> {
  return chatCompletion(
    [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
        ],
      },
    ],
    { model: options.model ?? 'vision', ...options }
  )
}
```

### Step 4.2: Write test for OpenRouter client

- [ ] Create `__tests__/lib/ai/openrouter-client.test.ts` testing:
  - Model key resolution
  - Request body construction
  - Error handling for missing API key
  - Response parsing

- [ ] Run: `pnpm test -- __tests__/lib/ai/openrouter-client.test.ts`
- Expected: PASS

### Step 4.3: Migrate OCR endpoints

- [ ] For each OCR route (`invoice-ocr`, `receipt-ocr`, `delivery-note-ocr`):
  1. Replace `import { GoogleGenerativeAI } from '@google/generative-ai'` with `import { visionCompletion } from '@/lib/ai/openrouter-client'`
  2. Replace `model.generateContent(...)` calls with `visionCompletion(prompt, base64, mimeType, { responseFormat: 'json' })`
  3. Keep the same Zod schemas for output validation
  4. Keep the payment wrapper intact

- [ ] Test each endpoint manually with a sample image upload

### Step 4.4: Migrate remaining AI endpoints

- [ ] For `summarize`, `rot-summary`, `monthly-report`, `predict-budget`, `project-insights`, `validate-payroll`:
  1. Replace direct Gemini/HuggingFace calls with `chatCompletion()` from OpenRouter client
  2. Keep existing system prompts and Zod schemas
  3. Keep payment wrapper

### Step 4.5: Update frost-bygg-ai-integration.ts

- [ ] Modify `app/lib/ai/frost-bygg-ai-integration.ts`:
  - Replace all Gemini and Groq client creation with OpenRouter calls
  - Keep all the schema definitions and validation logic
  - Remove `@google/generative-ai` and Groq imports

### Step 4.6: Delete legacy AI provider files

- [ ] Delete:
  - `app/lib/ai/openai-client.ts`
  - `app/lib/ai/claude.ts`
  - `app/lib/services/ai.service.ts`

- [ ] Verify no imports reference these files:
```bash
pnpm typecheck
```

### Step 4.7: Clean up .env.example

- [ ] Modify `.env.example`:
  - Remove `GEMINI_API_KEY`, `GROQ_API_KEY`, `OPENAI_API_KEY`, `GOOGLE_VISION_API_KEY`, `HUGGING_FACE_API_KEY`, `ANTHROPIC_API_KEY`
  - Keep `OPENROUTER_API_KEY` as the only AI provider key
  - Keep `GOOGLE_DOC_AI_PROCESSOR_NAME` etc. if Google Document AI is used separately from the AI chat

### Step 4.8: Commit

- [ ] Run:
```bash
git add app/lib/ai/ app/api/ai/ .env.example __tests__/lib/ai/
git commit -m "refactor: consolidate all AI providers to OpenRouter (Gemini Flash 3.1 Preview)"
```

---

## Task 5: Split DashboardClient.tsx

Break the ~600-line monolith into focused sub-components.

**Files:**
- Create: `app/dashboard/components/DashboardStats.tsx`
- Create: `app/dashboard/components/DashboardProjects.tsx`
- Create: `app/dashboard/components/DashboardTimeTracking.tsx`
- Create: `app/dashboard/components/DashboardActivity.tsx`
- Create: `app/dashboard/components/DashboardQuickActions.tsx`
- Modify: `app/dashboard/DashboardClient.tsx`

### Step 5.1: Extract stats container

- [ ] Create `app/dashboard/components/DashboardStats.tsx`:
  - Move the stats fetching logic (project count, hours this week, invoice totals, pending approvals)
  - Self-contained component with its own data fetching via React Query
  - Handles loading/error states independently

### Step 5.2: Extract projects container

- [ ] Create `app/dashboard/components/DashboardProjects.tsx`:
  - Move the project list, filters, and recent project display
  - Self-contained with own data fetching

### Step 5.3: Extract time tracking container

- [ ] Create `app/dashboard/components/DashboardTimeTracking.tsx`:
  - Move TimeClock dynamic import and its container logic
  - Employee ID resolution and project assignment

### Step 5.4: Extract activity and quick actions

- [ ] Create `app/dashboard/components/DashboardActivity.tsx`:
  - Recent activity feed
- [ ] Create `app/dashboard/components/DashboardQuickActions.tsx`:
  - Quick action buttons (new project, log time, create invoice, etc.)

### Step 5.5: Simplify DashboardClient.tsx

- [ ] Rewrite `app/dashboard/DashboardClient.tsx` as a layout component:

```typescript
'use client'

import { Suspense } from 'react'
import { DashboardStats } from './components/DashboardStats'
import { DashboardProjects } from './components/DashboardProjects'
import { DashboardTimeTracking } from './components/DashboardTimeTracking'
import { DashboardActivity } from './components/DashboardActivity'
import { DashboardQuickActions } from './components/DashboardQuickActions'

export default function DashboardClient() {
  return (
    <div className="space-y-6">
      <DashboardQuickActions />
      <DashboardStats />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardTimeTracking />
        <DashboardProjects />
      </div>
      <DashboardActivity />
    </div>
  )
}
```

### Step 5.6: Remove `as any` casts

- [ ] In each extracted component, replace `as any` with proper types
- [ ] Run: `pnpm typecheck`
- Expected: PASS with no errors

### Step 5.7: Commit

- [ ] Run:
```bash
git add app/dashboard/
git commit -m "refactor: split DashboardClient into focused sub-components"
```

---

## Task 6: Legacy Code Cleanup

Remove dead code, unused imports, and legacy patterns.

**Files:**
- Modify: `app/context/TenantContext.tsx` (remove localStorage fallback)
- Delete: Various unused files identified during migration
- Modify: Multiple files with dead imports

### Step 6.1: Remove localStorage tenant fallback

- [ ] In `app/context/TenantContext.tsx`:
  - Remove any `localStorage.getItem('tenant_id')` or `localStorage.setItem('tenant_id', ...)` calls
  - The tenant resolution chain should be: JWT claims -> API -> DB lookup only
  - Keep the context provider structure, just remove localStorage from the fallback chain

### Step 6.2: Remove unused HuggingFace client

- [ ] Delete `app/lib/ai/huggingface.ts` if all references have been migrated in Task 4

### Step 6.3: Clean up unused imports across codebase

- [ ] Run: `pnpm typecheck` — fix any errors from deleted files
- [ ] Run: `pnpm lint` — fix any unused import warnings

### Step 6.4: Remove backward compatibility mappings

- [ ] In `app/api/employees/list/route.ts`:
  - Remove the `base_rate_sek` to `default_rate_sek` mapping if the migration has been applied
  - Or add the proper migration if the column rename hasn't happened

### Step 6.5: Commit

- [ ] Run:
```bash
git add -A
git commit -m "chore: remove legacy code (localStorage tenant, unused AI clients, dead imports)"
```

---

## Task 7: Testing Infrastructure

Set up proper unit test coverage for business logic and integration tests for critical flows.

**Files:**
- Create: `__tests__/lib/payroll/calculateOB.test.ts`
- Create: `__tests__/lib/payroll/calculatePayroll.test.ts`
- Create: `__tests__/lib/pricing/calculateQuoteTotal.test.ts`
- Create: `__tests__/api/stripe-webhook.test.ts`
- Create: `__tests__/api/time-entries.test.ts`
- Modify: `jest.config.js` (if needed)

### Step 7.1: Unit tests for payroll calculations

- [ ] Create `__tests__/lib/payroll/calculateOB.test.ts`:
  - Test OB type determination: normal, evening (18-22), night (22-06), weekend, holiday
  - Test edge cases: shift crossing midnight, shift crossing weekend boundary
  - Test OB rate multipliers match Swedish 2025 rules

- [ ] Create `__tests__/lib/payroll/calculatePayroll.test.ts`:
  - Test employer contribution calculation
  - Test tax table lookup
  - Test net pay calculation
  - Test PAXML export format

### Step 7.2: Unit tests for pricing/budget

- [ ] Create `__tests__/lib/pricing/calculateQuoteTotal.test.ts`:
  - Test basic total calculation
  - Test discount rules
  - Test markup rules
  - Test ROT deduction calculation

### Step 7.3: Integration test for Stripe webhook

- [ ] Create `__tests__/api/stripe-webhook.test.ts`:
  - Test signature verification rejects invalid signatures
  - Test idempotency: same event ID processed only once
  - Test checkout.session.completed creates subscription
  - Test payment_intent.succeeded adds AI credits
  - Test invoice.payment_failed updates status to past_due

### Step 7.4: Run all tests

- [ ] Run:
```bash
pnpm test
```
- Expected: All tests PASS

### Step 7.5: Commit

- [ ] Run:
```bash
git add __tests__/
git commit -m "test: add unit tests for payroll, pricing, and Stripe webhook"
```

---

## Task 8: Security Audit

Verify RLS policies, auth checks, rate limiting, and input sanitization.

**Files:**
- Create: `scripts/security-audit.ts`
- Create: `__tests__/security/rls-isolation.test.ts`
- Modify: Any routes found missing auth checks

### Step 8.1: Audit all API routes for auth

- [ ] Create `scripts/security-audit.ts` that:
  - Scans all `app/api/**/route.ts` files
  - Checks each exports (GET, POST, PUT, DELETE, PATCH)
  - Verifies each handler calls `resolveAuth()` or equivalent
  - Reports any unprotected endpoints

- [ ] Run: `npx tsx scripts/security-audit.ts`
- [ ] Fix any routes found without auth (like `app/api/clients/create/route.ts` which currently uses service role without user auth)

### Step 8.2: Test RLS tenant isolation

- [ ] Create `__tests__/security/rls-isolation.test.ts`:
  - Create two test tenants
  - Insert data for tenant A
  - Query as tenant B
  - Verify tenant B cannot see tenant A's data
  - Test on critical tables: projects, time_entries, invoices, employees

### Step 8.3: Verify rate limiting coverage

- [ ] Check all public-facing endpoints have rate limiting:
  - `/api/auth/*` — login, signup
  - `/api/stripe/*` — checkout, payment intent
  - `/api/ai/*` — all AI endpoints
  - `/api/public/*` — public link access

### Step 8.4: Run dependency audit

- [ ] Run:
```bash
pnpm audit
```
- [ ] Fix any critical or high severity vulnerabilities
- [ ] Update packages with known CVEs

### Step 8.5: Verify XSS protection

- [ ] Check that all user-generated content (project names, notes, descriptions) is escaped in components
- [ ] Verify React's default escaping is not bypassed with `dangerouslySetInnerHTML`
- [ ] Check markdown rendering in `react-markdown` uses sanitization

### Step 8.6: Commit

- [ ] Run:
```bash
git add scripts/ __tests__/security/ app/api/
git commit -m "security: audit and fix auth coverage, RLS isolation, rate limiting"
```

---

## Task 9: Final Verification

### Step 9.1: Full build check

- [ ] Run:
```bash
pnpm typecheck && pnpm lint && pnpm build
```
- Expected: No errors

### Step 9.2: Run all tests

- [ ] Run:
```bash
pnpm test && pnpm test:e2e
```
- Expected: All tests PASS

### Step 9.3: Manual smoke test

- [ ] Start dev server: `pnpm dev`
- [ ] Test: Login flow
- [ ] Test: Create project
- [ ] Test: Log time entry
- [ ] Test: Create invoice
- [ ] Test: Dashboard loads without errors
- [ ] Test: AI chat works with OpenRouter
- [ ] Test: Subscription page shows dynamic checkout (no hardcoded link)

### Step 9.4: Final commit

- [ ] Run:
```bash
git add -A
git commit -m "chore: Phase 1 Foundation Hardening complete"
```

---

## Completion Criteria

Phase 1 is done when:
- [ ] All API routes use shared auth/validation/response helpers
- [ ] No `as any` in auth metadata access (typed properly)
- [ ] Stripe webhooks are idempotent (duplicate events are skipped)
- [ ] No hardcoded Stripe payment links
- [ ] Stripe API uses stable version (not test)
- [ ] Grace period uses `past_due_since` column
- [ ] All AI endpoints use OpenRouter (no direct Gemini/Groq/OpenAI imports)
- [ ] Legacy AI client files are deleted
- [ ] DashboardClient.tsx is split into <200 line sub-components
- [ ] localStorage tenant fallback is removed
- [ ] Unit tests exist for payroll, pricing, and Stripe
- [ ] Security audit passes (no unprotected routes, RLS verified)
- [ ] `pnpm typecheck && pnpm lint && pnpm build` passes clean
