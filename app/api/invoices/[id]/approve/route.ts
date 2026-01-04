import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getTenantId } from '@/lib/serverTenant'

/**
 * Approve invoice and mark associated time entries as billed
 * This endpoint marks all unbilled time entries for the invoice's project as billed
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

  // Use service role for admin operations
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
   return NextResponse.json(
    { error: 'Service role key not configured' },
    { status: 500 }
   )
  }

  const adminSupabase = createAdminClient(supabaseUrl, serviceKey)

  // Fetch invoice to get project_id
  const { data: invoice, error: invoiceError } = await adminSupabase
   .from('invoices')
   .select('id, project_id, tenant_id')
   .eq('id', id)
   .eq('tenant_id', tenantId)
   .single()

  if (invoiceError || !invoice) {
   return NextResponse.json(
    { error: 'Invoice not found' },
    { status: 404 }
   )
  }

  if (!invoice.project_id) {
   return NextResponse.json(
    { error: 'Invoice is not linked to a project' },
    { status: 400 }
   )
  }

  // Verify user has access to this tenant and check if admin
  const { data: employeeData } = await adminSupabase
   .from('employees')
   .select('id, tenant_id, role')
   .eq('auth_user_id', user.id)
   .eq('tenant_id', tenantId)
   .limit(1)

  if (!employeeData || employeeData.length === 0) {
   return NextResponse.json(
    { error: 'You do not have access to this tenant' },
    { status: 403 }
   )
  }

  // Check if user is admin
  const isAdmin = employeeData[0]?.role === 'admin' || employeeData[0]?.role === 'Admin' || employeeData[0]?.role === 'ADMIN'
  if (!isAdmin) {
   return NextResponse.json(
    { error: 'Admin access required to approve invoices' },
    { status: 403 }
   )
  }

  // Find all unbilled time entries for this project that match the invoice lines
  // We'll match by date/description since we don't have time_entry_id in invoice_lines
  
  // First, get all invoice lines for this invoice
  const { data: invoiceLines, error: linesError } = await adminSupabase
   .from('invoice_lines')
   .select('description, quantity, amount_sek')
   .eq('invoice_id', id)
   .eq('tenant_id', tenantId)

  if (linesError) {
   console.error('Error fetching invoice lines:', linesError)
   // Continue anyway - we can still mark entries by project
  }

  // Mark all unbilled time entries for this project as billed
  const { data: updatedEntries, error: updateError } = await adminSupabase
   .from('time_entries')
   .update({ is_billed: true })
   .eq('project_id', invoice.project_id)
   .eq('is_billed', false)
   .eq('tenant_id', tenantId)
   .select('id')

  if (updateError) {
   console.error('Error marking time entries as billed:', updateError)
   return NextResponse.json(
    { error: 'Failed to mark time entries as billed', details: updateError.message },
    { status: 500 }
   )
  }

  // Update invoice status to 'sent' if it's still 'draft' or similar
  await adminSupabase
   .from('invoices')
   .update({ status: 'sent' })
   .eq('id', id)
   .eq('tenant_id', tenantId)
   .in('status', ['draft', 'pending'])

  return NextResponse.json({
   success: true,
   message: `Marked ${updatedEntries?.length || 0} time entries as billed`,
   entriesMarked: updatedEntries?.length || 0,
  })
 } catch (err: any) {
  console.error('Error in invoices/[id]/approve API:', err)
  return NextResponse.json(
   { error: err.message || 'Internal server error' },
   { status: 500 }
  )
 }
}

