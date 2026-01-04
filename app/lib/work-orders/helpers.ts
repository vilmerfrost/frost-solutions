// lib/work-orders/helpers.ts

import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { getTenantId as getTenantIdFromServer } from '@/lib/serverTenant';
import { extractErrorMessage } from '@/lib/errorUtils';
import type { Role } from '@/lib/work-order-state-machine';

// Re-export getTenantId for convenience
export { getTenantIdFromServer as getTenantId };

/**
 * Get user role from employees table
 * Returns 'admin' | 'manager' | 'employee'
 */
export async function getUserRole(): Promise<Role> {
 const supabase = createClient();
 const { data: { user } } = await supabase.auth.getUser();
 
 if (!user) {
  return 'employee';
 }

 const tenantId = await getTenantIdFromServer();
 if (!tenantId) {
  return 'employee';
 }

 const admin = createAdminClient();
 const { data: employeeData } = await admin
  .from('employees')
  .select('role')
  .eq('auth_user_id', user.id)
  .eq('tenant_id', tenantId)
  .maybeSingle();

 const role = employeeData?.role as string | undefined;
 
 if (role === 'admin' || role === 'manager') {
  return role as Role;
 }
 
 return 'employee';
}

/**
 * Require admin role or throw error
 */
export async function requireAdminOrThrow() {
 const role = await getUserRole();
 if (role !== 'admin') {
  const e: any = new Error('Endast administratörer får utföra denna åtgärd.');
  e.status = 403;
  throw e;
 }
}

/**
 * Generate work order number (WO-YYYY-NNN) safely via DB function
 * Note: Function must be in public schema or accessible via RPC
 */
export async function getWorkOrderNumber(tenantId: string): Promise<string> {
 const admin = createAdminClient();
 
 // Try with app schema prefix first
 let { data, error } = await admin.rpc('app.next_work_order_number', { 
  p_tenant: tenantId 
 });
 
 // If that fails, try without schema prefix (might be in public)
 if (error) {
  const result = await admin.rpc('next_work_order_number', { 
   p_tenant: tenantId 
  });
  data = result.data;
  error = result.error;
 }
 
 if (error || !data) {
  console.error('Error generating work order number:', error);
  throw new Error(`Kunde inte generera arbetsorder-nummer: ${extractErrorMessage(error)}`);
 }
 
 return data as string;
}

/**
 * Verify that a work order belongs to tenant and exists
 */
export async function verifyWorkOrderAccess(tenantId: string, id: string) {
 const admin = createAdminClient();
 const { data, error } = await admin
  .from('work_orders')
  .select('id, tenant_id')
  .eq('id', id)
  .single();

 if (error || !data) {
  const e: any = new Error('Arbetsorder hittades inte.');
  e.status = 404;
  throw e;
 }

 if (data.tenant_id !== tenantId) {
  const e: any = new Error('Otillåten åtkomst till arbetsorder.');
  e.status = 403;
  throw e;
 }
}

