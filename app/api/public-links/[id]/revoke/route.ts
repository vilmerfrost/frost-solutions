import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getTenantId } from '@/lib/serverTenant'

/**
 * POST /api/public-links/[id]/revoke
 * Återkallar publik länk
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

  const adminSupabase = createAdminClient(
   process.env.NEXT_PUBLIC_SUPABASE_URL!,
   process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Kontrollera admin-access
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

  // Hämta link
  const { data: publicLink, error: linkError } = await adminSupabase
   .from('public_links')
   .select('*')
   .eq('id', id)
   .eq('tenant_id', tenantId)
   .single()

  if (linkError || !publicLink) {
   return NextResponse.json(
    { error: 'Link not found' },
    { status: 404 }
   )
  }

  // Inaktivera länk
  const { data: updatedLink, error: updateError } = await adminSupabase
   .from('public_links')
   .update({
    active: false,
   })
   .eq('id', id)
   .select()
   .single()

  if (updateError) {
   console.error('Error revoking link:', updateError)
   return NextResponse.json(
    { error: 'Failed to revoke link', details: updateError.message },
    { status: 500 }
   )
  }

  // Logga audit event
  try {
   await adminSupabase.rpc('append_audit_event', {
    p_tenant_id: tenantId,
    p_table_name: 'public_links',
    p_record_id: id,
    p_action: 'update',
    p_user_id: user.id,
    p_employee_id: employeeData.id,
    p_old_values: { active: true },
    p_new_values: { active: false },
    p_changed_fields: ['active'],
   })
  } catch (auditError) {
   console.error('Error logging audit event:', auditError)
  }

  return NextResponse.json({
   id: updatedLink.id,
   active: updatedLink.active,
   revoked_at: updatedLink.updated_at,
  })
 } catch (error: any) {
  console.error('Error in POST /api/public-links/[id]/revoke:', error)
  return NextResponse.json(
   { error: 'Internal server error', details: error.message },
   { status: 500 }
  )
 }
}

