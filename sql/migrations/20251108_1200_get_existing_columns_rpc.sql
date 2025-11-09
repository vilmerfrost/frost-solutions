-- RPC function to check which columns exist in a table
-- This is more reliable than parsing error messages
-- Based on ChatGPT 5's recommendation
-- Enhanced with better error handling and security

-- Drop existing function if it exists (idempotent)
DROP FUNCTION IF EXISTS public.get_existing_columns(text, text, text[]);

CREATE OR REPLACE FUNCTION public.get_existing_columns(
  p_table_schema text DEFAULT 'public',
  p_table_name   text,
  p_candidates   text[]
)
RETURNS TABLE(column_name text)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  table_exists boolean;
BEGIN
  -- Verify table exists
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = p_table_schema 
      AND table_name = p_table_name
  ) INTO table_exists;

  IF NOT table_exists THEN
    RAISE WARNING 'Table %.% does not exist', p_table_schema, p_table_name;
    RETURN;
  END IF;

  -- Return matching columns
  RETURN QUERY
  SELECT c.column_name::text
  FROM information_schema.columns c
  WHERE c.table_schema = p_table_schema
    AND c.table_name   = p_table_name
    AND c.column_name  = ANY(p_candidates)
  ORDER BY c.ordinal_position;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error detecting columns: %', SQLERRM;
    RETURN;
END;
$$;

-- Grant execute to service role and authenticated users
GRANT EXECUTE ON FUNCTION public.get_existing_columns(text, text, text[]) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_existing_columns(text, text, text[]) TO authenticated;

-- Comment
COMMENT ON FUNCTION public.get_existing_columns IS 'Returns list of existing columns from candidates array. Used for dynamic payroll export column detection. Handles missing tables gracefully.';

