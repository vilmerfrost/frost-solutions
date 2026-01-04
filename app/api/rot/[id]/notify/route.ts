import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getTenantId } from '@/lib/serverTenant'
import { sendRotNotification } from '@/lib/notifications-server'

/**
 * Skicka push-notifikation vid statusändring
 * Anropas automatiskt när status uppdateras
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

  const { id } = await params
  const tenantId = await getTenantId()

  if (!tenantId) {
   return NextResponse.json({ error: 'No tenant found' }, { status: 400 })
  }

  const body = await req.json()
  const { type, message } = body // 'approved' | 'rejected' | 'status_update'

  // Hämta ansökan
  const { data: application } = await supabase
   .from('rot_applications')
   .select('status, case_number')
   .eq('id', id)
   .eq('tenant_id', tenantId)
   .single()

  if (!application) {
   return NextResponse.json({ error: 'Application not found' }, { status: 404 })
  }

  // Hitta alla användare i tenant som ska få notifikation (admin + skapare)
  const { data: employees } = await supabase
   .from('employees')
   .select('auth_user_id, role')
   .eq('tenant_id', tenantId)
   .or('role.eq.admin,role.eq.Admin,auth_user_id.eq.' + user.id)

  if (employees && employees.length > 0) {
   // Skicka notifikation till alla relevanta användare
   for (const emp of employees) {
    if (emp.auth_user_id) {
     await sendRotNotification(
      emp.auth_user_id,
      tenantId,
      type,
      id,
      message || `ROT-ansökan ${application.case_number || id} har uppdaterats till ${application.status}`,
      user.id // Pass the current user as creator
     )
    }
   }
  }

  return NextResponse.json({ success: true, notified: employees?.length || 0 })
 } catch (err: any) {
  console.error('Error sending notification:', err)
  return NextResponse.json(
   { error: err.message || 'Internal server error' },
   { status: 500 }
  )
 }
}

