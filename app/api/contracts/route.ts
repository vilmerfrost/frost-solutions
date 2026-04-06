// app/api/contracts/route.ts
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuthAdmin, apiSuccess, apiError, handleRouteError } from '@/lib/api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ListSchema = z.object({
  status: z.string().optional(),
  contract_type: z.enum(['client', 'subcontractor']).optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
})

const CreateSchema = z.object({
  contract_type: z.enum(['client', 'subcontractor']),
  template_id: z.string().optional().nullable(),
  title: z.string().min(1, 'Titel kravs'),
  description: z.string().optional().nullable(),
  sections: z.array(z.object({ title: z.string(), content: z.string() })).optional().default([]),
  project_id: z.string().uuid().optional().nullable(),
  client_id: z.string().uuid().optional().nullable(),
  counterparty_name: z.string().optional().nullable(),
  subtotal: z.number().optional().default(0),
  tax_amount: z.number().optional().default(0),
  total_amount: z.number().optional().default(0),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  valid_until: z.string().optional().nullable(),
  items: z.array(z.object({
    item_type: z.enum(['material', 'labor', 'other']).default('labor'),
    description: z.string().min(1),
    quantity: z.number().default(1),
    unit: z.string().default('st'),
    unit_price: z.number().default(0),
    vat_rate: z.number().default(25),
    sort_order: z.number().default(0),
  })).optional().default([]),
})

export async function GET(req: NextRequest) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const raw = Object.fromEntries(req.nextUrl.searchParams.entries())
    const parsed = ListSchema.safeParse(raw)
    if (!parsed.success) {
      return apiError('Invalid query parameters', 400, {
        issues: parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`),
      })
    }

    const { status, contract_type, search, page, limit } = parsed.data
    const from = (page - 1) * limit
    const to = from + limit - 1

    let q = auth.admin
      .from('contracts')
      .select('*, client:clients(id, name)', { count: 'exact' })
      .eq('tenant_id', auth.tenantId)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (status) q = q.eq('status', status)
    if (contract_type) q = q.eq('contract_type', contract_type)
    if (search) q = q.or(`title.ilike.%${search}%,contract_number.ilike.%${search}%,counterparty_name.ilike.%${search}%`)

    const { data, error, count } = await q
    if (error) throw error

    return apiSuccess({
      data: data ?? [],
      meta: { page, limit, count: count ?? 0, totalPages: Math.ceil((count ?? 0) / limit) },
    })
  } catch (e) {
    return handleRouteError(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    let body: unknown
    try { body = await req.json() } catch { return apiError('Invalid JSON', 400) }

    const parsed = CreateSchema.safeParse(body)
    if (!parsed.success) {
      return apiError('Validation failed', 400, {
        issues: parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`),
      })
    }

    const { items, ...contractData } = parsed.data

    // Generate contract number
    const { data: numResult } = await auth.admin.rpc('generate_contract_number', {
      p_tenant_id: auth.tenantId,
    })
    const contractNumber = numResult || `AVT-${new Date().getFullYear()}-001`

    const { data: contract, error: insertError } = await auth.admin
      .from('contracts')
      .insert({
        ...contractData,
        tenant_id: auth.tenantId,
        contract_number: contractNumber,
        status: 'draft',
      })
      .select()
      .single()

    if (insertError) throw insertError

    // Insert items if provided
    if (items.length > 0) {
      const itemRows = items.map((item, i) => ({
        contract_id: contract.id,
        item_type: item.item_type,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unit_price,
        vat_rate: item.vat_rate,
        sort_order: item.sort_order ?? i,
      }))

      const { error: itemsError } = await auth.admin
        .from('contract_items')
        .insert(itemRows)

      if (itemsError) {
        // Roll back the contract on item insert failure
        await auth.admin.from('contracts').delete().eq('id', contract.id)
        throw itemsError
      }
    }

    // Fetch complete contract with items
    const { data: complete } = await auth.admin
      .from('contracts')
      .select('*, client:clients(id, name), items:contract_items(*)')
      .eq('id', contract.id)
      .single()

    return apiSuccess(complete ?? contract, 201)
  } catch (e) {
    return handleRouteError(e)
  }
}
