-- Archived from supabase/migrations/create_aeta_requests.sql
-- Kept for reference only. Not part of the active Supabase migration history.

-- Create aeta_requests table for ÄTA work requests
CREATE TABLE IF NOT EXISTS aeta_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  requested_by UUID NOT NULL,
  description TEXT NOT NULL,
  hours DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  approved_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aeta_requests_tenant_id ON aeta_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_aeta_requests_project_id ON aeta_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_aeta_requests_status ON aeta_requests(status);
CREATE INDEX IF NOT EXISTS idx_aeta_requests_created_at ON aeta_requests(created_at DESC);

ALTER TABLE aeta_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view aeta requests for their tenant"
  ON aeta_requests FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM employees WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create aeta requests for their tenant"
  ON aeta_requests FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM employees WHERE auth_user_id = auth.uid()
    )
    AND requested_by = auth.uid()
  );

CREATE POLICY "Users can update aeta requests for their tenant"
  ON aeta_requests FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM employees WHERE auth_user_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_aeta_requests_updated_at
  BEFORE UPDATE ON aeta_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
