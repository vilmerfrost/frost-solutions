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

    const admin = createAdminClient()

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

    let q = admin
      .from('supplier_invoices')
      .select(
        '*, supplier:suppliers(name), project:projects(id, name), payments:supplier_invoice_payments(*), items:supplier_invoice_items(*)',
        { count: 'exact' }
      )
      .eq('tenant_id', tenantId)
      .order('invoice_date', { ascending: false })

    if (status) q = q.eq('status', status)
    if (projectId) q = q.eq('project_id', projectId)
    if (supplierId) q = q.eq('supplier_id', supplierId)
    if (from) q = q.gte('invoice_date', from)
    if (to) q = q.lte('invoice_date', to)
    if (search) {
      q = q.or(`invoice_number.ilike.%${search}%,notes.ilike.%${search}%`)
    }

    const fromIdx = (page - 1) * limit
    const toIdx = fromIdx + limit - 1
    q = q.range(fromIdx, toIdx)

    const { data, error, count } = await q

    if (error) throw error

    return NextResponse.json({
      success: true,
      data,
      meta: { page, limit, count: count || 0 }
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

    const admin = createAdminClient()

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

      const { processScannedInvoice } = await import('@/lib/ocr/supplierInvoices')
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
    }

    // Manual JSON
    const body = await req.json()
    const parsed = createInvoiceSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.message },
        { status: 400 }
      )
    }

    const payload = parsed.data

    // Get user ID
    const { data: { user } } = await admin.auth.getUser()

    const { data: created, error } = await admin
      .from('supplier_invoices')
      .insert({
        tenant_id: tenantId,
        supplier_id: payload.supplier_id,
        project_id: payload.project_id ?? null,
        invoice_number: payload.invoice_number,
        invoice_date: payload.invoice_date,
        due_date: payload.due_date ?? null,
        currency: payload.currency ?? 'SEK',
        exchange_rate: payload.exchange_rate ?? 1,
        notes: payload.notes ?? null,
        status: 'pending_approval',
        created_by: user?.id || null
      })
      .select('id')
      .single()

    if (error) throw error

    // Add items
    if (payload.items && payload.items.length > 0) {
      const rows = payload.items.map((i, idx) => ({
        tenant_id: tenantId,
        supplier_invoice_id: created.id,
        item_type: i.item_type,
        name: i.name,
        description: i.description ?? null,
        quantity: i.quantity,
        unit: i.unit ?? 'st',
        unit_price: i.unit_price,
        vat_rate: i.vat_rate ?? 25,
        order_index: i.order_index ?? idx + 1
      }))

      const { error: iErr } = await admin.from('supplier_invoice_items').insert(rows)
      if (iErr) throw iErr
    }

    // Log to history
    await admin.from('supplier_invoice_history').insert({
      tenant_id: tenantId,
      supplier_invoice_id: created.id,
      action: 'created',
      data: payload,
      changed_by: user?.id || null
    })

    return NextResponse.json({ success: true, data: { id: created.id } }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: extractErrorMessage(e) },
      { status: 500 }
    )
  }
}

