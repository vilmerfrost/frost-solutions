-- Service-role friendly policy and analytics RPC
-- Run this script in Supabase SQL editor after review.

-- 1) Allow the service role (used by Next.js API routes) to read time entries per tenant.
DROP POLICY IF EXISTS time_entries_service_read ON time_entries;

CREATE POLICY time_entries_service_read
ON time_entries
FOR SELECT
TO authenticated
USING ((auth.jwt() ->> 'role') = 'service_role');

-- 2) Tenant-scoped aggregation function that bypasses RLS safely.
CREATE SCHEMA IF NOT EXISTS app;

CREATE OR REPLACE FUNCTION app.get_tenant_dashboard_analytics(
  p_tenant_id uuid,
  p_start_date timestamptz,
  p_end_date timestamptz
)
RETURNS TABLE (
  total_hours numeric,
  active_projects bigint,
  total_entries bigint
)
SECURITY DEFINER
SET search_path = public, app
LANGUAGE sql
AS $$
  SELECT
    COALESCE(SUM(COALESCE(hours_total, hours, 0)), 0)    AS total_hours,
    COALESCE(COUNT(DISTINCT project_id), 0)              AS active_projects,
    COALESCE(COUNT(*), 0)                                AS total_entries
  FROM public.time_entries
  WHERE tenant_id = p_tenant_id
    AND date >= p_start_date::date
    AND date <= p_end_date::date;
$$;

GRANT EXECUTE ON FUNCTION app.get_tenant_dashboard_analytics(uuid, timestamptz, timestamptz)
  TO service_role;


