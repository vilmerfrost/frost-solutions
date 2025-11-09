// app/api/supplier-invoices/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getTenantId } from '@/lib/serverTenant'
import { processScannedInvoice } from '@/lib/ocr/supplierInvoices'
import { extractErrorMessage } from '@/lib/errorUtils'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const tenantId = await getTenantId()
    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const form = await req.formData()

    const supplierId = String(form.get('supplier_id'))
    const projectId = form.get('project_id') ? String(form.get('project_id')) : null
    const file = form.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: 'file saknas' }, { status: 400 })
    }

    const buf = Buffer.from(await file.arrayBuffer())

    const { invoiceId, ocrResult } = await processScannedInvoice(
      file.name,
      buf,
      supplierId,
      projectId,
      tenantId
    )

    return NextResponse.json(
      {
        success: true,
        data: { invoiceId, ocr: { confidence: ocrResult.confidence } }
      },
      { status: 201 }
    )
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: extractErrorMessage(e) },
      { status: 500 }
    )
  }
}

