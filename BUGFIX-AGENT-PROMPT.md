# Bugfix Agent Prompt — Frost Solutions

Run this prompt with a separate Claude Code agent to fix broken functionality from the Phase 1-3 work.

---

## Context

Frost Solutions is a Next.js 16 + Supabase multi-tenant SaaS for Swedish construction companies. A large Phase 1-3 implementation was done recently and introduced several bugs and incomplete implementations. The app builds successfully but has runtime issues.

## Issues to Fix (ordered by priority)

### 1. CRITICAL — Corrupted Supabase Type Definitions
- **File**: `app/types/supabase-generated.ts`
- **Action**: Regenerate types from the actual Supabase schema. Run:
  ```bash
  supabase gen types typescript --project-id rwgqyozifwfgsxwyegoz > app/types/supabase-generated.ts
  ```
- If that fails, check `supabase link` status first.

### 2. CRITICAL — PDF Signing Creates Placeholder Instead of Real PDF
- **File**: `app/api/signing/create/route.ts` (line ~43-45)
- **Current**: `Buffer.from("Placeholder PDF for ...").toString('base64')`
- **Action**: Either implement real PDF generation using `pdf-lib` or `@react-pdf/renderer`, OR disable the signing feature with a clear "coming soon" message instead of silently creating broken signing orders.

### 3. HIGH — AWS Textract OCR Stubs Return Mock Data
- **File**: `app/lib/ocr/clients/textract.ts` (lines 112-156)
- **Current**: Three functions (`startTextractPdfJob`, `pollTextractJob`, `analyzeImage`) all throw errors or return hardcoded mock invoice data ("Demo Bygg AB", "MOCK-12345").
- **Action**: If AWS is not configured yet, make the OCR gracefully degrade — show a clear message to users that OCR is not yet available. Don't return fake data that looks real. Guard all call sites.

### 4. HIGH — Missing org_number Column on tenants Table
- **File**: `app/lib/payroll/exporters/fortnox.ts` (line ~73-81)
- **Current**: Falls back to `'000000-0000'` placeholder org number for payroll exports.
- **Action**: Create a migration to add `org_number TEXT` to the `tenants` table. Update the settings page (if one exists) to allow editing it. Update the Fortnox exporter to require it.

### 5. HIGH — Missing /api/quote-templates Endpoint
- **Called by**: `app/lib/api/quotes.ts` (lines 210-226, TemplatesAPI class)
- **Current**: Frontend calls `/api/quote-templates` which doesn't exist. Silently catches errors and returns empty arrays.
- **Action**: Either create the API route with basic CRUD, OR remove the TemplatesAPI class and any UI that references templates until it's ready.
 
### 6. MEDIUM — Portal Registration Hardcodes portal_user_type
- **File**: `app/api/portal/auth/register/route.ts` (line ~57)
- **Current**: `portal_user_type: 'customer'` is hardcoded — subcontractors can never register.
- **Action**: Accept `portal_user_type` from the request body, validate it's one of `['customer', 'subcontractor']`, default to `'customer'` if not provided.

### 7. MEDIUM — Portal Login Route Missing Role Validation
- **File**: `app/api/auth/login/route.ts`
- **Current**: Uses `app_metadata.tenant_id` which may not exist; no validation of portal_user_type.
- **Action**: Validate that the user has a valid `portal_user_type` in their metadata before returning a session. Return appropriate error messages.

### 8. MEDIUM — Unapplied Migration
- **File**: `supabase/migrations/20260406143000_add_portal_user_type_and_risk_assessments.sql`
- **Status**: Untracked, not applied to the database.
- **Action**: Review the migration SQL for correctness, then apply it with `supabase db push`. Make sure the `risk_assessments` table and `portal_user_type` column are valid.

### 9. MEDIUM — Stripe Webhook Type Assertion Bug
- **File**: `app/api/stripe/webhook/route.ts` (line ~38)
- **Current**: `paymentIntent.latest_charge as string || null`
- **Problem**: Type assertion `as string` converts even `undefined` to string, making `|| null` useless.
- **Fix**: Change to `(paymentIntent.latest_charge as string | null) ?? null`

### 10. LOW — Fortnox Real-Time Sync Not Implemented
- **File**: `app/lib/payroll/exporters/fortnox.ts` (line ~9)
- **Current**: Exports save to storage but never POST to Fortnox API.
- **Action**: Add a TODO comment that's clearly visible, or stub a `syncToFortnox()` function that logs "not yet implemented" instead of silently skipping.

### 11. LOW — Deleted CLAUDE.md and .cursor/rules
- **Status**: These files show as deleted in git status.
- **Action**: If they were deleted intentionally, stage the deletions. If not, restore them with `git checkout -- CLAUDE.md .cursor/rules/`.

## Guidelines

- Don't add features beyond what's listed — just fix what's broken.
- For stubs that can't be implemented yet (AWS, BankID, PEPPOL), make them fail gracefully with clear user-facing messages instead of returning fake data or silently failing.
- Run `npx next build` after changes to verify nothing breaks.
- Test any database migrations against the linked Supabase project.
- Keep commits atomic — one fix per commit where possible.
