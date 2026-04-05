// app/api/supplier-invoices/route.ts
import { NextRequest } from 'next/server'
import { listQuerySchema, createInvoiceSchema } from './_schemas'
import { resolveAuthAdmin, apiSuccess, apiError, handleRouteError } from '@/lib/api'
import { createAdminClient } from '@/utils/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const parsed = listQuerySchema.safeParse(
      Object.fromEntries(req.nextUrl.searchParams.entries())
    )

    if (!parsed.success) {
      return apiError(parsed.error.message, 400)
    }

    const { status, projectId, supplierId, search, from, to, page, limit } = parsed.data

    // Use RPC function for listing (handles app schema access)
    const offset = (page - 1) * limit
    const { data: rpcResult, error: rpcError } = await auth.admin.rpc('list_supplier_invoices', {
      p_tenant_id: auth.tenantId,
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

    // Filter by date range if provided (RPC doesn't handle this)
    let filteredData = (rpcResult as Record<string, unknown>)?.data as Record<string, unknown>[] || []
    if (from || to) {
      filteredData = filteredData.filter((invoice) => {
        const invoiceDate = invoice.invoice_date as string | undefined
        if (!invoiceDate) return false
        if (from && invoiceDate < from) return false
        if (to && invoiceDate > to) return false
        return true
      })
    }

    return apiSuccess({
      data: filteredData,
      meta: {
        page,
        limit,
        count: (rpcResult as Record<string, unknown>)?.total || filteredData.length
      }
    })
  } catch (e) {
    return handleRouteError(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

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
        return apiError('file saknas', 400)
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
        auth.tenantId,
        {
          createdBy: requestUserId ?? undefined,
          mimeType,
          useVision: !mimeType.startsWith('image/')
        }
      )

      return apiSuccess({ invoiceId, ocr: { confidence: ocrResult.confidence } }, 201)
    }

    // Manual JSON
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return apiError('Invalid JSON body', 400)
    }

    const parsed = createInvoiceSchema.safeParse(body)
    if (!parsed.success) {
      return apiError(parsed.error.message, 400)
    }

    const payload = parsed.data

    // Create invoice using RPC function
    const { data: invoiceData, error: rpcError } = await auth.admin.rpc('insert_supplier_invoice', {
      p_tenant_id: auth.tenantId,
      p_supplier_id: payload.supplier_id,
      p_project_id: payload.project_id ?? null,
      p_file_path: null,
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

    const invoiceId = (invoiceData as Record<string, unknown>)?.id
    if (!invoiceId) {
      throw new Error('Invoice created but no ID returned')
    }

    // Add items via direct insert
    if (payload.items && payload.items.length > 0) {
      try {
        const appClient = createAdminClient(undefined, 'app')
        const rows = payload.items.map((i, idx) => ({
          tenant_id: auth.tenantId,
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
          console.warn('Could not insert items directly, schema may not be exposed:', iErr)
        }
      } catch (schemaErr) {
        console.warn('Could not access app schema for items, skipping:', schemaErr)
      }
    }

    return apiSuccess({ id: invoiceId }, 201)
  } catch (e) {
    return handleRouteError(e)
  }
}
