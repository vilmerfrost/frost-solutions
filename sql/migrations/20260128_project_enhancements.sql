-- =========================================================
-- Project Enhancements Migration
-- Adds fields for price model, ROT/RUT, addresses, etc.
-- =========================================================

-- 1. Add price_model column (löpande/fast/budget)
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS price_model TEXT DEFAULT 'hourly' 
CHECK (price_model IN ('hourly', 'fixed', 'budget'));

-- 2. Add markup_percent for material markup
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS markup_percent DECIMAL(5,2) DEFAULT 10;

-- 3. Add site_address (where work is performed)
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS site_address TEXT;

-- 4. Add ROT/RUT fields
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS is_rot_rut BOOLEAN DEFAULT false;

ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS property_designation TEXT; -- Fastighetsbeteckning

ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS apartment_number TEXT; -- Lägenhetsnummer (BRF)

ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS brf_org_number TEXT; -- BRF organisationsnummer

-- 5. Add description for internal notes
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS description TEXT;

-- 6. Add project_manager_id (ansvarig)
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS project_manager_id UUID REFERENCES public.employees(id) ON DELETE SET NULL;

-- 7. Create index for project_manager lookups
CREATE INDEX IF NOT EXISTS idx_projects_manager 
ON public.projects(project_manager_id) 
WHERE project_manager_id IS NOT NULL;

-- 8. Create index for ROT/RUT filtering
CREATE INDEX IF NOT EXISTS idx_projects_rot_rut 
ON public.projects(tenant_id, is_rot_rut) 
WHERE is_rot_rut = true;

-- 9. Add customer_orgnr if missing (for ROT validation)
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS customer_orgnr TEXT;

-- 10. Update existing projects to have 'hourly' price model
UPDATE public.projects 
SET price_model = 'hourly' 
WHERE price_model IS NULL;

COMMENT ON COLUMN public.projects.price_model IS 'Pricing model: hourly (löpande), fixed (fast pris), budget (estimat)';
COMMENT ON COLUMN public.projects.markup_percent IS 'Material markup percentage for this project';
COMMENT ON COLUMN public.projects.site_address IS 'Physical address where work is performed';
COMMENT ON COLUMN public.projects.is_rot_rut IS 'Whether project qualifies for ROT/RUT tax deduction';
COMMENT ON COLUMN public.projects.property_designation IS 'Swedish fastighetsbeteckning for ROT';
COMMENT ON COLUMN public.projects.apartment_number IS 'Apartment number for BRF projects';
COMMENT ON COLUMN public.projects.brf_org_number IS 'BRF organization number';
COMMENT ON COLUMN public.projects.description IS 'Internal notes, door codes, key locations etc.';
COMMENT ON COLUMN public.projects.project_manager_id IS 'Employee responsible for this project';
