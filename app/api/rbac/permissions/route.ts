import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getUserRole, getUserPermissions } from '@/lib/rbac/permissions';

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

  // Get tenant ID from query params or use getTenantId
  const { searchParams } = new URL(req.url);
  const tenantIdParam = searchParams.get('tenantId');
  
  const role = await getUserRole(user.id, tenantIdParam || undefined);
  const permissions = await getUserPermissions(user.id, tenantIdParam || undefined);

  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
   console.log('🔍 Permissions API:', {
    userId: user.id,
    tenantId: tenantIdParam,
    role,
    permissionsCount: permissions.length,
   });
  }

  return NextResponse.json({
   success: true,
   role,
   permissions,
  });
 } catch (error: any) {
  console.error('Permissions API error:', error);
  return NextResponse.json(
   { success: false, error: error.message || 'Failed to fetch permissions' },
   { status: 500 }
  );
 }
}

