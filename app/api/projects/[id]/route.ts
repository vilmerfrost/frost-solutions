// app/api/projects/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getTenantId } from '@/lib/serverTenant';

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

