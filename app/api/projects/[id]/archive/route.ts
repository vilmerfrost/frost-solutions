// app/api/projects/[id]/archive/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { getTenantId } from '@/lib/serverTenant';
import { createClient } from '@/utils/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * PATCH /api/projects/[id]/archive
 * Archive or restore a project (admin only)
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

    const { id: projectId } = await params;
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

    // Fetch project to verify it exists
    const { data: project, error: fetchError } = await admin
      .from('projects')
      .select('id, name, tenant_id, status')
      .eq('id', projectId)
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (fetchError || !project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // Update status
    const newStatus = action === 'archive' ? 'archived' : 'active';
    const { data: updatedProject, error: updateError } = await admin
      .from('projects')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating project:', updateError);
      return NextResponse.json(
        { success: false, error: updateError.message || 'Failed to update project' },
        { status: 500 }
      );
    }

    const message = action === 'archive' 
      ? `Projektet "${project.name}" har arkiverats`
      : `Projektet "${project.name}" har återställts`;

    console.log(`✅ Project "${project.name}" (${projectId}) ${action}d by user ${user.id}`);

    return NextResponse.json({
      success: true,
      project: updatedProject,
      message,
    });
  } catch (error: any) {
    console.error('Project archive error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
