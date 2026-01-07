-- ============================================================================
-- PERFORMANCE OPTIMIZATION INDEXES - Frost Solutions
-- Run these to add critical indexes for production performance
-- Last Updated: 2026-01-09
-- ============================================================================

-- ============================================================================
-- 1. TIME ENTRIES INDEXES (High Volume Table)
-- ============================================================================

-- Composite index for common queries (by tenant and date)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_time_entries_tenant_date 
ON time_entries(tenant_id, date DESC);

-- Index for employee lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_time_entries_employee_date 
ON time_entries(employee_id, date DESC);

-- Index for project lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_time_entries_project_date 
ON time_entries(project_id, date DESC) 
WHERE project_id IS NOT NULL;

-- Index for approval status filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_time_entries_approval_status 
ON time_entries(tenant_id, status, date DESC);

-- Index for payroll period queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_time_entries_period 
ON time_entries(tenant_id, date) 
WHERE status = 'approved';

-- ============================================================================
-- 2. INVOICES INDEXES
-- ============================================================================

-- Composite index for listing invoices
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_tenant_status_date 
ON invoices(tenant_id, status, invoice_date DESC);

-- Index for client invoices
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_client_date 
ON invoices(client_id, invoice_date DESC);

-- Index for project invoices
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_project 
ON invoices(project_id) 
WHERE project_id IS NOT NULL;

-- Index for due date (payment reminders)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_due_date 
ON invoices(due_date) 
WHERE status IN ('sent', 'overdue');

-- ============================================================================
-- 3. SUPPLIER INVOICES INDEXES
-- ============================================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_supplier_invoices_tenant_status 
ON supplier_invoices(tenant_id, status, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_supplier_invoices_supplier 
ON supplier_invoices(supplier_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_supplier_invoices_due_date 
ON supplier_invoices(due_date) 
WHERE status = 'approved';

-- ============================================================================
-- 4. PROJECTS INDEXES
-- ============================================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_tenant_status 
ON projects(tenant_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_client 
ON projects(client_id);

-- Index for active projects (most queried)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_active 
ON projects(tenant_id, created_at DESC) 
WHERE status = 'active';

-- ============================================================================
-- 5. EMPLOYEES INDEXES
-- ============================================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_tenant_active 
ON employees(tenant_id) 
WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_auth_user 
ON employees(auth_user_id) 
WHERE auth_user_id IS NOT NULL;

-- ============================================================================
-- 6. CLIENTS INDEXES
-- ============================================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clients_tenant_name 
ON clients(tenant_id, name);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clients_org_number 
ON clients(org_number) 
WHERE org_number IS NOT NULL;

-- ============================================================================
-- 7. ROT/RUT APPLICATIONS INDEXES
-- ============================================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rot_applications_tenant_status 
ON rot_applications(tenant_id, status, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rot_applications_client 
ON rot_applications(client_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rot_applications_project 
ON rot_applications(project_id) 
WHERE project_id IS NOT NULL;

-- ============================================================================
-- 8. PAYROLL INDEXES
-- ============================================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payroll_periods_tenant_status 
ON payroll_periods(tenant_id, status, start_date DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payroll_periods_date_range 
ON payroll_periods(tenant_id, start_date, end_date);

-- ============================================================================
-- 9. AI CREDITS & TRANSACTIONS INDEXES
-- ============================================================================

-- Already created in migration, but verify
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_transactions_tenant_date 
ON ai_transactions(tenant_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_transactions_feature 
ON ai_transactions(tenant_id, feature, created_at DESC);

-- ============================================================================
-- 10. AUDIT LOGS INDEXES
-- ============================================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_tenant_date 
ON audit_logs(tenant_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_action 
ON audit_logs(tenant_id, action, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_resource 
ON audit_logs(tenant_id, resource_type, resource_id);

-- ============================================================================
-- 11. NOTIFICATIONS INDEXES
-- ============================================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_unread 
ON notifications(user_id, created_at DESC) 
WHERE read_at IS NULL;

-- ============================================================================
-- 12. INTEGRATION TOKENS INDEXES
-- ============================================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fortnox_tokens_tenant 
ON fortnox_tokens(tenant_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_visma_tokens_tenant 
ON visma_tokens(tenant_id);

-- ============================================================================
-- ANALYZE TABLES (Update Statistics)
-- ============================================================================

-- Run ANALYZE on high-volume tables to update statistics
ANALYZE time_entries;
ANALYZE invoices;
ANALYZE supplier_invoices;
ANALYZE projects;
ANALYZE clients;
ANALYZE employees;
ANALYZE rot_applications;
ANALYZE payroll_periods;
ANALYZE ai_transactions;
ANALYZE audit_logs;

-- ============================================================================
-- VACUUM TABLES (Reclaim Space)
-- ============================================================================

-- Run VACUUM on tables with frequent updates/deletes
-- Note: VACUUM FULL locks the table, use regular VACUUM for production
VACUUM ANALYZE time_entries;
VACUUM ANALYZE invoices;
VACUUM ANALYZE supplier_invoices;

-- ============================================================================
-- INDEX USAGE MONITORING
-- ============================================================================

-- Query to check index usage (run periodically)
/*
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
*/

-- Query to find unused indexes (candidates for removal)
/*
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
AND schemaname = 'public'
ORDER BY tablename, indexname;
*/

-- Query to find missing indexes (tables with sequential scans)
/*
SELECT 
  schemaname,
  relname,
  seq_scan,
  seq_tup_read,
  idx_scan,
  idx_tup_fetch,
  n_live_tup
FROM pg_stat_user_tables
WHERE schemaname = 'public'
AND seq_scan > idx_scan
AND n_live_tup > 1000
ORDER BY seq_tup_read DESC
LIMIT 20;
*/

