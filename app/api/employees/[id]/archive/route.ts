// app/api/employees/[id]/archive/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { getTenantId } from '@/lib/serverTenant';
import { createClient } from '@/utils/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * PATCH /api/employees/[id]/archive
 * Archive or restore an employee (admin only)
 */
export async function PATCH(
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
    const { action } = await req.json(); // 'archive' or 'restore'

    if (!['archive', 'restore'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Use "archive" or "restore"' },
        { status: 400 }
      );
    }

    const admin = createAdminClient(8000, 'public');

    // Verify user is admin
    const { data: currentEmployee } = await admin
      .from('employees')
      .select('id, role, tenant_id')
      .eq('auth_user_id', user.id)
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (!currentEmployee || currentEmployee.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    // Fetch employee to verify it exists
    const { data: employee, error: fetchError } = await admin
      .from('employees')
      .select('id, full_name, name, tenant_id, auth_user_id, archived')
      .eq('id', employeeId)
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (fetchError || !employee) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Prevent self-archiving
    if (employee.auth_user_id === user.id && action === 'archive') {
      return NextResponse.json(
        { success: false, error: 'Du kan inte arkivera dig själv' },
        { status: 400 }
      );
    }

    // Update archived status
    const { data: updatedEmployee, error: updateError } = await admin
      .from('employees')
      .update({ 
        archived: action === 'archive',
        updated_at: new Date().toISOString()
      })
      .eq('id', employeeId)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating employee:', updateError);
      return NextResponse.json(
        { success: false, error: updateError.message || 'Failed to update employee' },
        { status: 500 }
      );
    }

    const employeeName = employee.full_name || employee.name || 'Anställd';
    const message = action === 'archive' 
      ? `${employeeName} har arkiverats`
      : `${employeeName} har återställts`;

    console.log(`✅ Employee "${employeeName}" (${employeeId}) ${action}d by user ${user.id}`);

    return NextResponse.json({
      success: true,
      employee: updatedEmployee,
      message,
    });
  } catch (error: any) {
    console.error('Employee archive error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
