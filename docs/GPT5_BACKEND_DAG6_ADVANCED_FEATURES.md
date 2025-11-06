# CHATGPT 5 BACKEND IMPLEMENTATION PROMPT - DAY 6 ADVANCED FEATURES

## 🎯 MISSION
Implementera backend för **P0 (Priority 0) features** från Perplexity Researcher's analys för Frost Solutions - en multi-tenant SaaS-plattform för byggprojekthantering.

**Stack:** Next.js 16 App Router + Supabase (PostgreSQL) + TypeScript + React Query v5

---

## 📋 PRIORITET: P0 FEATURES (Implementera i denna ordning)

### 1. **RBAC & Permissions** (2 dagar) - 🔴 KRITISKT
### 2. **Advanced Search** (1-2 dagar) - 🔴 KRITISKT  
### 3. **Dashboard Analytics** (2-3 dagar) - 🔴 KRITISKT

---

## 🏗️ EXISTING CODEBASE CONTEXT

### Nuvarande Arkitektur:
- **Multi-tenant:** Alla tabeller har `tenant_id` för isolation
- **RLS:** Row Level Security aktiverat på alla tabeller
- **Auth:** Supabase Auth med `auth.users` och `employees` table
- **Roles:** Basic roles i `employees.role` ('admin' | 'employee')
- **Schema:** Både `public` och `app` schemas används
- **Admin Client:** `createAdminClient()` för RLS-bypass där nödvändigt
- **Server Tenant:** `getTenantId()` helper för att hämta tenant från JWT/cookies

### Befintliga Tabeller:
```sql
-- Core tables
tenants (id, name, ...)
employees (id, tenant_id, auth_user_id, role, ...)
projects (id, tenant_id, name, status, budgeted_hours, base_rate_sek, ...)
time_entries (id, tenant_id, project_id, employee_id, hours_total, date, is_billed, ...)
invoices (id, tenant_id, project_id, amount, status, ...)
clients (id, tenant_id, name, ...)
schedule_slots (id, tenant_id, employee_id, start_time, end_time, ...) -- app schema
notifications (id, tenant_id, recipient_id, type, title, message, read, ...)
```

### Befintliga Patterns:
- API routes: `app/api/[resource]/route.ts` med `runtime = 'nodejs'` och `dynamic = 'force-dynamic'`
- Server helpers: `@/lib/serverTenant`, `@/utils/supabase/admin`
- Error handling: `extractErrorMessage()` från `@/lib/errorUtils`
- Response format: `{ success: boolean, data?: T, error?: string }`

---

## 1️⃣ RBAC & PERMISSIONS - IMPLEMENTATION

### 1.1 SQL Schema

**Skapa SQL-fil:** `sql/CREATE_RBAC_SCHEMA.sql`

```sql
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
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role
  FROM app.user_roles
  WHERE user_id = p_user_id AND tenant_id = p_tenant_id;
  
  RETURN COALESCE(v_role, 'employee'); -- Default to employee if no role found
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Helper Function: Check permission
CREATE OR REPLACE FUNCTION app.check_permission(
  p_user_id UUID,
  p_tenant_id UUID,
  p_resource TEXT,
  p_action TEXT
)
RETURNS BOOLEAN AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Migration: Migrate existing employees.role to app.user_roles
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
```

### 1.2 Backend Helper Functions

**Skapa:** `app/lib/rbac/permissions.ts`

```typescript
import { createAdminClient } from '@/utils/supabase/admin';
import { getTenantId } from '@/lib/serverTenant';

export type Role = 'super_admin' | 'admin' | 'manager' | 'employee' | 'client';
export type Resource = 'projects' | 'invoices' | 'employees' | 'time_entries' | 'clients' | '*';
export type Action = 'create' | 'read' | 'update' | 'delete' | 'manage';

/**
 * Get user role for current tenant
 */
export async function getUserRole(userId: string, tenantId?: string): Promise<Role> {
  const admin = createAdminClient();
  const resolvedTenantId = tenantId || (await getTenantId());
  
  if (!resolvedTenantId) {
    throw new Error('No tenant ID found');
  }

  const { data, error } = await admin
    .schema('app')
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('tenant_id', resolvedTenantId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching user role:', error);
    return 'employee'; // Default fallback
  }

  return (data?.role as Role) || 'employee';
}

/**
 * Check if user has permission for resource/action
 */
export async function hasPermission(
  userId: string,
  resource: Resource,
  action: Action,
  tenantId?: string
): Promise<boolean> {
  const admin = createAdminClient();
  const resolvedTenantId = tenantId || (await getTenantId());
  
  if (!resolvedTenantId) {
    return false;
  }

  // Use database function for permission check
  const { data, error } = await admin.rpc('check_permission', {
    p_user_id: userId,
    p_tenant_id: resolvedTenantId,
    p_resource: resource,
    p_action: action,
  });

  if (error) {
    console.error('Error checking permission:', error);
    return false;
  }

  return data === true;
}

/**
 * Require permission or throw error (for API routes)
 */
export async function requirePermission(
  userId: string,
  resource: Resource,
  action: Action,
  tenantId?: string
): Promise<void> {
  const hasAccess = await hasPermission(userId, resource, action, tenantId);
  
  if (!hasAccess) {
    throw new Error(`Permission denied: ${action} on ${resource}`);
  }
}

/**
 * Get all permissions for a user (for frontend)
 */
export async function getUserPermissions(
  userId: string,
  tenantId?: string
): Promise<{ resource: Resource; action: Action }[]> {
  const admin = createAdminClient();
  const resolvedTenantId = tenantId || (await getTenantId());
  
  if (!resolvedTenantId) {
    return [];
  }

  const role = await getUserRole(userId, resolvedTenantId);

  const { data, error } = await admin
    .schema('app')
    .from('role_permissions')
    .select('resource, action')
    .eq('role', role);

  if (error) {
    console.error('Error fetching permissions:', error);
    return [];
  }

  return (data || []) as { resource: Resource; action: Action }[];
}
```

### 1.3 API Route Middleware

**Skapa:** `app/lib/rbac/middleware.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requirePermission, Resource, Action } from './permissions';

/**
 * Middleware wrapper for API routes that require permissions
 */
export function withPermission(
  resource: Resource,
  action: Action,
  handler: (req: NextRequest, context: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, context: any) => {
    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }

      // Check permission
      await requirePermission(user.id, resource, action);

      // Call handler if permission granted
      return handler(req, context);
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || 'Permission denied' },
        { status: 403 }
      );
    }
  };
}
```

### 1.4 Example: Protected API Route

**Uppdatera:** `app/api/projects/route.ts` (eller skapa ny)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { withPermission } from '@/lib/rbac/middleware';
import { createAdminClient } from '@/utils/supabase/admin';
import { getTenantId } from '@/lib/serverTenant';

// GET: List projects (requires 'read' permission)
export const GET = withPermission('projects', 'read', async (req: NextRequest) => {
  const tenantId = await getTenantId();
  if (!tenantId) {
    return NextResponse.json(
      { success: false, error: 'No tenant found' },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('projects')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data });
});

// POST: Create project (requires 'create' permission)
export const POST = withPermission('projects', 'create', async (req: NextRequest) => {
  const tenantId = await getTenantId();
  if (!tenantId) {
    return NextResponse.json(
      { success: false, error: 'No tenant found' },
      { status: 400 }
    );
  }

  const body = await req.json();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from('projects')
    .insert({
      ...body,
      tenant_id: tenantId,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data }, { status: 201 });
});
```

---

## 2️⃣ ADVANCED SEARCH - IMPLEMENTATION

### 2.1 SQL: Full-Text Search Setup

**Skapa:** `sql/CREATE_FULLTEXT_SEARCH.sql`

```sql
-- ============================================================================
-- Full-Text Search: PostgreSQL FTS for Projects, Clients, Invoices
-- ============================================================================
-- Använder PostgreSQL's inbyggda full-text search (gratis, snabb, real-time)
-- ============================================================================

-- 1. Add search_text column to projects
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS search_text TSVECTOR;

-- 2. Create GIN index for fast search
CREATE INDEX IF NOT EXISTS projects_search_idx 
ON projects USING GIN(search_text);

-- 3. Create trigger function to update search_text
CREATE OR REPLACE FUNCTION update_project_search_text()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_text := to_tsvector('swedish',
    COALESCE(NEW.name, '') || ' ' ||
    COALESCE(NEW.description, '') || ' ' ||
    COALESCE(NEW.customer_name, '') || ' ' ||
    COALESCE(NEW.status::text, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger
DROP TRIGGER IF EXISTS project_search_trigger ON projects;
CREATE TRIGGER project_search_trigger
BEFORE INSERT OR UPDATE ON projects
FOR EACH ROW EXECUTE FUNCTION update_project_search_text();

-- 5. Update existing rows
UPDATE projects SET search_text = to_tsvector('swedish',
  COALESCE(name, '') || ' ' ||
  COALESCE(description, '') || ' ' ||
  COALESCE(customer_name, '') || ' ' ||
  COALESCE(status::text, '')
);

-- 6. Similar for clients
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS search_text TSVECTOR;

CREATE INDEX IF NOT EXISTS clients_search_idx 
ON clients USING GIN(search_text);

CREATE OR REPLACE FUNCTION update_client_search_text()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_text := to_tsvector('swedish',
    COALESCE(NEW.name, '') || ' ' ||
    COALESCE(NEW.org_number, '') || ' ' ||
    COALESCE(NEW.contact_email, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS client_search_trigger ON clients;
CREATE TRIGGER client_search_trigger
BEFORE INSERT OR UPDATE ON clients
FOR EACH ROW EXECUTE FUNCTION update_client_search_text();

UPDATE clients SET search_text = to_tsvector('swedish',
  COALESCE(name, '') || ' ' ||
  COALESCE(org_number, '') || ' ' ||
  COALESCE(contact_email, '')
);
```

### 2.2 Backend Search API

**Skapa:** `app/api/search/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { getTenantId } from '@/lib/serverTenant';
import { createClient } from '@/utils/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const tenantId = await getTenantId();
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'No tenant found' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { query, resource, filters } = body;

    if (!query || query.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Query must be at least 2 characters' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const results: any = {};

    // Search projects
    if (!resource || resource === 'projects') {
      let projectsQuery = admin
        .from('projects')
        .select('id, name, description, status, customer_name, created_at')
        .eq('tenant_id', tenantId)
        .textSearch('search_text', query, {
          type: 'plain',
          config: 'swedish',
        })
        .order('created_at', { ascending: false })
        .limit(20);

      // Apply filters
      if (filters?.status) {
        projectsQuery = projectsQuery.in('status', Array.isArray(filters.status) ? filters.status : [filters.status]);
      }

      const { data: projects, error: projectsError } = await projectsQuery;

      if (!projectsError) {
        results.projects = projects || [];
      }
    }

    // Search clients
    if (!resource || resource === 'clients') {
      const { data: clients, error: clientsError } = await admin
        .from('clients')
        .select('id, name, org_number, contact_email')
        .eq('tenant_id', tenantId)
        .textSearch('search_text', query, {
          type: 'plain',
          config: 'swedish',
        })
        .limit(20);

      if (!clientsError) {
        results.clients = clients || [];
      }
    }

    // Search invoices (simple text search on amount, customer_name)
    if (!resource || resource === 'invoices') {
      const { data: invoices, error: invoicesError } = await admin
        .from('invoices')
        .select('id, number, amount, customer_name, status, issue_date')
        .eq('tenant_id', tenantId)
        .or(`customer_name.ilike.%${query}%,number.ilike.%${query}%`)
        .order('issue_date', { ascending: false })
        .limit(20);

      if (!invoicesError) {
        results.invoices = invoices || [];
      }
    }

    return NextResponse.json({
      success: true,
      data: results,
      query,
    });
  } catch (error: any) {
    console.error('Search error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Search failed' },
      { status: 500 }
    );
  }
}
```

---

## 3️⃣ DASHBOARD ANALYTICS - IMPLEMENTATION

### 3.1 Analytics API

**Skapa:** `app/api/analytics/dashboard/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { getTenantId } from '@/lib/serverTenant';
import { createClient } from '@/utils/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const tenantId = await getTenantId();
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'No tenant found' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const url = new URL(req.url);
    const period = url.searchParams.get('period') || 'month'; // 'week', 'month', 'year'

    // Calculate date range
    const now = new Date();
    const startDate = new Date();
    if (period === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(now.getMonth() - 1);
    } else if (period === 'year') {
      startDate.setFullYear(now.getFullYear() - 1);
    }

    // 1. Projects Statistics
    const { data: projects, error: projectsError } = await admin
      .from('projects')
      .select('id, status, budgeted_hours, base_rate_sek')
      .eq('tenant_id', tenantId);

    const activeProjects = (projects || []).filter(p => p.status === 'active').length;
    const totalBudgetedHours = (projects || []).reduce((sum, p) => sum + (p.budgeted_hours || 0), 0);

    // 2. Time Entries Statistics
    const { data: timeEntries, error: timeEntriesError } = await admin
      .from('time_entries')
      .select('hours_total, date, project_id, is_billed')
      .eq('tenant_id', tenantId)
      .gte('date', startDate.toISOString().split('T')[0]);

    const totalHours = (timeEntries || []).reduce((sum, te) => sum + parseFloat(te.hours_total || '0'), 0);
    const unbilledHours = (timeEntries || []).filter(te => !te.is_billed).reduce((sum, te) => sum + parseFloat(te.hours_total || '0'), 0);

    // 3. Invoices Statistics
    const { data: invoices, error: invoicesError } = await admin
      .from('invoices')
      .select('amount, status, issue_date')
      .eq('tenant_id', tenantId)
      .gte('issue_date', startDate.toISOString().split('T')[0]);

    const totalRevenue = (invoices || []).filter(i => i.status === 'paid').reduce((sum, i) => sum + parseFloat(i.amount || '0'), 0);
    const unpaidInvoices = (invoices || []).filter(i => i.status === 'sent' || i.status === 'draft').length;
    const unpaidAmount = (invoices || []).filter(i => i.status === 'sent' || i.status === 'draft').reduce((sum, i) => sum + parseFloat(i.amount || '0'), 0);

    // 4. Employees Statistics
    const { data: employees, error: employeesError } = await admin
      .from('employees')
      .select('id')
      .eq('tenant_id', tenantId);

    // 5. Calculate KPIs
    const avgRate = projects && projects.length > 0
      ? projects.reduce((sum, p) => sum + (p.base_rate_sek || 0), 0) / projects.length
      : 0;

    const totalCost = totalHours * avgRate;
    const budgetVariance = totalBudgetedHours > 0
      ? ((totalHours / totalBudgetedHours) - 1) * 100
      : 0;

    // 6. Project Performance (SPI/CPI simplified)
    const projectPerformance = (projects || []).map(project => {
      const projectHours = (timeEntries || []).filter(te => te.project_id === project.id)
        .reduce((sum, te) => sum + parseFloat(te.hours_total || '0'), 0);
      
      const plannedHours = project.budgeted_hours || 0;
      const spi = plannedHours > 0 ? projectHours / plannedHours : 0; // Simplified SPI

      return {
        projectId: project.id,
        name: project.name || 'Unnamed',
        spi: Math.round(spi * 100) / 100,
        status: project.status,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          activeProjects,
          totalEmployees: employees?.length || 0,
          totalHours: Math.round(totalHours * 100) / 100,
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          unpaidInvoices,
          unpaidAmount: Math.round(unpaidAmount * 100) / 100,
        },
        kpis: {
          budgetVariance: Math.round(budgetVariance * 100) / 100,
          utilization: totalBudgetedHours > 0 ? Math.round((totalHours / totalBudgetedHours) * 100) / 100 : 0,
          unbilledHours: Math.round(unbilledHours * 100) / 100,
        },
        projectPerformance: projectPerformance.slice(0, 10), // Top 10
        period,
      },
    });
  } catch (error: any) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Analytics failed' },
      { status: 500 }
    );
  }
}
```

### 3.2 Project-Specific Analytics

**Skapa:** `app/api/projects/[id]/analytics/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { getTenantId } from '@/lib/serverTenant';
import { createClient } from '@/utils/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const tenantId = await getTenantId();
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'No tenant found' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Fetch project
    const { data: project, error: projectError } = await admin
      .from('projects')
      .select('id, name, budgeted_hours, base_rate_sek, status')
      .eq('id', projectId)
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (projectError || !project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // Fetch time entries
    const { data: timeEntries, error: timeEntriesError } = await admin
      .from('time_entries')
      .select('hours_total, date, is_billed')
      .eq('project_id', projectId)
      .eq('tenant_id', tenantId);

    const actualHours = (timeEntries || []).reduce((sum, te) => sum + parseFloat(te.hours_total || '0'), 0);
    const rate = project.base_rate_sek || 0;
    const actualCost = actualHours * rate;
    const plannedHours = project.budgeted_hours || 0;
    const plannedValue = plannedHours * rate;

    // Calculate KPIs
    const spi = plannedHours > 0 ? actualHours / plannedHours : 0; // Schedule Performance Index
    const cpi = actualCost > 0 ? plannedValue / actualCost : 0; // Cost Performance Index (simplified)
    const budgetVariance = plannedValue > 0 ? ((actualCost - plannedValue) / plannedValue) * 100 : 0;

    // Fetch invoices for this project
    const { data: invoices, error: invoicesError } = await admin
      .from('invoices')
      .select('amount, status')
      .eq('project_id', projectId)
      .eq('tenant_id', tenantId);

    const revenue = (invoices || []).filter(i => i.status === 'paid').reduce((sum, i) => sum + parseFloat(i.amount || '0'), 0);
    const profitability = revenue > 0 ? ((revenue - actualCost) / revenue) * 100 : 0;

    return NextResponse.json({
      success: true,
      data: {
        project: {
          id: project.id,
          name: project.name,
          status: project.status,
        },
        metrics: {
          actualHours: Math.round(actualHours * 100) / 100,
          plannedHours: Math.round(plannedHours * 100) / 100,
          actualCost: Math.round(actualCost * 100) / 100,
          plannedValue: Math.round(plannedValue * 100) / 100,
          revenue: Math.round(revenue * 100) / 100,
        },
        kpis: {
          spi: Math.round(spi * 100) / 100,
          cpi: Math.round(cpi * 100) / 100,
          budgetVariance: Math.round(budgetVariance * 100) / 100,
          profitability: Math.round(profitability * 100) / 100,
        },
        status: {
          onSchedule: spi >= 0.95,
          onBudget: budgetVariance >= -5, // Within 5% of budget
          profitable: profitability > 0,
        },
      },
    });
  } catch (error: any) {
    console.error('Project analytics error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Analytics failed' },
      { status: 500 }
    );
  }
}
```

---

## ✅ ACCEPTANCE CRITERIA

### RBAC:
- [ ] SQL schema skapad och migrerad
- [ ] `getUserRole()` och `hasPermission()` fungerar
- [ ] `withPermission()` middleware fungerar
- [ ] Minst 2 API routes skyddade med permissions
- [ ] Befintliga employees migrerade till `app.user_roles`

### Advanced Search:
- [ ] Full-text search indexerar projects och clients
- [ ] `/api/search` endpoint returnerar relevanta resultat
- [ ] Sökning fungerar med svenska tecken (å, ä, ö)
- [ ] Filters (status, etc.) fungerar

### Dashboard Analytics:
- [ ] `/api/analytics/dashboard` returnerar korrekta KPIs
- [ ] `/api/projects/[id]/analytics` returnerar projekt-specifika metrics
- [ ] SPI, CPI, Budget Variance beräknas korrekt
- [ ] Data är tenant-isolerad

---

## 📝 IMPLEMENTATION NOTES

1. **SQL först:** Kör alla SQL-filer i Supabase SQL Editor INNAN backend-kod
2. **Testa stegvis:** Implementera RBAC → Testa → Search → Testa → Analytics → Testa
3. **Error handling:** Alla API routes måste returnera `{ success: boolean, data?, error? }`
4. **Tenant isolation:** ALLTID filtrera på `tenant_id`
5. **TypeScript:** Använd strikta typer, inga `any` om möjligt
6. **Performance:** Använd indexes, limit results, cache där möjligt

---

## 🚀 START IMPLEMENTATION

**Steg 1:** Skapa SQL-filer och kör dem i Supabase
**Steg 2:** Implementera RBAC helpers och middleware
**Steg 3:** Skydda minst 2 API routes med permissions
**Steg 4:** Implementera search API
**Steg 5:** Implementera analytics APIs
**Steg 6:** Testa allt och fixa bugs

**Lycka till! 🎯**

