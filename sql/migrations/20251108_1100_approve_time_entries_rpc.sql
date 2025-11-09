-- =========================================================
-- RPC Function: approve_time_entries_all
-- Date: 2025-11-08
-- Description: Bulk approve time entries using RPC to avoid replica lag
--               This ensures read-after-write consistency
-- =========================================================

-- Create RPC function for bulk approval
-- This runs on PRIMARY database and avoids replica lag issues
CREATE OR REPLACE FUNCTION app.approve_time_entries_all(
  p_tenant_id uuid,
  p_employee_id uuid,
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  approval_status text,
  approved_at timestamptz,
  approved_by uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.time_entries t
  SET 
    approval_status = 'approved',
    approved_at = NOW(),
    approved_by = p_employee_id
  WHERE t.tenant_id = p_tenant_id
    AND t.approval_status IS DISTINCT FROM 'approved'  -- Handles both NULL and 'pending'
    AND (p_start_date IS NULL OR t.date >= p_start_date)
    AND (p_end_date IS NULL OR t.date <= p_end_date)
  RETURNING t.id, t.approval_status, t.approved_at, t.approved_by;
END;
$$;

-- Grant execute to service role
GRANT EXECUTE ON FUNCTION app.approve_time_entries_all(uuid, uuid, date, date) TO service_role;

-- Comment for documentation
COMMENT ON FUNCTION app.approve_time_entries_all(uuid, uuid, date, date) IS 
  'Bulk approve time entries. Uses UPDATE ... RETURNING to ensure read-after-write consistency and avoid replica lag.';

