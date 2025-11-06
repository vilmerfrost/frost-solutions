-- ============================================================================
-- RBAC: Role-Based Access Control Schema
-- ============================================================================
-- Hierarkisk rollhantering med permissions för multi-tenant SaaS
-- ============================================================================

-- 1. User Roles Table (kopplar auth.users till tenants med roller)
CREATE TABLE IF NOT EXISTS app.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'manager', 'employee', 'client')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_tenant_id ON app.user_roles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON app.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON app.user_roles(role);

-- 2. Role Permissions Table (definierar vad varje roll kan göra)
CREATE TABLE IF NOT EXISTS app.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'manager', 'employee', 'client')),
  resource TEXT NOT NULL, -- 'projects', 'invoices', 'employees', 'time_entries', etc.
  action TEXT NOT NULL CHECK (action IN ('create', 'read', 'update', 'delete', 'manage')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role, resource, action)
);

-- Populate default permissions
INSERT INTO app.role_permissions (role, resource, action) VALUES
-- Super Admin: All permissions
('super_admin', '*', 'manage'),
-- Admin: Full access to all resources
('admin', 'projects', 'create'),
('admin', 'projects', 'read'),
('admin', 'projects', 'update'),
('admin', 'projects', 'delete'),
('admin', 'employees', 'create'),
('admin', 'employees', 'read'),
('admin', 'employees', 'update'),
('admin', 'employees', 'delete'),
('admin', 'invoices', 'create'),
('admin', 'invoices', 'read'),
('admin', 'invoices', 'update'),
('admin', 'invoices', 'delete'),
('admin', 'clients', 'create'),
('admin', 'clients', 'read'),
('admin', 'clients', 'update'),
('admin', 'clients', 'delete'),
('admin', 'time_entries', 'read'),
('admin', 'time_entries', 'update'),
-- Manager: Read/update projects, manage time entries
('manager', 'projects', 'read'),
('manager', 'projects', 'update'),
('manager', 'time_entries', 'create'),
('manager', 'time_entries', 'read'),
('manager', 'time_entries', 'update'),
('manager', 'invoices', 'read'),
-- Employee: Read projects, create own time entries
('employee', 'projects', 'read'),
('employee', 'time_entries', 'create'),
('employee', 'time_entries', 'read'), -- Only own entries
-- Client: Read-only access to projects
('client', 'projects', 'read')
ON CONFLICT (role, resource, action) DO NOTHING;

-- 3. RLS Policies för user_roles
ALTER TABLE app.user_roles ENABLE ROW LEVEL SECURITY;

-- Users can see their own role
CREATE POLICY "user_roles_select_own"
ON app.user_roles FOR SELECT
USING (user_id = auth.uid());

-- Admins can see all roles in their tenant
CREATE POLICY "user_roles_select_tenant_admin"
ON app.user_roles FOR SELECT
USING (
  tenant_id IN (
    SELECT tenant_id FROM app.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);

-- Admins can insert roles in their tenant
CREATE POLICY "user_roles_admin_ins"
ON app.user_roles FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM app.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.tenant_id = app.user_roles.tenant_id 
    AND ur.role IN ('admin', 'super_admin')
  )
);

-- Admins can update roles in their tenant
CREATE POLICY "user_roles_admin_upd"
ON app.user_roles FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM app.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.tenant_id = app.user_roles.tenant_id 
    AND ur.role IN ('admin', 'super_admin')
  )
);

-- Admins can delete roles in their tenant
CREATE POLICY "user_roles_admin_del"
ON app.user_roles FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM app.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.tenant_id = app.user_roles.tenant_id 
    AND ur.role IN ('admin', 'super_admin')
  )
);

-- 4. RLS Policies för role_permissions (read-only for all authenticated users)
ALTER TABLE app.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "role_permissions_select_all"
ON app.role_permissions FOR SELECT
TO authenticated
USING (true);

-- 5. Helper Function: Get user role for tenant
CREATE OR REPLACE FUNCTION app.get_user_role(
  p_user_id UUID,
  p_tenant_id UUID
)
RETURNS TEXT 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role
  FROM app.user_roles
  WHERE user_id = p_user_id AND tenant_id = p_tenant_id;
  
  RETURN COALESCE(v_role, 'employee'); -- Default to employee if no role found
END;
$$;

-- 6. Helper Function: Check permission
CREATE OR REPLACE FUNCTION app.check_permission(
  p_user_id UUID,
  p_tenant_id UUID,
  p_resource TEXT,
  p_action TEXT
)
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
  v_role TEXT;
  v_has_permission BOOLEAN;
BEGIN
  -- Get user role
  v_role := app.get_user_role(p_user_id, p_tenant_id);
  
  -- Check if super_admin (all permissions)
  IF v_role = 'super_admin' THEN
    RETURN TRUE;
  END IF;
  
  -- Check specific permission
  SELECT EXISTS(
    SELECT 1 FROM app.role_permissions
    WHERE role = v_role
    AND (
      (resource = p_resource AND action = p_action)
      OR (resource = '*' AND action = 'manage')
    )
  ) INTO v_has_permission;
  
  RETURN COALESCE(v_has_permission, FALSE);
END;
$$;

-- 7. Updated_at trigger function
CREATE OR REPLACE FUNCTION app.touch_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql 
AS $$
BEGIN 
  NEW.updated_at = NOW(); 
  RETURN NEW; 
END;
$$;

-- 8. Trigger for updated_at on user_roles
DROP TRIGGER IF EXISTS trg_user_roles_touch ON app.user_roles;
CREATE TRIGGER trg_user_roles_touch
BEFORE UPDATE ON app.user_roles
FOR EACH ROW EXECUTE FUNCTION app.touch_updated_at();

-- 9. Migration: Migrate existing employees.role to app.user_roles
-- Run this AFTER creating the tables
DO $$
DECLARE
  emp_record RECORD;
BEGIN
  FOR emp_record IN 
    SELECT e.id, e.tenant_id, e.auth_user_id, e.role
    FROM employees e
    WHERE e.auth_user_id IS NOT NULL
  LOOP
    -- Map existing roles to new role system
    INSERT INTO app.user_roles (tenant_id, user_id, role)
    VALUES (
      emp_record.tenant_id,
      emp_record.auth_user_id,
      CASE 
        WHEN LOWER(emp_record.role) IN ('admin', 'administrator') THEN 'admin'
        WHEN LOWER(emp_record.role) = 'manager' THEN 'manager'
        ELSE 'employee'
      END
    )
    ON CONFLICT (tenant_id, user_id) DO NOTHING;
  END LOOP;
END $$;

