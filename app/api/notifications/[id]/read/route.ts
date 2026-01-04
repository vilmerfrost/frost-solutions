import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getTenantId } from '@/lib/serverTenant'

/**
 * API route för att markera en notis som läst
 */
export async function PATCH(
 req: Request,
 { params }: { params: Promise<{ id: string }> }
) {
 try {
  const { id } = await params
  const supabase = createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
   return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const tenantId = await getTenantId()
  if (!tenantId) {
   return NextResponse.json(
    { error: 'No tenant found' },
    { status: 403 }
   )
  }

  // Get user's employee ID
  const { data: employeeData } = await supabase
   .from('employees')
   .select('id')
   .eq('auth_user_id', user.id)
   .eq('tenant_id', tenantId)
   .maybeSingle()

  const employeeId = employeeData?.id || null

  // Verify user has access to this notification
  const { data: notification, error: fetchError } = await supabase
   .from('notifications')
   .select('id, recipient_id, recipient_employee_id, tenant_id')
   .eq('id', id)
   .single()

  if (fetchError || !notification) {
   return NextResponse.json(
    { error: 'Notification not found' },
    { status: 404 }
   )
  }

  // Check if user has access (same tenant, and either general or sent to them)
  if (notification.tenant_id !== tenantId) {
   return NextResponse.json(
    { error: 'Access denied' },
    { status: 403 }
   )
  }

  const hasAccess = 
   notification.recipient_id === null || // General notification
   notification.recipient_id === user.id || // Sent to this user
   (employeeId && notification.recipient_employee_id === employeeId) // Sent to this employee

  if (!hasAccess) {
   return NextResponse.json(
    { error: 'Access denied' },
    { status: 403 }
   )
  }

  // Mark as read
  const { error: updateError } = await supabase
   .from('notifications')
   .update({ read: true })
   .eq('id', id)

  if (updateError) {
   console.error('Error marking notification as read:', updateError)
   return NextResponse.json(
    { error: updateError.message || 'Failed to mark notification as read' },
    { status: 500 }
   )
  }

  return NextResponse.json({ success: true })
 } catch (err: any) {
  console.error('Error in notifications/[id]/read API:', err)
  return NextResponse.json(
   { error: err.message || 'Internal server error' },
   { status: 500 }
  )
 }
}

