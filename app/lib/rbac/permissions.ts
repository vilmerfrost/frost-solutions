import { createAdminClient } from '@/utils/supabase/admin';
import { getTenantId } from '@/lib/serverTenant';

export type Role = 'super_admin' | 'admin' | 'manager' | 'employee' | 'client';
export type Resource = 'projects' | 'invoices' | 'employees' | 'time_entries' | 'clients' | '*';
export type Action = 'create' | 'read' | 'update' | 'delete' | 'manage';

/**
 * Get user role for current tenant
 */
export async function getUserRole(userId: string, tenantId?: string): Promise<Role> {
 const tid = tenantId ?? (await getTenantId());
 
 if (!tid) {
  throw new Error('No tenant ID found');
 }

 const admin = createAdminClient(8000, 'app'); // 👈 schema=app
 
 // First try to get from app.user_roles
 const { data, error } = await admin
  .from('user_roles')
  .select('role')
  .eq('user_id', userId)
  .eq('tenant_id', tid)
  .maybeSingle();

 if (error) {
  console.error('Error fetching user role from app.user_roles:', error);
 }

 if (data?.role) {
  return data.role as Role;
 }

 // Fallback: Check employees table for legacy role
 const { data: employeeData, error: employeeError } = await admin
  .from('employees')
  .select('role, email')
  .eq('auth_user_id', userId)
  .eq('tenant_id', tid)
  .maybeSingle();

 if (employeeError) {
  console.error('Error fetching employee role:', employeeError);
 }

 if (employeeData?.role) {
  const legacyRole = employeeData.role.toLowerCase();
  // Map legacy roles to new role system
  if (legacyRole === 'admin' || legacyRole === 'administrator') {
   return 'admin';
  }
  if (legacyRole === 'manager') {
   return 'manager';
  }
  return 'employee';
 }

 // ADDITIONAL FALLBACK: Try to find employee by getting user email from auth
 // This handles cases where auth_user_id wasn't set in employee record
 const { createClient } = await import('@/utils/supabase/server');
 const supabase = createClient();
 const { data: userData } = await supabase.auth.getUser();
 
 if (userData?.user?.email) {
  const { data: emailEmployee } = await admin
   .from('employees')
   .select('role')
   .eq('email', userData.user.email)
   .eq('tenant_id', tid)
   .maybeSingle();
  
  if (emailEmployee?.role) {
   console.log('✅ Found role via email lookup:', emailEmployee.role);
   const legacyRole = emailEmployee.role.toLowerCase();
   if (legacyRole === 'admin' || legacyRole === 'administrator') {
    return 'admin';
   }
   if (legacyRole === 'manager') {
    return 'manager';
   }
   return 'employee';
  }
 }

 // Default fallback
 return 'employee';
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
 const tid = tenantId ?? (await getTenantId());
 
 if (!tid) {
  return false;
 }

 const admin = createAdminClient(); // RPC går fint via public
 const { data, error } = await admin.rpc('app.check_permission', {
  p_user_id: userId,
  p_tenant_id: tid,
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
 const tid = tenantId ?? (await getTenantId());
 
 if (!tid) {
  return [];
 }

 const role = await getUserRole(userId, tid);
 const admin = createAdminClient(8000, 'app');

 const { data, error } = await admin
  .from('role_permissions')
  .select('resource, action')
  .eq('role', role);

 if (error) {
  console.error('Error fetching permissions:', error);
  return [];
 }

 return (data || []) as { resource: Resource; action: Action }[];
}

