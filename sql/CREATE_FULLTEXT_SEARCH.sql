-- ============================================================================
-- Full-Text Search: PostgreSQL FTS for Projects, Clients, Invoices
-- ============================================================================
-- Använder PostgreSQL's inbyggda full-text search med svenska unaccent
-- ============================================================================

-- 1. Enable unaccent extension (för å/ä/ö support)
CREATE EXTENSION IF NOT EXISTS unaccent;

-- 2. Create Swedish FTS configuration with unaccent
DROP TEXT SEARCH CONFIGURATION IF EXISTS swedish_unaccent;
CREATE TEXT SEARCH CONFIGURATION swedish_unaccent ( COPY = swedish );
ALTER TEXT SEARCH CONFIGURATION swedish_unaccent
  ALTER MAPPING FOR hword, hword_part, word WITH unaccent, swedish_stem;

-- 3. Projects Full-Text Search
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS search_text TSVECTOR;

CREATE INDEX IF NOT EXISTS projects_search_idx 
ON projects USING GIN(search_text);

-- Trigger function to update search_text
CREATE OR REPLACE FUNCTION update_project_search_text()
RETURNS TRIGGER 
LANGUAGE plpgsql 
AS $$
BEGIN
  NEW.search_text := to_tsvector('swedish_unaccent',
    COALESCE(NEW.name, '') || ' ' ||
    COALESCE(NEW.status::text, '')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS project_search_trigger ON projects;
CREATE TRIGGER project_search_trigger
BEFORE INSERT OR UPDATE ON projects
FOR EACH ROW EXECUTE FUNCTION update_project_search_text();

-- Update existing rows
UPDATE projects SET search_text = to_tsvector('swedish_unaccent',
  COALESCE(name, '') || ' ' || COALESCE(status::text, '')
);

-- 4. Clients Full-Text Search
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS search_text TSVECTOR;

CREATE INDEX IF NOT EXISTS clients_search_idx 
ON clients USING GIN(search_text);

-- Trigger function to update client search_text
CREATE OR REPLACE FUNCTION update_client_search_text()
RETURNS TRIGGER 
LANGUAGE plpgsql 
AS $$
BEGIN
  NEW.search_text := to_tsvector('swedish_unaccent',
    COALESCE(NEW.name, '') || ' ' || 
    COALESCE(NEW.org_number, '')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS client_search_trigger ON clients;
CREATE TRIGGER client_search_trigger
BEFORE INSERT OR UPDATE ON clients
FOR EACH ROW EXECUTE FUNCTION update_client_search_text();

-- Update existing rows
UPDATE clients SET search_text = to_tsvector('swedish_unaccent',
  COALESCE(name, '') || ' ' || COALESCE(org_number, '')
);

-- 5. Performance indexes for search queries
CREATE INDEX IF NOT EXISTS idx_projects_tenant_status 
ON projects(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_clients_tenant 
ON clients(tenant_id);

CREATE INDEX IF NOT EXISTS idx_invoices_tenant_status 
ON invoices(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_time_entries_tenant_date 
ON time_entries(tenant_id, date);

