-- ============================================
-- FIX SQL: Fix tenant isolation issues
-- ============================================
-- Run this AFTER checking which tenant you should belong to

-- Step 1: Check which employees belong to which tenants for your user
SELECT 
    e.id as employee_id,
    e.full_name,
    e.tenant_id,
    t.name as tenant_name,
    e.auth_user_id,
    e.email,
    e.role,
    CASE 
        WHEN e.tenant_id IS NULL THEN '❌ NULL tenant_id'
        WHEN NOT EXISTS (SELECT 1 FROM tenants WHERE id = e.tenant_id) THEN '❌ Invalid tenant_id'
        ELSE '✅ Valid tenant_id'
    END as tenant_status,
    (SELECT COUNT(*) FROM projects WHERE tenant_id = e.tenant_id) as project_count,
    (SELECT COUNT(*) FROM time_entries WHERE employee_id = e.id) as time_entry_count
FROM employees e
LEFT JOIN tenants t ON e.tenant_id = t.id
WHERE e.auth_user_id = '00000000-0000-0000-0000-000000000000'
ORDER BY e.created_at DESC;

-- Step 2: Check which projects belong to which tenants
SELECT 
    t.id as tenant_id,
    t.name as tenant_name,
    COUNT(p.id) as project_count,
    STRING_AGG(p.name, ', ' ORDER BY p.name) as project_names
FROM tenants t
LEFT JOIN projects p ON p.tenant_id = t.id
GROUP BY t.id, t.name
ORDER BY project_count DESC;

-- Step 3: Check if project "d" should be moved or deleted
-- REPLACE 'CORRECT_TENANT_ID' with the tenant_id you want to move it to, or DELETE it
-- Option A: Move project "d" to correct tenant
-- UPDATE projects 
-- SET tenant_id = 'CORRECT_TENANT_ID'  -- Replace with your correct tenant_id
-- WHERE name = 'd' AND tenant_id = '8ee28f55-b780-4286-8137-9e70ea58ae56';

-- Option B: Delete project "d" if it's incorrect
-- DELETE FROM projects 
-- WHERE name = 'd' AND tenant_id = '8ee28f55-b780-4286-8137-9e70ea58ae56';

-- Step 4: Check for orphaned projects (projects with tenant_id that doesn't exist)
SELECT 
    p.id,
    p.name,
    p.tenant_id,
    'Does not exist in tenants table' as issue
FROM projects p
WHERE p.tenant_id IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM tenants WHERE id = p.tenant_id);

-- Step 5: Check which tenant you SHOULD belong to (based on most projects/time entries)
WITH user_tenants AS (
    SELECT DISTINCT e.tenant_id
    FROM employees e
    WHERE e.auth_user_id = '00000000-0000-0000-0000-000000000000'
      AND EXISTS (SELECT 1 FROM tenants WHERE id = e.tenant_id)
),
tenant_stats AS (
    SELECT 
        t.id,
        t.name,
        (SELECT COUNT(*) FROM projects WHERE tenant_id = t.id) as project_count,
        (SELECT COUNT(*) FROM time_entries te 
         JOIN employees e ON e.id = te.employee_id 
         WHERE e.auth_user_id = '00000000-0000-0000-0000-000000000000' 
         AND te.tenant_id = t.id) as time_entry_count
    FROM tenants t
    WHERE t.id IN (SELECT tenant_id FROM user_tenants)
)
SELECT 
    id,
    name,
    project_count,
    time_entry_count,
    (project_count + time_entry_count) as total_activity
FROM tenant_stats
ORDER BY total_activity DESC;
