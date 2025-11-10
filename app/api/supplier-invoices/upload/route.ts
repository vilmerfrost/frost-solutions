// app/api/supplier-invoices/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getTenantId } from '@/lib/serverTenant'
import { processScannedInvoice } from '@/lib/ocr/supplierInvoices'
import { extractErrorMessage } from '@/lib/errorUtils'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const correlationId = crypto.randomUUID()
  
  try {
    console.log(`[Upload API] ${correlationId} - Starting upload request`)
    
    const tenantId = await getTenantId()
    if (!tenantId) {
      console.error(`[Upload API] ${correlationId} - No tenant ID found`)
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    console.log(`[Upload API] ${correlationId} - Tenant ID: ${tenantId}`)

    const requestUserId =
      req.headers.get('x-user-id') ??
      req.headers.get('x-supabase-user-id') ??
      null

    const form = await req.formData()

    const supplierId = String(form.get('supplier_id'))
    const projectId = form.get('project_id') ? String(form.get('project_id')) : null
    const file = form.get('file')

    if (!(file instanceof File)) {
      console.error(`[Upload API] ${correlationId} - No file provided`)
      return NextResponse.json({ success: false, error: 'file saknas' }, { status: 400 })
    }

    console.log(`[Upload API] ${correlationId} - File: ${file.name}, Size: ${file.size}, Type: ${file.type}`)
    console.log(`[Upload API] ${correlationId} - Supplier ID: ${supplierId}, Project ID: ${projectId || 'none'}`)

    const buf = Buffer.from(await file.arrayBuffer())

    const mimeType = (file as File).type || 'application/octet-stream'

    console.log(`[Upload API] ${correlationId} - Starting OCR processing...`)
    
    const { invoiceId, ocrResult } = await processScannedInvoice(
      file.name,
      buf,
      supplierId,
      projectId,
      tenantId,
      {
        createdBy: requestUserId ?? undefined,
        mimeType,
        useVision: !mimeType.startsWith('image/')
      }
    )

    console.log(`[Upload API] ${correlationId} - ✅ Success! Invoice ID: ${invoiceId}, OCR Confidence: ${ocrResult.confidence}`)

    return NextResponse.json(
      {
        success: true,
        data: { invoiceId, ocr: { confidence: ocrResult.confidence } }
      },
      { status: 201 }
    )
  } catch (e: any) {
    const errorMessage = extractErrorMessage(e)
    console.error(`[Upload API] ${correlationId} - ❌ Error:`, errorMessage)
    console.error(`[Upload API] ${correlationId} - Stack:`, e.stack)
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        correlationId,
        // Include helpful error details in development
        ...(process.env.NODE_ENV === 'development' && {
          details: e.message,
          hint: e.message?.includes('does not exist') 
            ? 'RPC function may not be created. Run supabase/rpc/supplier_invoices.sql in Supabase SQL Editor.'
            : undefined
        })
      },
      { status: 500 }
    )
  }
}

