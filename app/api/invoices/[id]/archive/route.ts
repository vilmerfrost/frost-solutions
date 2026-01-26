import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

/**
 * API route för att arkivera/återställa en faktura
 * Använder service role för säkerhet
 */
export async function PATCH(
 req: Request,
 { params }: { params: Promise<{ id: string }> }
) {
 try {
  const { id: invoiceId } = await params
  const { action } = await req.json() // 'archive' eller 'restore'

  if (!['archive', 'restore'].includes(action)) {
   return NextResponse.json(
    { error: 'Invalid action. Use "archive" or "restore"' },
    { status: 400 }
   )
  }

  // Check admin
  const supabase = createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
   return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Use service role to check admin status directly
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
   return NextResponse.json(
    { error: 'Service role key not configured' },
    { status: 500 }
   )
  }

  const adminSupabase = createAdminClient(supabaseUrl, serviceKey)

  // Check admin status directly via employee record
  const { data: employeeData } = await adminSupabase
   .from('employees')
   .select('id, role, tenant_id')
   .eq('auth_user_id', user.id)
   .limit(10)

  let isAdmin = false
  let adminEmployee = null
  
  if (employeeData && Array.isArray(employeeData)) {
   adminEmployee = employeeData.find((e: any) => 
    e.role === 'admin' || e.role === 'Admin' || e.role === 'ADMIN'
   )
   if (adminEmployee) {
    isAdmin = true
   }
  }
  
  if (!isAdmin && user.email) {
   const { data: emailEmployeeList } = await adminSupabase
    .from('employees')
    .select('id, role, tenant_id')
    .eq('email', user.email)
    .limit(10)
   
   if (emailEmployeeList && Array.isArray(emailEmployeeList)) {
    adminEmployee = emailEmployeeList.find((e: any) => 
     e.role === 'admin' || e.role === 'Admin' || e.role === 'ADMIN'
    )
    if (adminEmployee) {
     isAdmin = true
    }
   }
  }

  if (!isAdmin) {
   return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  // Get tenant from employee
  const tenantId = adminEmployee?.tenant_id || null
  if (!tenantId) {
   return NextResponse.json({ error: 'No tenant found' }, { status: 400 })
  }

  // Try to archive - use archived boolean first
  // Note: invoices table only allows status values: 'draft', 'sent', 'paid'
  // So we use the archived boolean column for soft-delete instead
  let updateResult
  
  // Try with archived column first
  updateResult = await adminSupabase
   .from('invoices')
   .update({ archived: action === 'archive' })
   .eq('id', invoiceId)
   .eq('tenant_id', tenantId)
   .select()
   .single()

  // If archived column doesn't exist, keep status as-is and add a note
  // We cannot use status='archived' due to check constraint
  if (updateResult.error && (updateResult.error.code === '42703' || updateResult.error.message?.includes('archived'))) {
   // The archived column doesn't exist, so we cannot archive
   // Return a helpful error instead of breaking the constraint
   console.error('Archive column not found and status constraint prevents archiving')
   return NextResponse.json(
    { error: 'Arkivering stöds inte för denna fakturatyp. Markera fakturan som betald istället.' },
    { status: 400 }
   )
  }

  if (updateResult.error) {
   console.error('Error updating invoice:', updateResult.error)
   return NextResponse.json(
    { error: updateResult.error.message || 'Failed to update invoice' },
    { status: 500 }
   )
  }

  return NextResponse.json({
   success: true,
   invoice: updateResult.data,
   message: action === 'archive' ? 'Faktura arkiverad' : 'Faktura återställd',
  })
 } catch (err: any) {
  console.error('Error in invoices/[id]/archive API:', err)
  return NextResponse.json(
   { error: err.message || 'Internal server error' },
   { status: 500 }
  )
 }
}

