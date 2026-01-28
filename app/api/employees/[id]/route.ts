// app/api/employees/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { getTenantId } from '@/lib/serverTenant';
import { createClient } from '@/utils/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Helper to verify user is admin for the tenant
 */
async function verifyAdmin(user: any, admin: any, tenantId: string) {
 const { data: employee } = await admin
  .from('employees')
  .select('id, role, tenant_id')
  .eq('auth_user_id', user.id)
  .eq('tenant_id', tenantId)
  .maybeSingle();

 return employee?.role === 'admin';
}

export async function GET(
 req: NextRequest,
 { params }: { params: Promise<{ id: string }> }
) {
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

  const { id: employeeId } = await params;
  const admin = createAdminClient(8000, 'public');
  
  // Fetch employee
  const { data: employee, error: employeeError } = await admin
   .from('employees')
   .select('id, tenant_id, full_name, name, email')
   .eq('id', employeeId)
   .eq('tenant_id', tenantId)
   .maybeSingle();

  if (employeeError) {
   console.error('Error fetching employee:', employeeError);
   return NextResponse.json(
    { success: false, error: employeeError.message || 'Failed to fetch employee' },
    { status: 500 }
   );
  }

  if (!employee) {
   return NextResponse.json(
    { success: false, error: 'Employee not found' },
    { status: 404 }
   );
  }

  return NextResponse.json({
   success: true,
   ...employee,
  });
 } catch (error: any) {
  console.error('Employee API error:', error);
  return NextResponse.json(
   { success: false, error: error.message || 'Internal server error' },
   { status: 500 }
  );
 }
}

/**
 * DELETE /api/employees/[id]
 * Delete an employee permanently (admin only)
 */
export async function DELETE(
 req: NextRequest,
 { params }: { params: Promise<{ id: string }> }
) {
 try {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
   return NextResponse.json(
    { success: false, error: 'Not authenticated' },
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

  const { id: employeeId } = await params;
  const admin = createAdminClient(8000, 'public');

  // Verify user is admin
  const isAdmin = await verifyAdmin(user, admin, tenantId);
  if (!isAdmin) {
   return NextResponse.json(
    { success: false, error: 'Unauthorized: Admin access required' },
    { status: 403 }
   );
  }

  // Fetch employee to verify it exists and belongs to tenant
  const { data: employee, error: fetchError } = await admin
   .from('employees')
   .select('id, full_name, name, tenant_id, auth_user_id')
   .eq('id', employeeId)
   .eq('tenant_id', tenantId)
   .maybeSingle();

  if (fetchError || !employee) {
   return NextResponse.json(
    { success: false, error: 'Employee not found' },
    { status: 404 }
   );
  }

  // Prevent self-deletion
  if (employee.auth_user_id === user.id) {
   return NextResponse.json(
    { success: false, error: 'Du kan inte ta bort dig själv' },
    { status: 400 }
   );
  }

  // Check if employee has time entries (optional: warn but allow deletion)
  const { data: timeEntries, error: timeError } = await admin
   .from('time_entries')
   .select('id')
   .eq('employee_id', employeeId)
   .limit(1);

  if (!timeError && timeEntries && timeEntries.length > 0) {
   console.log(`⚠️ Employee ${employeeId} has time entries - they will be orphaned`);
  }

  // Delete employee
  const { error: deleteError } = await admin
   .from('employees')
   .delete()
   .eq('id', employeeId)
   .eq('tenant_id', tenantId);

  if (deleteError) {
   console.error('Error deleting employee:', deleteError);
   return NextResponse.json(
    { success: false, error: deleteError.message || 'Failed to delete employee' },
    { status: 500 }
   );
  }

  const employeeName = employee.full_name || employee.name || 'Anställd';
  console.log(`✅ Employee "${employeeName}" (${employeeId}) deleted by user ${user.id}`);

  return NextResponse.json({
   success: true,
   message: `${employeeName} har tagits bort`,
  });
 } catch (error: any) {
  console.error('Employee DELETE error:', error);
  return NextResponse.json(
   { success: false, error: error.message || 'Internal server error' },
   { status: 500 }
  );
 }
}

