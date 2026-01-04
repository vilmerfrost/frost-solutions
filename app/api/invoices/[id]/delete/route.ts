import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

/**
 * API route för att ta bort en faktura
 * Använder service role för säkerhet
 */
export async function DELETE(
 req: Request,
 { params }: { params: Promise<{ id: string }> }
) {
 try {
  const { id: invoiceId } = await params

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

  // Delete invoice lines first (cascade)
  await adminSupabase
   .from('invoice_lines')
   .delete()
   .eq('invoice_id', invoiceId)
   .eq('tenant_id', tenantId)

  // Delete invoice
  const { error: deleteError } = await adminSupabase
   .from('invoices')
   .delete()
   .eq('id', invoiceId)
   .eq('tenant_id', tenantId)

  if (deleteError) {
   console.error('Error deleting invoice:', deleteError)
   return NextResponse.json(
    { error: deleteError.message || 'Failed to delete invoice' },
    { status: 500 }
   )
  }

  return NextResponse.json({
   success: true,
   message: 'Faktura borttagen',
  })
 } catch (err: any) {
  console.error('Error in invoices/[id]/delete API:', err)
  return NextResponse.json(
   { error: err.message || 'Internal server error' },
   { status: 500 }
  )
 }
}

