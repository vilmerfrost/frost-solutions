-- ============================================================================
-- SECURITY AUDIT CHECKLIST - Frost Solutions
-- Run these queries to verify security configurations
-- Last Updated: 2026-01-09
-- ============================================================================

-- ============================================================================
-- 1. RLS POLICY VERIFICATION
-- ============================================================================

-- Check which tables have RLS enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname IN ('public', 'app')
ORDER BY schemaname, tablename;

-- List all RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname IN ('public', 'app')
ORDER BY schemaname, tablename, policyname;

-- ============================================================================
-- 2. CRITICAL TABLES RLS CHECK
-- ============================================================================

-- Verify RLS is enabled on critical tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'tenants',
  'employees',
  'projects',
  'clients',
  'invoices',
  'time_entries',
  'supplier_invoices',
  'rot_applications',
  'payroll_periods',
  'ai_credits',
  'ai_transactions'
);

-- ============================================================================
-- 3. TENANT ISOLATION TEST
-- ============================================================================

-- This query should return ZERO rows if tenant isolation is working
-- (Run as a specific user to test)
/*
SET ROLE authenticated;
SET request.jwt.claims.sub = 'some-user-id';

SELECT COUNT(*) as data_from_other_tenants
FROM employees e
WHERE e.tenant_id NOT IN (
  SELECT tenant_id FROM employees WHERE auth_user_id = auth.uid()
);
*/

-- ============================================================================
-- 4. STRIPE WEBHOOK SECURITY
-- ============================================================================

-- Verify Stripe webhook secret is set (check environment variables)
-- STRIPE_WEBHOOK_SECRET should be set and not empty

-- Webhook endpoint should verify signatures:
-- stripe.webhooks.constructEvent(body, signature, webhookSecret)

-- ============================================================================
-- 5. API AUTHENTICATION CHECK
-- ============================================================================

-- All API routes should:
-- 1. Check authentication (getTenantId() returns non-null)
-- 2. Use service role for privileged operations
-- 3. Never expose service role key to client

-- ============================================================================
-- 6. DATA ENCRYPTION
-- ============================================================================

-- Verify sensitive fields are encrypted:
-- - Integration tokens (fortnox_tokens, visma_tokens)
-- - API keys
-- - Personal identification numbers (personnummer)

-- Check if encryption is used
SELECT 
  table_name,
  column_name
FROM information_schema.columns
WHERE table_schema = 'public'
AND column_name ILIKE '%token%'
   OR column_name ILIKE '%secret%'
   OR column_name ILIKE '%password%'
   OR column_name ILIKE '%api_key%';

-- ============================================================================
-- 7. AUDIT LOGGING
-- ============================================================================

-- Verify audit_logs table exists and has RLS
SELECT 
  EXISTS(
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'audit_logs'
  ) as audit_logs_exists;

-- Check audit log entries (should have recent entries)
/*
SELECT 
  action,
  COUNT(*) as count,
  MAX(created_at) as last_occurrence
FROM audit_logs
GROUP BY action
ORDER BY count DESC
LIMIT 20;
*/

-- ============================================================================
-- 8. RBAC VERIFICATION
-- ============================================================================

-- Check role permissions are defined
SELECT role, resource, action
FROM app.role_permissions
ORDER BY role, resource, action;

-- Verify user roles are assigned
SELECT 
  ur.role,
  COUNT(*) as user_count
FROM app.user_roles ur
GROUP BY ur.role;

-- ============================================================================
-- 9. FUNCTION SECURITY
-- ============================================================================

-- Check security definer functions (these run with elevated privileges)
SELECT 
  routine_name,
  routine_schema,
  security_type
FROM information_schema.routines
WHERE routine_schema IN ('public', 'app')
AND routine_type = 'FUNCTION'
AND security_type = 'DEFINER'
ORDER BY routine_schema, routine_name;

-- ============================================================================
-- 10. STORAGE BUCKET POLICIES
-- ============================================================================

-- Verify storage buckets have proper policies
-- Check in Supabase dashboard: Storage > Policies

-- Required buckets with RLS:
-- - supplier_invoices (tenant isolation)
-- - payroll_exports (tenant isolation)
-- - documents (tenant isolation)
-- - avatars (user isolation)

-- ============================================================================
-- SECURITY CHECKLIST SUMMARY
-- ============================================================================

/*
CRITICAL SECURITY ITEMS:

[x] RLS enabled on all public tables
[x] Tenant isolation via employees.auth_user_id lookup
[x] RBAC system with role_permissions
[x] Audit logging for sensitive actions
[x] Stripe webhook signature verification
[x] API routes check authentication
[x] Service role key only used server-side

STRIPE SPECIFIC:
[x] Webhook signature verification
[x] Payment intents created server-side
[x] Customer IDs stored per tenant
[x] No client-side access to secret key

AI CREDITS SPECIFIC:
[x] Balance checks before AI calls
[x] Transaction logging for all charges
[x] Service role required for credit operations
[x] Rate limiting consideration (add if needed)

RECOMMENDATIONS:
1. Add rate limiting to AI endpoints
2. Add IP allowlisting for admin endpoints
3. Consider adding 2FA for admin users
4. Regular security audits (monthly)
5. Penetration testing before launch
*/

