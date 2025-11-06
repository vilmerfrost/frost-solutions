-- Create function to find schedule conflicts
-- This function checks for overlapping schedule slots for an employee

CREATE OR REPLACE FUNCTION public.find_schedule_conflicts(
  p_tenant_id uuid,
  p_employee_id uuid,
  p_start timestamptz,
  p_end timestamptz,
  p_exclude_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  start_time timestamptz,
  end_time timestamptz,
  status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, app
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.start_time,
    s.end_time,
    s.status
  FROM public.schedule_slots s  -- Use public view instead of app.schedule_slots directly
  WHERE s.tenant_id = p_tenant_id
    AND s.employee_id = p_employee_id
    AND (p_exclude_id IS NULL OR s.id != p_exclude_id)
    AND s.status != 'cancelled'
    AND (
      -- New slot starts during existing slot
      (p_start >= s.start_time AND p_start < s.end_time)
      OR
      -- New slot ends during existing slot
      (p_end > s.start_time AND p_end <= s.end_time)
      OR
      -- New slot completely contains existing slot
      (p_start <= s.start_time AND p_end >= s.end_time)
    )
  ORDER BY s.start_time;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.find_schedule_conflicts(uuid, uuid, timestamptz, timestamptz, uuid) TO authenticated;

