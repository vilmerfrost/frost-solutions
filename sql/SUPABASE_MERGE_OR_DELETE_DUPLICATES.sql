-- ============================================================================
-- TA BORT DUPLIKERAD EMPLOYEE-RECORD
-- ============================================================================
-- BASERAT PÅ DIN DATA:
-- - b545c4a3-685d-4af5-8d22-b7b0dcfce233 = "Admin" (placeholder-namn?)
-- - 47224e0b-5809-4894-8696-49dd2b5f71f0 = "Vilmer Frost" (riktigt namn)
--
-- REKOMMENDATION: Behåll "Vilmer Frost", ta bort "Admin"
-- ============================================================================

BEGIN;

-- 1. KONTROLLERA VILKEN SOM HAR DATA FÖRST!
SELECT 
    'b545c4a3-685d-4af5-8d22-b7b0dcfce233' AS employee_id,
    'Admin' AS name,
    COUNT(*) AS time_entries_count
FROM time_entries
WHERE employee_id = 'b545c4a3-685d-4af5-8d22-b7b0dcfce233'

UNION ALL

SELECT 
    '47224e0b-5809-4894-8696-49dd2b5f71f0' AS employee_id,
    'Vilmer Frost' AS name,
    COUNT(*) AS time_entries_count
FROM time_entries
WHERE employee_id = '47224e0b-5809-4894-8696-49dd2b5f71f0';

-- 2. OM "Admin" HAR DATA - Migrera till "Vilmer Frost"
-- UPDATE time_entries
-- SET employee_id = '47224e0b-5809-4894-8696-49dd2b5f71f0'  -- Vilmer Frost
-- WHERE employee_id = 'b545c4a3-685d-4af5-8d22-b7b0dcfce233';  -- Admin

-- 3. OM "Admin" HAR INGEN DATA - Ta bort den
-- OPTION A: Ta bort "Admin" (om den har ingen data)
DELETE FROM employees
WHERE id = 'b545c4a3-685d-4af5-8d22-b7b0dcfce233'
  AND auth_user_id = '00000000-0000-0000-0000-000000000000'
  AND NOT EXISTS (
    SELECT 1 FROM time_entries WHERE employee_id = 'b545c4a3-685d-4af5-8d22-b7b0dcfce233'
  );

-- 4. VERIFIERA RESULTAT
SELECT 
    id,
    full_name,
    tenant_id,
    auth_user_id,
    role,
    created_at
FROM employees
WHERE auth_user_id = '00000000-0000-0000-0000-000000000000'
ORDER BY created_at DESC;

-- 5. Om resultatet ser bra ut:
-- COMMIT;
-- Annars:
-- ROLLBACK;

-- ============================================================================
-- ALTERNATIV: MERGE (om båda har data)
-- ============================================================================
-- Om båda employee-records har data, migrera allt till en:
--
-- -- Migrera time_entries från "Admin" till "Vilmer Frost"
-- UPDATE time_entries
-- SET employee_id = '47224e0b-5809-4894-8696-49dd2b5f71f0'
-- WHERE employee_id = 'b545c4a3-685d-4af5-8d22-b7b0dcfce233';
--
-- -- Ta sedan bort "Admin"
-- DELETE FROM employees
-- WHERE id = 'b545c4a3-685d-4af5-8d22-b7b0dcfce233';
-- ============================================================================

