-- ============================================================================
-- Dashboard Analytics: Prestanda-optimerad RPC function
-- ============================================================================
-- Aggregerar dashboard-statistik i en enda query för minimal IO
-- ============================================================================

CREATE OR REPLACE FUNCTION app.dashboard_stats(
  p_tenant UUID,
  p_since DATE
)
RETURNS jsonb 
LANGUAGE sql 
SECURITY DEFINER 
AS $$
SELECT jsonb_build_object(
  'projects', jsonb_build_object(
    'active', COALESCE((
      SELECT count(*)::int 
      FROM projects 
      WHERE tenant_id = p_tenant AND status = 'active'
    ), 0),
    'totalBudgetedHours', COALESCE((
      SELECT sum(budgeted_hours)::numeric 
      FROM projects 
      WHERE tenant_id = p_tenant
    ), 0)
  ),
  'time', jsonb_build_object(
    'hoursTotal', COALESCE((
      SELECT sum(hours_total)::numeric 
      FROM time_entries 
      WHERE tenant_id = p_tenant AND date >= p_since
    ), 0),
    'unbilledHours', COALESCE((
      SELECT sum(hours_total)::numeric 
      FROM time_entries 
      WHERE tenant_id = p_tenant 
      AND date >= p_since 
      AND NOT is_billed
    ), 0)
  ),
  'invoices', jsonb_build_object(
    'revenue', COALESCE((
      SELECT sum(amount)::numeric 
      FROM invoices 
      WHERE tenant_id = p_tenant 
      AND issue_date >= p_since 
      AND status = 'paid'
    ), 0),
    'unpaidCount', COALESCE((
      SELECT count(*)::int 
      FROM invoices 
      WHERE tenant_id = p_tenant 
      AND issue_date >= p_since 
      AND status IN ('sent', 'draft')
    ), 0),
    'unpaidAmount', COALESCE((
      SELECT sum(amount)::numeric 
      FROM invoices 
      WHERE tenant_id = p_tenant 
      AND issue_date >= p_since 
      AND status IN ('sent', 'draft')
    ), 0)
  ),
  'employees', jsonb_build_object(
    'total', COALESCE((
      SELECT count(*)::int 
      FROM employees 
      WHERE tenant_id = p_tenant
    ), 0)
  )
);
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION app.dashboard_stats(UUID, DATE) TO authenticated;

