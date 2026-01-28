// app/api/projects/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { getTenantId } from '@/lib/serverTenant';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Helper to verify user is admin for the tenant
 */
async function verifyAdmin(userId: string, admin: any, tenantId: string) {
  const { data: employee } = await admin
    .from('employees')
    .select('id, role, tenant_id')
    .eq('auth_user_id', userId)
    .eq('tenant_id', tenantId)
    .maybeSingle();

  return employee?.role === 'admin';
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const supabase = createClient();
    const tenantId = await getTenantId();
    
    if (!tenantId) {
      return NextResponse.json({ error: 'No tenant found' }, { status: 401 });
    }

    // Try to fetch project with client info
    let { data: project, error } = await supabase
      .from('projects')
      .select('*, clients(id, name, org_number), client_id')
      .eq('id', projectId)
      .eq('tenant_id', tenantId)
      .maybeSingle();

    // If error about org_number, retry without it
    if (error && error.message?.includes('org_number')) {
      const retry = await supabase
        .from('projects')
        .select('*, clients(id, name), client_id')
        .eq('id', projectId)
        .eq('tenant_id', tenantId)
        .maybeSingle();
      
      if (!retry.error && retry.data) {
        project = retry.data;
        error = null;
      } else {
        error = retry.error;
      }
    }

    if (error) {
      console.error('Error fetching project:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({ project });
  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/projects/[id]
 * Delete a project permanently (admin only)
 */
export async function DELETE(
  request: NextRequest,
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
    if (!projectId) {
      return NextResponse.json(
        { success: false, error: 'Project ID is required' },
        { status: 400 }
      );
    }

    const admin = createAdminClient(8000, 'public');

    // Verify user is admin
    const isAdmin = await verifyAdmin(user.id, admin, tenantId);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    // Fetch project to verify it exists and belongs to tenant
    const { data: project, error: fetchError } = await admin
      .from('projects')
      .select('id, name, tenant_id')
      .eq('id', projectId)
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (fetchError || !project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // Check if project has invoices
    const { data: invoices, error: invoicesError } = await admin
      .from('invoices')
      .select('id')
      .eq('project_id', projectId)
      .limit(1);

    if (!invoicesError && invoices && invoices.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Projektet har associerade fakturor och kan inte tas bort. Arkivera projektet istället.' 
        },
        { status: 400 }
      );
    }

    // Delete related time entries first (or set project_id to null)
    const { error: timeEntriesError } = await admin
      .from('time_entries')
      .delete()
      .eq('project_id', projectId);

    if (timeEntriesError) {
      console.warn('Warning: Could not delete time entries:', timeEntriesError);
      // Try to unlink instead
      await admin
        .from('time_entries')
        .update({ project_id: null })
        .eq('project_id', projectId);
    }

    // Delete project_employees relations
    await admin
      .from('project_employees')
      .delete()
      .eq('project_id', projectId);

    // Delete budget_alerts
    await admin
      .from('budget_alerts')
      .delete()
      .eq('project_id', projectId);

    // Delete project
    const { error: deleteError } = await admin
      .from('projects')
      .delete()
      .eq('id', projectId)
      .eq('tenant_id', tenantId);

    if (deleteError) {
      console.error('Error deleting project:', deleteError);
      return NextResponse.json(
        { success: false, error: deleteError.message || 'Failed to delete project' },
        { status: 500 }
      );
    }

    console.log(`✅ Project "${project.name}" (${projectId}) deleted by user ${user.id}`);

    return NextResponse.json({
      success: true,
      message: `Projektet "${project.name}" har tagits bort`,
    });
  } catch (error: any) {
    console.error('Project DELETE error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

