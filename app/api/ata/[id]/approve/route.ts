import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getTenantId } from '@/lib/serverTenant'

/**
 * POST /api/ata/[id]/approve
 * Godkänner ÄTA och uppdaterar status_timeline
 */
export async function POST(
 req: Request,
 { params }: { params: Promise<{ id: string }> }
) {
 try {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const tenantId = await getTenantId()
  if (!tenantId) {
   return NextResponse.json({ error: 'No tenant found' }, { status: 400 })
  }

  const { id } = await params

  // Kontrollera admin-access
  const adminSupabase = createAdminClient(
   process.env.NEXT_PUBLIC_SUPABASE_URL!,
   process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: employeeData } = await adminSupabase
   .from('employees')
   .select('id, role')
   .eq('auth_user_id', user.id)
   .eq('tenant_id', tenantId)
   .single()

  if (!employeeData || employeeData.role !== 'admin') {
   return NextResponse.json(
    { error: 'Admin access required' },
    { status: 403 }
   )
  }

  // Hämta ÄTA
  const { data: ata, error: ataError } = await adminSupabase
   .from('rot_applications')
   .select('*')
   .eq('id', id)
   .eq('tenant_id', tenantId)
   .single()

  if (ataError || !ata) {
   return NextResponse.json(
    { error: 'ÄTA not found' },
    { status: 404 }
   )
  }

  // Kontrollera om redan godkänd/avslagen
  const timeline = ata.status_timeline || []
  const lastStatus = timeline[timeline.length - 1]?.status
  if (lastStatus === 'approved' || lastStatus === 'rejected') {
   return NextResponse.json(
    { error: `ÄTA already ${lastStatus}` },
    { status: 409 }
   )
  }

  const body = await req.json()
  const { comment } = body

  // Uppdatera status_timeline via SQL-funktion
  const { error: timelineError } = await adminSupabase.rpc(
   'update_ata_status_timeline',
   {
    p_rot_application_id: id,
    p_status: 'approved',
    p_user_id: user.id,
    p_comment: comment || null,
   }
  )

  if (timelineError) {
   console.error('Error updating timeline:', timelineError)
   return NextResponse.json(
    { error: 'Failed to update timeline', details: timelineError.message },
    { status: 500 }
   )
  }

  // Hämta uppdaterad ÄTA
  const { data: updatedAta } = await adminSupabase
   .from('rot_applications')
   .select('id, status_timeline')
   .eq('id', id)
   .single()

  // Logga audit event
  try {
   await adminSupabase.rpc('append_audit_event', {
    p_tenant_id: tenantId,
    p_table_name: 'rot_applications',
    p_record_id: id,
    p_action: 'update',
    p_user_id: user.id,
    p_employee_id: employeeData.id,
    p_old_values: { status: lastStatus },
    p_new_values: { status: 'approved' },
    p_changed_fields: ['status_timeline'],
   })
  } catch (auditError) {
   console.error('Error logging audit event:', auditError)
  }

  return NextResponse.json({
   id: updatedAta?.id,
   status: 'approved',
   status_timeline: updatedAta?.status_timeline || [],
  })
 } catch (error: any) {
  console.error('Error in POST /api/ata/[id]/approve:', error)
  return NextResponse.json(
   { error: 'Internal server error', details: error.message },
   { status: 500 }
  )
 }
}

