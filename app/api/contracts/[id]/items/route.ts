// app/api/contracts/[id]/items/route.ts
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuthAdmin, apiSuccess, apiError, handleRouteError } from '@/lib/api'

export const runtime = 'nodejs'

const AddItemSchema = z.object({
  item_type: z.enum(['material', 'labor', 'other']).default('labor'),
  description: z.string().min(1, 'Beskrivning kravs'),
  quantity: z.number().default(1),
  unit: z.string().default('st'),
  unit_price: z.number().default(0),
  vat_rate: z.number().default(25),
  sort_order: z.number().default(0),
})

const UpdateItemSchema = z.object({
  id: z.string().uuid(),
  item_type: z.enum(['material', 'labor', 'other']).optional(),
  description: z.string().min(1).optional(),
  quantity: z.number().optional(),
  unit: z.string().optional(),
  unit_price: z.number().optional(),
  vat_rate: z.number().optional(),
  sort_order: z.number().optional(),
})

const DeleteItemSchema = z.object({
  itemId: z.string().uuid(),
})

async function verifyContractOwnership(admin: any, contractId: string, tenantId: string) {
  const { data } = await admin
    .from('contracts')
    .select('id')
    .eq('id', contractId)
    .eq('tenant_id', tenantId)
    .maybeSingle()
  return !!data
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contractId } = await params
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    if (!(await verifyContractOwnership(auth.admin, contractId, auth.tenantId))) {
      return apiError('Contract not found', 404)
    }

    const { data, error } = await auth.admin
      .from('contract_items')
      .select('*')
      .eq('contract_id', contractId)
      .order('sort_order', { ascending: true })

    if (error) throw error

    return apiSuccess(data ?? [])
  } catch (e) {
    return handleRouteError(e)
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contractId } = await params
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    if (!(await verifyContractOwnership(auth.admin, contractId, auth.tenantId))) {
      return apiError('Contract not found', 404)
    }

    let body: unknown
    try { body = await req.json() } catch { return apiError('Invalid JSON', 400) }

    const parsed = AddItemSchema.safeParse(body)
    if (!parsed.success) {
      return apiError('Validation failed', 400, {
        issues: parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`),
      })
    }

    const { data, error } = await auth.admin
      .from('contract_items')
      .insert({ ...parsed.data, contract_id: contractId })
      .select()
      .single()

    if (error) throw error

    return apiSuccess(data, 201)
  } catch (e) {
    return handleRouteError(e)
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contractId } = await params
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    if (!(await verifyContractOwnership(auth.admin, contractId, auth.tenantId))) {
      return apiError('Contract not found', 404)
    }

    let body: unknown
    try { body = await req.json() } catch { return apiError('Invalid JSON', 400) }

    const parsed = UpdateItemSchema.safeParse(body)
    if (!parsed.success) {
      return apiError('Validation failed', 400, {
        issues: parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`),
      })
    }

    const { id: itemId, ...updateData } = parsed.data

    const { data, error } = await auth.admin
      .from('contract_items')
      .update(updateData)
      .eq('id', itemId)
      .eq('contract_id', contractId)
      .select()
      .single()

    if (error) throw error

    return apiSuccess(data)
  } catch (e) {
    return handleRouteError(e)
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contractId } = await params
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    let body: unknown
    try { body = await req.json() } catch { return apiError('Invalid JSON', 400) }

    const parsed = DeleteItemSchema.safeParse(body)
    if (!parsed.success) {
      return apiError('Validation failed', 400)
    }

    const { error } = await auth.admin
      .from('contract_items')
      .delete()
      .eq('id', parsed.data.itemId)
      .eq('contract_id', contractId)

    if (error) throw error

    return apiSuccess({ deleted: true })
  } catch (e) {
    return handleRouteError(e)
  }
}
