import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getTenantId } from '@/lib/serverTenant'

/**
 * API route för att hämta notiser för den inloggade användaren
 * Hämtar både allmänna notiser (recipient_id = null) och privata notiser (recipient_id = user.id)
 */
export async function GET(req: Request) {
 try {
  const supabase = createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
   return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Get tenant ID
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

  // Fetch notifications: general (recipient_id IS NULL) or private (recipient_id = user.id or recipient_employee_id = employee.id)
  // Also filter out expired notifications
  let notificationsQuery = supabase
   .from('notifications')
   .select('id, type, title, message, link, read, created_at, created_by, recipient_id, recipient_employee_id')
   .eq('tenant_id', tenantId)
   .or(`recipient_id.is.null,recipient_id.eq.${user.id}${employeeId ? `,recipient_employee_id.eq.${employeeId}` : ''}`)
   .order('created_at', { ascending: false })
   .limit(50)

  // Filter out expired notifications if expires_at exists
  const { data: allNotifications, error: fetchError } = await notificationsQuery

  if (fetchError) {
   console.error('Error fetching notifications:', fetchError)
   return NextResponse.json(
    { error: fetchError.message || 'Failed to fetch notifications' },
    { status: 500 }
   )
  }

  // Filter out expired notifications on client side (since we can't easily do it in the query)
  const now = new Date()
  const validNotifications = (allNotifications || []).filter((notif: any) => {
   if (!notif.expires_at) return true
   return new Date(notif.expires_at) > now
  })

  return NextResponse.json({
   notifications: validNotifications,
   count: validNotifications.length
  })
 } catch (err: any) {
  console.error('Error in notifications/list API:', err)
  return NextResponse.json(
   { error: err.message || 'Internal server error' },
   { status: 500 }
  )
 }
}

