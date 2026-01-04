import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getTenantId } from '@/lib/serverTenant'

/**
 * POST /api/ata/[id]/link-invoice
 * Kopplar ÄTA till faktura (om invoice_mode = "add_to_main")
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
  const body = await req.json()
  const { invoice_id, invoice_mode } = body

  if (!invoice_id) {
   return NextResponse.json(
    { error: 'invoice_id is required' },
    { status: 400 }
   )
  }

  if (invoice_mode && !['separate', 'add_to_main'].includes(invoice_mode)) {
   return NextResponse.json(
    { error: 'invoice_mode must be "separate" or "add_to_main"' },
    { status: 400 }
   )
  }

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

  // Verifiera att fakturan finns och tillhör tenant
  const { data: invoice } = await adminSupabase
   .from('invoices')
   .select('id, tenant_id, status')
   .eq('id', invoice_id)
   .eq('tenant_id', tenantId)
   .single()

  if (!invoice) {
   return NextResponse.json(
    { error: 'Invoice not found' },
    { status: 404 }
   )
  }

  // Kontrollera att fakturan inte är betald
  if (invoice.status === 'paid') {
   return NextResponse.json(
    { error: 'Cannot link ÄTA to paid invoice' },
    { status: 409 }
   )
  }

  // Kontrollera om ÄTA redan är länkad till annan faktura
  if (ata.parent_invoice_id && ata.parent_invoice_id !== invoice_id) {
   return NextResponse.json(
    { error: 'ÄTA already linked to another invoice' },
    { status: 409 }
   )
  }

  // Uppdatera ÄTA
  const updateData: any = {
   parent_invoice_id: invoice_id,
  }

  if (invoice_mode) {
   updateData.invoice_mode = invoice_mode
  }

  const { data: updatedAta, error: updateError } = await adminSupabase
   .from('rot_applications')
   .update(updateData)
   .eq('id', id)
   .select()
   .single()

  if (updateError) {
   console.error('Error updating ÄTA:', updateError)
   return NextResponse.json(
    { error: 'Failed to link invoice', details: updateError.message },
    { status: 500 }
   )
  }

  // Om invoice_mode är "add_to_main", lägg till ÄTA-belopp i fakturan
  if (updateData.invoice_mode === 'add_to_main' || ata.invoice_mode === 'add_to_main') {
   // Hämta ÄTA-items för att beräkna totalt belopp
   const { data: ataItems } = await adminSupabase
    .from('ata_items')
    .select('total_price')
    .eq('rot_application_id', id)

   const ataTotal = ataItems?.reduce((sum, item) => sum + (item.total_price || 0), 0) || 0

   // Hämta befintliga invoice_lines
   const { data: existingLines } = await adminSupabase
    .from('invoice_lines')
    .select('amount_sek')
    .eq('invoice_id', invoice_id)

   const linesTotal = existingLines?.reduce((sum, line) => sum + (line.amount_sek || 0), 0) || 0

   // Skapa invoice_line för ÄTA
   await adminSupabase
    .from('invoice_lines')
    .insert({
     tenant_id: tenantId,
     invoice_id: invoice_id,
     description: `ÄTA: ${ata.description}`,
     quantity: 1,
     rate_sek: ataTotal,
     amount_sek: ataTotal,
    })

   // Uppdatera invoice total
   await adminSupabase
    .from('invoices')
    .update({ amount: linesTotal + ataTotal })
    .eq('id', invoice_id)
  }

  // Logga audit event
  try {
   await adminSupabase.rpc('append_audit_event', {
    p_tenant_id: tenantId,
    p_table_name: 'rot_applications',
    p_record_id: id,
    p_action: 'update',
    p_user_id: user.id,
    p_employee_id: employeeData.id,
    p_old_values: { parent_invoice_id: ata.parent_invoice_id },
    p_new_values: { parent_invoice_id: invoice_id },
    p_changed_fields: ['parent_invoice_id'],
   })
  } catch (auditError) {
   console.error('Error logging audit event:', auditError)
  }

  return NextResponse.json({
   id: updatedAta?.id,
   parent_invoice_id: updatedAta?.parent_invoice_id,
   invoice_mode: updatedAta?.invoice_mode,
   message: 'ÄTA linked to invoice successfully',
  })
 } catch (error: any) {
  console.error('Error in POST /api/ata/[id]/link-invoice:', error)
  return NextResponse.json(
   { error: 'Internal server error', details: error.message },
   { status: 500 }
  )
 }
}

