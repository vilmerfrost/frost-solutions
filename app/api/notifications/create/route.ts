import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getTenantId } from '@/lib/serverTenant'

/**
 * API route för att skapa notiser (endast admins)
 * Stödjer både allmänna (recipient_id = null) och privata (recipient_id eller recipient_employee_id satt)
 */
export async function POST(req: Request) {
 try {
  const supabase = createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
   return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const body = await req.json()
  const { 
   title, 
   message, 
   type = 'info', 
   link, 
   recipientId, 
   recipientEmployeeId,
   expiresAt 
  } = body

  if (!title || !message) {
   return NextResponse.json(
    { error: 'Title and message are required' },
    { status: 400 }
   )
  }

  // Validate type
  if (!['info', 'success', 'warning', 'error'].includes(type)) {
   return NextResponse.json(
    { error: 'Invalid notification type' },
    { status: 400 }
   )
  }

  // Get tenant ID
  const tenantId = await getTenantId()
  if (!tenantId) {
   return NextResponse.json(
    { error: 'No tenant found' },
    { status: 403 }
   )
  }

  // Use service role to check admin status
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
   return NextResponse.json(
    { error: 'Service role key not configured' },
    { status: 500 }
   )
  }

  const adminSupabase = createAdminClient(supabaseUrl, serviceKey)

  // Check if user is admin
  const { data: employeeData } = await adminSupabase
   .from('employees')
   .select('id, role, tenant_id')
   .eq('auth_user_id', user.id)
   .eq('tenant_id', tenantId)
   .limit(1)

  if (!employeeData || employeeData.length === 0) {
   return NextResponse.json(
    { error: 'You do not have access to this tenant' },
    { status: 403 }
   )
  }

  const isAdmin = employeeData[0]?.role === 'admin' || employeeData[0]?.role === 'Admin' || employeeData[0]?.role === 'ADMIN'
  if (!isAdmin) {
   return NextResponse.json(
    { error: 'Admin access required to create notifications' },
    { status: 403 }
   )
  }

  // If recipientEmployeeId is provided, get the auth_user_id from employees table
  let finalRecipientId: string | null = recipientId || null
  let finalRecipientEmployeeId: string | null = recipientEmployeeId || null

  if (recipientEmployeeId && !recipientId) {
   const { data: recipientEmployee } = await adminSupabase
    .from('employees')
    .select('auth_user_id')
    .eq('id', recipientEmployeeId)
    .eq('tenant_id', tenantId)
    .maybeSingle()

   if (recipientEmployee?.auth_user_id) {
    finalRecipientId = recipientEmployee.auth_user_id
   } else {
    return NextResponse.json(
     { error: 'Recipient employee not found' },
     { status: 404 }
    )
   }
  }

  // Build notification payload
  const notificationPayload: any = {
   tenant_id: tenantId,
   created_by: user.id,
   type,
   title: title.trim(),
   message: message.trim(),
   read: false,
  }

  // Set recipient (null = general notification to all users)
  if (finalRecipientId) {
   notificationPayload.recipient_id = finalRecipientId
  }
  if (finalRecipientEmployeeId) {
   notificationPayload.recipient_employee_id = finalRecipientEmployeeId
  }
  if (link) {
   notificationPayload.link = link.trim()
  }
  if (expiresAt) {
   notificationPayload.expires_at = expiresAt
  }

  // Create notification
  const { data: notification, error: insertError } = await adminSupabase
   .from('notifications')
   .insert([notificationPayload])
   .select('id, title, message, type, created_at')
   .single()

  if (insertError) {
   console.error('Error creating notification:', insertError)
   return NextResponse.json(
    { error: insertError.message || 'Failed to create notification' },
    { status: 500 }
   )
  }

  return NextResponse.json({
   success: true,
   notification,
   message: finalRecipientId 
    ? 'Privat notis skapad!' 
    : 'Allmän notis skapad och skickad till alla användare!'
  })
 } catch (err: any) {
  console.error('Error in notifications/create API:', err)
  return NextResponse.json(
   { error: err.message || 'Internal server error' },
   { status: 500 }
  )
 }
}

