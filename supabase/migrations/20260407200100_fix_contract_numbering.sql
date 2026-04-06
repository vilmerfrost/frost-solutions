-- Fix contract numbering: use MAX-based allocator and add unique constraint

-- Add unique constraint on (tenant_id, contract_number)
ALTER TABLE public.contracts
  ADD CONSTRAINT contracts_tenant_number_unique UNIQUE (tenant_id, contract_number);

-- Replace COUNT-based numbering with MAX-based to avoid duplicates after deletions
CREATE OR REPLACE FUNCTION public.generate_contract_number(p_tenant_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_year   TEXT;
  v_max    INT;
  v_number TEXT;
BEGIN
  v_year := to_char(now(), 'YYYY');

  SELECT COALESCE(
    MAX(
      CAST(
        NULLIF(
          regexp_replace(contract_number, '^AVT-' || v_year || '-', ''),
          contract_number
        ) AS INT
      )
    ),
    0
  ) + 1
  INTO v_max
  FROM public.contracts
  WHERE tenant_id = p_tenant_id
    AND contract_number LIKE 'AVT-' || v_year || '-%';

  v_number := 'AVT-' || v_year || '-' || lpad(v_max::TEXT, 3, '0');

  RETURN v_number;
END;
$$;
