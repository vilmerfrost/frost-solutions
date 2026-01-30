-- ============================================================================
-- CHECK IF TENANT EXISTS IN DATABASE
-- ============================================================================
-- Run this to check if your tenant ID exists in the tenants table
-- ============================================================================

-- Replace this with your tenant ID from the error message
-- Example: 8ee28f55-b780-4286-8137-9e70ea58ae56
\set tenant_id '8ee28f55-b780-4286-8137-9e70ea58ae56'

-- 1. Check if tenant exists
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.tenants WHERE id = :'tenant_id') 
    THEN '✅ Tenant EXISTS in database'
    ELSE '❌ Tenant DOES NOT EXIST in database'
  END as status,
  :'tenant_id' as searched_tenant_id;

-- 2. List ALL tenants in database
SELECT 
  'All tenants in database:' as info,
  id,
  name,
  created_at,
  updated_at
FROM public.tenants
ORDER BY created_at DESC;

-- 3. Check employee records and their tenant_ids
SELECT 
  e.id as employee_id,
  e.full_name,
  e.tenant_id,
  e.auth_user_id,
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.tenants WHERE id = e.tenant_id) 
    THEN '✅ Valid tenant'
    ELSE '❌ Invalid tenant'
  END as tenant_status,
  t.name as tenant_name
FROM public.employees e
LEFT JOIN public.tenants t ON t.id = e.tenant_id
WHERE e.auth_user_id = '00000000-0000-0000-0000-000000000000'
ORDER BY e.created_at DESC;

-- 4. If tenant doesn't exist, create it (REPLACE VALUES!)
-- WARNING: Only run this if tenant truly doesn't exist!
/*
INSERT INTO public.tenants (id, name, created_at, updated_at)
VALUES (
  '8ee28f55-b780-4286-8137-9e70ea58ae56', -- Your tenant ID
  'Your Company Name', -- Replace with your company name
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;
*/

-- 5. Check foreign key constraints
SELECT 
  conname as constraint_name,
  conrelid::regclass as table_name,
  confrelid::regclass as referenced_table
FROM pg_constraint
WHERE conname IN (
  'invoices_tenant_id_fkey',
  'rot_applications_tenant_id_fkey',
  'time_entries_tenant_id_fkey',
  'projects_tenant_id_fkey',
  'employees_tenant_id_fkey'
)
AND connamespace = 'public'::regnamespace;

