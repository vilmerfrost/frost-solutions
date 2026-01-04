import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { getTenantId } from '@/lib/serverTenant';

interface TimeEntryContext {
 tenantId: string;
 adminSupabase: ReturnType<typeof createAdminClient>;
 userId: string;
 employeeId: string | null;
 isAdmin: boolean;
}

export class TimeEntryContextError extends Error {
 status: number;

 constructor(message: string, status = 400) {
  super(message);
  this.name = 'TimeEntryContextError';
  this.status = status;
 }
}

export async function resolveTimeEntryContext(): Promise<TimeEntryContext> {
 const supabase = createClient();
 const { data: { user }, error: userError } = await supabase.auth.getUser();

 if (userError || !user) {
  throw new TimeEntryContextError('Not authenticated', 401);
 }

 let tenantId = await getTenantId();
 const adminSupabase = createAdminClient();

 // Fetch employee record for role and tenant info
 const { data: employeeData, error: employeeError } = await adminSupabase
  .from('employees')
  .select('id, role, tenant_id')
  .eq('auth_user_id', user.id)
  .maybeSingle();

 if (employeeError) {
  console.error('❌ Error fetching employee for context:', employeeError);
 }

 if (!tenantId && employeeData?.tenant_id) {
  tenantId = employeeData.tenant_id;
 }

 if (!tenantId) {
  // As last resort, find tenant from any time entry for this employee
  if (employeeData?.id) {
   const { data: anyEntry } = await adminSupabase
    .from('time_entries')
    .select('tenant_id')
    .eq('employee_id', employeeData.id)
    .limit(1)
    .maybeSingle();

   if (anyEntry?.tenant_id) {
    tenantId = anyEntry.tenant_id;
   }
  }
 }

 if (!tenantId) {
  throw new TimeEntryContextError('No tenant ID found for current user', 400);
 }

 // Ensure tenant exists (helps catch mismatches)
 const { data: tenantExists } = await adminSupabase
  .from('tenants')
  .select('id')
  .eq('id', tenantId)
  .maybeSingle();

 if (!tenantExists) {
  throw new TimeEntryContextError('Tenant not found', 404);
 }

 const role = (employeeData?.role || '').toLowerCase();
 const isAdmin = role === 'admin';

 return {
  tenantId,
  adminSupabase,
  userId: user.id,
  employeeId: employeeData?.id ?? null,
  isAdmin,
 };
}

export async function getTimeEntryColumnSet(adminSupabase: ReturnType<typeof createAdminClient>) {
 try {
  // Försök hämta kolumner från information_schema
  // Om detta misslyckas (t.ex. RLS eller permissions), returnera tom Set
  // och låt list-API:et försöka ändå att hämta approval-kolumnerna
  const { data, error } = await adminSupabase
   .from('information_schema.columns')
   .select('column_name')
   .eq('table_schema', 'public')
   .eq('table_name', 'time_entries');

  if (error) {
   console.warn('⚠️ Failed to read time_entries columns from information_schema:', error);
   console.log('[ColumnSet] Will attempt to include approval columns anyway');
   // Returnera tom Set så att list-API:et försöker ändå
   return new Set<string>();
  }

  const columnSet = new Set<string>((data || []).map((col: any) => col.column_name));
  console.log('[ColumnSet] Detected columns:', Array.from(columnSet).slice(0, 10));
  return columnSet;
 } catch (err: any) {
  console.warn('⚠️ Exception reading time_entries columns:', err);
  return new Set<string>();
 }
}
