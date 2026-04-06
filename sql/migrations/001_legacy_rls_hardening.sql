-- Archived from supabase/migrations/101_rls_hardening.sql
-- Kept for reference only. Not part of the active Supabase migration history.

-- PR 2: RLS Hardening & Performance Improvements
-- This migration adds indexes, DELETE policies, and converts subquery-based policies to claim-based

-- ============================================================================
-- 1. Create helper function to get tenant_id from JWT claims
-- ============================================================================
-- This function reads tenant_id from app_metadata in JWT
CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS UUID AS $$
BEGIN
  -- Try to get tenant_id from JWT app_metadata
  RETURN (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::UUID;
EXCEPTION
  WHEN OTHERS THEN
    -- Fallback: query employees table (legacy support during migration)
    RETURN (
      SELECT tenant_id
      FROM employees
      WHERE auth_user_id = auth.uid()
      LIMIT 1
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION current_tenant_id() TO authenticated;

-- ============================================================================
-- 2. Create missing indexes for performance
-- ============================================================================

-- Index on employees.auth_user_id (critical for RLS performance)
CREATE INDEX IF NOT EXISTS idx_employees_auth_user
  ON public.employees(auth_user_id)
  WHERE auth_user_id IS NOT NULL;

-- Index on projects.tenant_id (if missing)
CREATE INDEX IF NOT EXISTS idx_projects_tenant
  ON public.projects(tenant_id);

-- Index on aeta_requests.tenant_id (verify it exists, already created in previous migration but ensure it's there)
CREATE INDEX IF NOT EXISTS idx_aeta_requests_tenant
  ON public.aeta_requests(tenant_id);

-- ============================================================================
-- 3. Add DELETE policy for aeta_requests
-- ============================================================================

DROP POLICY IF EXISTS aeta_requests_delete_by_tenant ON public.aeta_requests;

CREATE POLICY aeta_requests_delete_by_tenant
  ON public.aeta_requests
  FOR DELETE
  TO authenticated
  USING (tenant_id = current_tenant_id());

-- ============================================================================
-- 4. Convert aeta_requests policies from subquery to claim-based
-- ============================================================================

-- Drop old policies (they use subqueries)
DROP POLICY IF EXISTS "Users can view aeta requests for their tenant" ON public.aeta_requests;
DROP POLICY IF EXISTS "Users can create aeta requests for their tenant" ON public.aeta_requests;
DROP POLICY IF EXISTS "Users can update aeta requests for their tenant" ON public.aeta_requests;

-- Create new claim-based SELECT policy
CREATE POLICY aeta_requests_select
  ON public.aeta_requests
  FOR SELECT
  TO authenticated
  USING (tenant_id = current_tenant_id());

-- Create new claim-based INSERT policy
CREATE POLICY aeta_requests_insert
  ON public.aeta_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = current_tenant_id()
    AND requested_by = auth.uid()
  );

-- Create new claim-based UPDATE policy
CREATE POLICY aeta_requests_update
  ON public.aeta_requests
  FOR UPDATE
  TO authenticated
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

-- ============================================================================
-- 5. Additional indexes for common query patterns
-- ============================================================================

-- Index on time_entries.tenant_id if missing
CREATE INDEX IF NOT EXISTS idx_time_entries_tenant
  ON public.time_entries(tenant_id);

-- Index on invoices.tenant_id if missing
CREATE INDEX IF NOT EXISTS idx_invoices_tenant
  ON public.invoices(tenant_id);

-- Index on clients.tenant_id if missing
CREATE INDEX IF NOT EXISTS idx_clients_tenant
  ON public.clients(tenant_id);
