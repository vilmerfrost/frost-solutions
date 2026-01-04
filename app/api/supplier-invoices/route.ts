// app/api/supplier-invoices/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { listQuerySchema, createInvoiceSchema } from './_schemas'
import { createAdminClient } from '@/utils/supabase/admin'
import { getTenantId } from '@/lib/serverTenant'
import { extractErrorMessage } from '@/lib/errorUtils'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
 try {
  const tenantId = await getTenantId()
  if (!tenantId) {
   return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient() // Use 'public' schema for RPC calls

  const parsed = listQuerySchema.safeParse(
   Object.fromEntries(new URL(req.url).searchParams.entries())
  )

  if (!parsed.success) {
   return NextResponse.json(
    { success: false, error: parsed.error.message },
    { status: 400 }
   )
  }

  const { status, projectId, supplierId, search, from, to, page, limit } = parsed.data

  // Use RPC function for listing (handles app schema access)
  const offset = (page - 1) * limit
  const { data: rpcResult, error: rpcError } = await admin.rpc('list_supplier_invoices', {
   p_tenant_id: tenantId,
   p_limit: limit,
   p_offset: offset,
   p_status: status || null,
   p_project_id: projectId || null,
   p_supplier_id: supplierId || null,
   p_search: search || null
  })

  if (rpcError) {
   throw rpcError
  }

  // Filter by date range if provided (RPC doesn't handle this, so we filter client-side)
  let filteredData = rpcResult?.data || []
  if (from || to) {
   filteredData = filteredData.filter((invoice: any) => {
    const invoiceDate = invoice.invoice_date
    if (!invoiceDate) return false
    if (from && invoiceDate < from) return false
    if (to && invoiceDate > to) return false
    return true
   })
  }

  return NextResponse.json({
   success: true,
   data: filteredData,
   meta: { 
    page, 
    limit, 
    count: rpcResult?.total || filteredData.length 
   }
  })
 } catch (e: any) {
  return NextResponse.json(
   { success: false, error: extractErrorMessage(e) },
   { status: 500 }
  )
 }
}

export async function POST(req: NextRequest) {
 try {
  const tenantId = await getTenantId()
  if (!tenantId) {
   return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient() // Use 'public' schema for RPC calls
  const requestUserId =
   req.headers.get('x-user-id') ??
   req.headers.get('x-supabase-user-id') ??
   null

  const contentType = req.headers.get('content-type') || ''

  // OCR multipart
  if (contentType.includes('multipart/form-data')) {
   const formData = await req.formData()
   const supplierId = String(formData.get('supplier_id'))
   const projectId = formData.get('project_id') ? String(formData.get('project_id')) : null
   const file = formData.get('file')

   if (!(file instanceof File)) {
    return NextResponse.json({ success: false, error: 'file saknas' }, { status: 400 })
   }

   const arrayBuf = await file.arrayBuffer()
   const buf = Buffer.from(arrayBuf)
   const mimeType = file.type || 'application/octet-stream'

   const { processScannedInvoice } = await import('@/lib/ocr/supplierInvoices')
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

   return NextResponse.json(
    {
     success: true,
     data: { invoiceId, ocr: { confidence: ocrResult.confidence } }
    },
    { status: 201 }
   )
  }

  // Manual JSON - Use RPC function for creating invoice
  const body = await req.json()
  const parsed = createInvoiceSchema.safeParse(body)

  if (!parsed.success) {
   return NextResponse.json(
    { success: false, error: parsed.error.message },
    { status: 400 }
   )
  }

  const payload = parsed.data

  // Create invoice using RPC function (handles invoice + history in transaction)
  const { data: invoiceData, error: rpcError } = await admin.rpc('insert_supplier_invoice', {
   p_tenant_id: tenantId,
   p_supplier_id: payload.supplier_id,
   p_project_id: payload.project_id ?? null,
   p_file_path: null, // Manual creation, no file
   p_file_size: 0,
   p_mime_type: null,
   p_original_filename: null,
   p_invoice_number: payload.invoice_number,
   p_invoice_date: payload.invoice_date,
   p_status: 'pending_approval',
   p_ocr_confidence: null,
   p_ocr_data: null,
   p_extracted_data: null,
   p_created_by: requestUserId
  })

  if (rpcError) {
   throw rpcError
  }

  const invoiceId = invoiceData?.id
  if (!invoiceId) {
   throw new Error('Invoice created but no ID returned')
  }

  // Add items (still need direct access for items table)
  // TODO: Create RPC function for items if needed
  if (payload.items && payload.items.length > 0) {
   // Try to use app schema client, fallback to RPC if needed
   try {
    const appClient = createAdminClient(undefined, 'app')
    const rows = payload.items.map((i, idx) => ({
     tenant_id: tenantId,
     supplier_invoice_id: invoiceId,
     item_type: i.item_type,
     name: i.name,
     description: i.description ?? null,
     quantity: i.quantity,
     unit: i.unit ?? 'st',
     unit_price: i.unit_price,
     vat_rate: i.vat_rate ?? 25,
     order_index: i.order_index ?? idx + 1
    }))

    const { error: iErr } = await appClient.from('supplier_invoice_items').insert(rows)
    if (iErr) {
     // If schema error, log warning but don't fail
     console.warn('Could not insert items directly, schema may not be exposed:', iErr)
    }
   } catch (schemaErr: any) {
    console.warn('Could not access app schema for items, skipping:', schemaErr.message)
   }
  }

  return NextResponse.json({ success: true, data: { id: invoiceId } }, { status: 201 })
 } catch (e: any) {
  return NextResponse.json(
   { success: false, error: extractErrorMessage(e) },
   { status: 500 }
  )
 }
}

