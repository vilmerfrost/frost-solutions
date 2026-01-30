-- ============================================
-- COMPLETE AUTO-FIX: Fix all orphaned projects in one go
-- ============================================
-- This script finds your PRIMARY tenant and fixes ALL orphaned projects automatically

DO $$
DECLARE
    v_primary_tenant_id UUID;
    v_orphaned_count INTEGER;
BEGIN
    -- Step 1: Find PRIMARY tenant (most activity)
    WITH user_employees AS (
        SELECT DISTINCT e.tenant_id, e.id as employee_id
        FROM employees e
        WHERE e.auth_user_id = '00000000-0000-0000-0000-000000000000'
          AND EXISTS (SELECT 1 FROM tenants WHERE id = e.tenant_id)
    ),
    tenant_activity AS (
        SELECT 
            t.id,
            (SELECT COUNT(*) FROM projects WHERE tenant_id = t.id) as project_count,
            (SELECT COUNT(*) FROM time_entries te 
             JOIN user_employees ue ON ue.employee_id = te.employee_id
             WHERE te.tenant_id = t.id) as time_entry_count
        FROM tenants t
        WHERE t.id IN (SELECT tenant_id FROM user_employees)
    )
    SELECT id INTO v_primary_tenant_id
    FROM tenant_activity
    ORDER BY (project_count + time_entry_count) DESC
    LIMIT 1;

    -- If no primary tenant found, try to find any valid tenant
    IF v_primary_tenant_id IS NULL THEN
        SELECT id INTO v_primary_tenant_id
        FROM tenants
        WHERE EXISTS (
            SELECT 1 FROM employees e 
            WHERE e.auth_user_id = '00000000-0000-0000-0000-000000000000'
            AND e.tenant_id = tenants.id
        )
        LIMIT 1;
    END IF;

    -- If still no tenant, use first available tenant (last resort)
    IF v_primary_tenant_id IS NULL THEN
        SELECT id INTO v_primary_tenant_id
        FROM tenants
        ORDER BY created_at DESC
        LIMIT 1;
    END IF;

    -- Step 2: Count orphaned projects before fix
    SELECT COUNT(*) INTO v_orphaned_count
    FROM projects p
    WHERE p.tenant_id IS NOT NULL 
      AND NOT EXISTS (SELECT 1 FROM tenants WHERE id = p.tenant_id);

    RAISE NOTICE 'Found PRIMARY tenant: %', v_primary_tenant_id;
    RAISE NOTICE 'Found % orphaned projects to fix', v_orphaned_count;

    -- Step 3: Move ALL orphaned projects to PRIMARY tenant
    IF v_primary_tenant_id IS NOT NULL AND v_orphaned_count > 0 THEN
        UPDATE projects 
        SET tenant_id = v_primary_tenant_id
        WHERE tenant_id NOT IN (SELECT id FROM tenants);

        RAISE NOTICE '✅ Fixed % orphaned projects - moved to tenant: %', v_orphaned_count, v_primary_tenant_id;
    ELSE
        RAISE NOTICE '⚠️ No orphaned projects found or no PRIMARY tenant identified';
    END IF;

    -- Step 4: Verify fix
    SELECT COUNT(*) INTO v_orphaned_count
    FROM projects p
    WHERE p.tenant_id IS NOT NULL 
      AND NOT EXISTS (SELECT 1 FROM tenants WHERE id = p.tenant_id);

    IF v_orphaned_count = 0 THEN
        RAISE NOTICE '✅ VERIFICATION: All orphaned projects fixed! No orphaned projects remaining.';
    ELSE
        RAISE WARNING '⚠️ VERIFICATION FAILED: Still % orphaned projects remaining!', v_orphaned_count;
    END IF;
END $$;

-- Final verification query
SELECT 
    COUNT(*) as orphaned_projects_count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ ALL FIXED'
        ELSE '❌ STILL HAS ORPHANED PROJECTS'
    END as status
FROM projects p
WHERE p.tenant_id IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM tenants WHERE id = p.tenant_id);
