# Supabase Schema Configuration Guide

## Problem: Schema Error

If you encounter this error:
```
Error: The schema must be one of the following: public, graphql_public
```

This means that Supabase API (PostgREST) is not configured to expose the `app` schema.

## Solution: Two Approaches

### Approach 1: Expose `app` Schema (Recommended for Development)

**Steps:**

1. Go to your Supabase Dashboard
2. Navigate to **Settings** → **API**
3. Scroll down to **Exposed schemas**
4. Add `app` to the list (comma-separated: `public, graphql_public, app`)
5. Click **Save**

**Pros:**
- Direct access to `app` schema tables via `supabase-js`
- Simpler code (no RPC functions needed)
- Better for development and debugging

**Cons:**
- Requires Supabase project admin access
- Exposes schema structure via API

### Approach 2: Use RPC Functions (Recommended for Production)

**Steps:**

1. Open Supabase SQL Editor
2. Copy and paste the contents of `supabase/rpc/supplier_invoices.sql`
3. Run the SQL script
4. Verify functions are created:
   ```sql
   SELECT routine_name 
   FROM information_schema.routines 
   WHERE routine_schema = 'public' 
   AND routine_name LIKE 'insert_supplier_invoice%';
   ```

**Pros:**
- Works without exposing `app` schema
- Transactional operations (invoice + history in one transaction)
- Better security (only exposes specific functions)
- Production-ready

**Cons:**
- Requires creating RPC functions for each operation
- More complex code

## Current Implementation

The codebase uses **Approach 2 (RPC Functions)** as the primary method:

- ✅ `insert_supplier_invoice` - Creates invoice + logs history
- ✅ `update_supplier_invoice` - Updates invoice + logs history  
- ✅ `get_supplier_invoice` - Gets single invoice
- ✅ `list_supplier_invoices` - Lists invoices with filters

## Verification

After implementing either approach, test with:

```bash
# Test upload endpoint
curl -X POST http://localhost:3000/api/supplier-invoices/upload \
  -H "x-user-id: test-user-id" \
  -F "file=@test-invoice.pdf" \
  -F "supplier_id=your-supplier-id"
```

## Troubleshooting

### Error: "function does not exist"
- Make sure you ran the SQL script in Supabase SQL Editor
- Check that functions are in `public` schema
- Verify function names match exactly (case-sensitive)

### Error: "permission denied"
- Check that `GRANT EXECUTE` statements ran successfully
- Verify service role key has permissions

### Error: "schema must be one of"
- If using Approach 1: Check that `app` is in Exposed schemas
- If using Approach 2: This shouldn't happen (RPC functions are in `public`)

## Migration Notes

If you switch from Approach 1 to Approach 2:

1. No code changes needed - RPC functions are already integrated
2. You can remove `app` from Exposed schemas if desired
3. All operations will continue to work via RPC

If you switch from Approach 2 to Approach 1:

1. Add `app` to Exposed schemas
2. Update code to use direct schema access instead of RPC
3. Remove RPC functions if not needed elsewhere

