# 🚨 Error: unrecognized configuration parameter "app.current_tenant_id"

## Problem

The application is experiencing errors when querying Supabase:

```
{
    "code": "42704",
    "message": "unrecognized configuration parameter \"app.current_tenant_id\"",
    "details": null,
    "hint": null
}
```

This error occurs when making queries to tables like `invoices`, `clients`, etc., and is often associated with:
- `Error fetching invoice`
- `Error fetching invoices`
- `GET .../rest/v1/clients?...&tenant_id=eq.8ee28f55-b780-4286-8137-9e70ea58ae56 400 (Bad Request)`

## Root Cause

The error indicates that PostgreSQL doesn't recognize the custom configuration parameter `app.current_tenant_id`. This parameter is likely being referenced in:

1. **RLS (Row Level Security) policies** that use `current_setting('app.current_tenant_id')::uuid`
2. **Database functions** that try to read this configuration parameter
3. **PostgREST** queries that expect this parameter to be set

However, the codebase actually uses a different approach:
- The migration `101_rls_hardening.sql` creates a function `current_tenant_id()` that reads from JWT claims
- RLS policies should use `current_tenant_id()` instead of `current_setting('app.current_tenant_id')`

## Solution (SQL Fix Required in Supabase)

The issue needs to be fixed at the database level. Here are the steps:

### Option 1: Update RLS Policies to Use `current_tenant_id()` Function

If any RLS policies are still using `current_setting('app.current_tenant_id')`, they should be updated to use the `current_tenant_id()` function instead:

```sql
-- OLD (causing error):
CREATE POLICY "invoices_tenant_isolation"
ON invoices FOR ALL
USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- NEW (correct):
CREATE POLICY "invoices_tenant_isolation"
ON invoices FOR ALL
USING (tenant_id = current_tenant_id());
```

### Option 2: Register the Configuration Parameter (if needed)

If you need to use `current_setting('app.current_tenant_id')` for some reason, you must first register it in PostgreSQL:

```sql
-- Register the custom configuration parameter
ALTER SYSTEM SET custom_variable_classes = 'app';

-- Then restart PostgreSQL (or reload config)
-- After restart, you can set it per session:
SET app.current_tenant_id = 'your-tenant-uuid';
```

**Note:** This approach is NOT recommended because:
- It requires PostgreSQL restart/reload
- It's session-based and doesn't work well with connection pooling
- The `current_tenant_id()` function is a better solution

### Option 3: Verify All RLS Policies

Check all RLS policies in the database and ensure they use `current_tenant_id()`:

```sql
-- Find all policies using current_setting
SELECT 
    schemaname,
    tablename,
    policyname,
    definition
FROM pg_policies
WHERE definition LIKE '%current_setting%app.current_tenant_id%';
```

Then update any found policies to use `current_tenant_id()` instead.

## Recommended Action

1. **Check Supabase Dashboard** → SQL Editor
2. **Run this query** to find problematic policies:
   ```sql
   SELECT 
       schemaname,
       tablename,
       policyname,
       definition
   FROM pg_policies
   WHERE definition LIKE '%current_setting%app.current_tenant_id%';
   ```
3. **Update any found policies** to use `current_tenant_id()` function
4. **Verify** that `current_tenant_id()` function exists:
   ```sql
   SELECT proname, prosrc 
   FROM pg_proc 
   WHERE proname = 'current_tenant_id';
   ```

## Current Implementation

The codebase correctly uses:
- `current_tenant_id()` function (from migration `101_rls_hardening.sql`)
- Client-side filtering with `.eq('tenant_id', tenantId)` in Supabase queries
- `TenantContext` to provide `tenantId` to components

The error is likely coming from old RLS policies that haven't been updated yet.

## Related Files

- `supabase/migrations/101_rls_hardening.sql` - Contains `current_tenant_id()` function
- `app/hooks/useInvoices.ts` - Uses `.eq('tenant_id', tenantId)` for filtering
- `app/context/TenantContext.tsx` - Provides tenantId to components

