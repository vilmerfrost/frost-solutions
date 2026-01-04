// app/api/employees/[id]/route.ts
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

