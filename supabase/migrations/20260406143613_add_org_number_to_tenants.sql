ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS org_number TEXT;

COMMENT ON COLUMN public.tenants.org_number IS 'Swedish organization number (organisationsnummer), e.g. 556123-4567';;
