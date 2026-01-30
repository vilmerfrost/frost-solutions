-- ============================================================================
-- SNABB KONTROLL: Verifiera tenant och fixa om den saknas
-- ============================================================================
-- Kör denna SQL för att snabbt kontrollera om din tenant finns
-- ============================================================================

-- 1. Lista ALLA tenants i databasen
SELECT id, name, created_at 
FROM tenants 
ORDER BY created_at DESC;

-- 2. Kontrollera specifik tenant (ersätt med ditt tenant ID)
-- Exempel tenant ID från logs: 7d57f1cb-c33f-4317-96f7-0abac0f2aab6
SELECT id, name, created_at 
FROM tenants 
WHERE id = '7d57f1cb-c33f-4317-96f7-0abac0f2aab6';

-- 3. Om tenant INTE finns, skapa den (VIKTIGT: Ersätt med RÄTT värden!)
-- VARNING: Kör endast om tenant verkligen saknas!
-- INSERT INTO tenants (id, name, created_at, updated_at)
-- VALUES (
--   '7d57f1cb-c33f-4317-96f7-0abac0f2aab6', -- Ersätt med ditt tenant ID från felmeddelandet
--   'Min Företag', -- Ersätt med ditt företagsnamn
--   NOW(),
--   NOW()
-- )
-- ON CONFLICT (id) DO NOTHING;

-- 4. Kontrollera employee-record och dess tenant_id
SELECT 
    e.id,
    e.full_name,
    e.tenant_id,
    e.auth_user_id,
    t.id AS tenant_exists,
    t.name AS tenant_name
FROM employees e
LEFT JOIN tenants t ON t.id = e.tenant_id
WHERE e.auth_user_id = '00000000-0000-0000-0000-000000000000' -- Ersätt med ditt user ID om behövs
ORDER BY e.created_at DESC;

-- 5. Om employee har fel tenant_id, uppdatera den:
-- UPDATE employees
-- SET tenant_id = '7d57f1cb-c33f-4317-96f7-0abac0f2aab6' -- Ersätt med rätt tenant ID
-- WHERE auth_user_id = '00000000-0000-0000-0000-000000000000'; -- Ersätt med ditt user ID

-- ============================================================================
-- INSTRUKTIONER:
-- ============================================================================
-- 1. Kör query #1 för att se alla tenants
-- 2. Kör query #2 för att se om DIN tenant finns
-- 3. Kör query #4 för att se vilket tenant_id din employee-record har
-- 4. Om tenant saknas OCH employee-record har ett annat tenant_id:
--    - Använd det tenant_id som employee-record har (från query #4)
--    - ELLER skapa ny tenant med query #3 (om det är första gången)
-- 5. Om employee-record har fel tenant_id, uppdatera med query #5
-- ============================================================================

