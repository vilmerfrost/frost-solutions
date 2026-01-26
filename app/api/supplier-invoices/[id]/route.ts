// app/api/supplier-invoices/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { patchInvoiceSchema } from '../_schemas'
import { getTenantId } from '@/lib/serverTenant'
import { createAdminClient } from '@/utils/supabase/admin'
import { extractErrorMessage } from '@/lib/errorUtils'
import { applyMarkupToInvoice } from '@/lib/markup/applyInvoiceMarkup'

export const runtime = 'nodejs'

export async function GET(
 req: NextRequest,
 { params }: { params: Promise<{ id: string }> }
) {
 try {
  const tenantId = await getTenantId()
  if (!tenantId) {
   return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const admin = createAdminClient()

  // Try with full relations first
  let { data, error } = await admin
   .from('supplier_invoices')
   .select(
    '*, supplier:suppliers(*), project:projects(id, name), payments:supplier_invoice_payments(*), items:supplier_invoice_items(*)'
   )
   .eq('tenant_id', tenantId)
   .eq('id', id)
   .maybeSingle()

  // If relationship error, try without supplier join
  if (error && (error.message?.includes('relationship') || error.code === 'PGRST200')) {
   console.warn('⚠️ Supplier relationship not found, fetching without join')
   const fallback = await admin
    .from('supplier_invoices')
    .select(
     '*, project:projects(id, name), payments:supplier_invoice_payments(*), items:supplier_invoice_items(*)'
    )
    .eq('tenant_id', tenantId)
    .eq('id', id)
    .maybeSingle()

   if (!fallback.error) {
    data = fallback.data
    error = null
   } else {
    error = fallback.error
   }
  }

  // If still failing, try minimal query
  if (error) {
   console.warn('⚠️ Extended query failed, trying minimal query')
   const minimal = await admin
    .from('supplier_invoices')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('id', id)
    .maybeSingle()

   if (!minimal.error && minimal.data) {
    data = minimal.data
    error = null
   } else {
    throw minimal.error || error
   }
  }

  if (!data) {
   return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true, data })
 } catch (e: any) {
  return NextResponse.json(
   { success: false, error: extractErrorMessage(e) },
   { status: 500 }
  )
 }
}

export async function PATCH(
 req: NextRequest,
 { params }: { params: Promise<{ id: string }> }
) {
 try {
  const tenantId = await getTenantId()
  if (!tenantId) {
   return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const { id } = await params
  const body = await req.json()

  const parsed = patchInvoiceSchema.safeParse(body)

  if (!parsed.success) {
   return NextResponse.json(
    { success: false, error: parsed.error.message },
    { status: 400 }
   )
  }

  // Fetch current invoice
  const { data: current } = await admin
   .from('supplier_invoices')
   .select('id, project_id, status')
   .eq('tenant_id', tenantId)
   .eq('id', id)
   .maybeSingle()

  if (!current) {
   return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
  }

  const updates: Record<string, any> = { ...parsed.data }

  if (updates.markup_override != null) {
   updates.markup_total = updates.markup_override
   delete updates.markup_override
  }

  const { data, error } = await admin
   .from('supplier_invoices')
   .update(updates)
   .eq('tenant_id', tenantId)
   .eq('id', id)
   .select('id, project_id, status')
   .single()

  if (error) throw error

  // If status changed to approved → calculate/update markup
  if (parsed.data.status === 'approved') {
   await applyMarkupToInvoice(id, data.project_id, tenantId)
  }

  // Get user ID
  const { data: { user } } = await admin.auth.getUser()

  await admin.from('supplier_invoice_history').insert({
   tenant_id: tenantId,
   supplier_invoice_id: id,
   action: 'updated',
   data: parsed.data,
   changed_by: user?.id || null
  })

  return NextResponse.json({ success: true, data })
 } catch (e: any) {
  return NextResponse.json(
   { success: false, error: extractErrorMessage(e) },
   { status: 500 }
  )
 }
}

export async function DELETE(
 _: NextRequest,
 { params }: { params: Promise<{ id: string }> }
) {
 try {
  const tenantId = await getTenantId()
  if (!tenantId) {
   return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const { id } = await params

  // Soft archive
  const { error } = await admin
   .from('supplier_invoices')
   .update({ status: 'archived' })
   .eq('tenant_id', tenantId)
   .eq('id', id)

  if (error) throw error

  // Get user ID
  const { data: { user } } = await admin.auth.getUser()

  await admin.from('supplier_invoice_history').insert({
   tenant_id: tenantId,
   supplier_invoice_id: id,
   action: 'archived',
   changed_by: user?.id || null
  })

  return NextResponse.json({ success: true })
 } catch (e: any) {
  return NextResponse.json(
   { success: false, error: extractErrorMessage(e) },
   { status: 500 }
  )
 }
}

