-- ============================================
-- Enhanced Client/Customer System Migration
-- Adds support for:
--   - Client type (private/company) persistence
--   - Separate fields for private customers (personnummer, property_designation)
--   - Separate fields for companies (contact person, website)
--   - Structured address fields
-- ============================================

-- Client type
ALTER TABLE clients ADD COLUMN IF NOT EXISTS client_type TEXT DEFAULT 'company';
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'clients_type_check'
  ) THEN
    ALTER TABLE clients ADD CONSTRAINT clients_type_check 
      CHECK (client_type IS NULL OR client_type IN ('private', 'company'));
  END IF;
END $$;

-- Private customer fields
ALTER TABLE clients ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS personal_id TEXT; -- Personnummer (encrypted)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS property_designation TEXT; -- Fastighetsbeteckning for ROT

-- Structured home/billing address
ALTER TABLE clients ADD COLUMN IF NOT EXISTS street_address TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS postal_code TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS city TEXT;

-- Work/Job address (for private customers if different from home)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS work_street_address TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS work_postal_code TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS work_city TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS work_same_as_home BOOLEAN DEFAULT TRUE;

-- Invoice address (for companies if different from HQ)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS invoice_street_address TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS invoice_postal_code TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS invoice_city TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS invoice_same_as_main BOOLEAN DEFAULT TRUE;

-- Company-specific fields
ALTER TABLE clients ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS contact_person_name TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS contact_person_email TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS contact_person_phone TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS contact_person_title TEXT;

-- Notes
ALTER TABLE clients ADD COLUMN IF NOT EXISTS notes TEXT;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_clients_client_type ON clients(client_type);
CREATE INDEX IF NOT EXISTS idx_clients_personal_id ON clients(personal_id);
CREATE INDEX IF NOT EXISTS idx_clients_property_designation ON clients(property_designation);

-- Comments
COMMENT ON COLUMN clients.client_type IS 'private or company';
COMMENT ON COLUMN clients.personal_id IS 'Swedish personnummer for private customers - should be encrypted';
COMMENT ON COLUMN clients.property_designation IS 'Fastighetsbeteckning for ROT applications (e.g., Sätra 4:22)';
COMMENT ON COLUMN clients.contact_person_name IS 'Primary contact person for company clients';
