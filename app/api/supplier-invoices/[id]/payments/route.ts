// app/api/supplier-invoices/[id]/payments/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { paymentSchema } from '../../_schemas'
import { getTenantId } from '@/lib/serverTenant'
import { createAdminClient } from '@/utils/supabase/admin'
import { extractErrorMessage } from '@/lib/errorUtils'

export const runtime = 'nodejs'

export async function POST(
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

    const parsed = paymentSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.message },
        { status: 400 }
      )
    }

    // Get user ID
    const { data: { user } } = await admin.auth.getUser()

    const { error } = await admin.from('supplier_invoice_payments').insert({
      tenant_id: tenantId,
      supplier_invoice_id: id,
      amount: parsed.data.amount,
      payment_date: parsed.data.paymentDate,
      method: parsed.data.method,
      notes: parsed.data.notes ?? null
    })

    if (error) throw error

    await admin.from('supplier_invoice_history').insert({
      tenant_id: tenantId,
      supplier_invoice_id: id,
      action: 'paid',
      data: parsed.data,
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

