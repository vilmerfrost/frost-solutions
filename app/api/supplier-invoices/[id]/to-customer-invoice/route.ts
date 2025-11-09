// app/api/supplier-invoices/[id]/to-customer-invoice/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getTenantId } from '@/lib/serverTenant'
import { createCustomerInvoiceFromSupplierInvoice } from '@/lib/markup/createCustomerInvoiceFromSupplierInvoice'
import { extractErrorMessage } from '@/lib/errorUtils'

export const runtime = 'nodejs'

export async function POST(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await getTenantId()
    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const result = await createCustomerInvoiceFromSupplierInvoice(id, tenantId)

    return NextResponse.json({ success: true, data: result })
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: extractErrorMessage(e) },
      { status: 500 }
    )
  }
}

