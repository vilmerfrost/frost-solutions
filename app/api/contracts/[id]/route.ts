// app/api/contracts/[id]/route.ts
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuthAdmin, apiSuccess, apiError, handleRouteError } from '@/lib/api'

export const runtime = 'nodejs'

const UpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  sections: z.array(z.object({ title: z.string(), content: z.string() })).optional(),
  contract_type: z.enum(['client', 'subcontractor']).optional(),
  project_id: z.string().uuid().nullable().optional(),
  client_id: z.string().uuid().nullable().optional(),
  counterparty_name: z.string().nullable().optional(),
  subtotal: z.number().optional(),
  tax_amount: z.number().optional(),
  total_amount: z.number().optional(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  valid_until: z.string().nullable().optional(),
  status: z.enum(['draft', 'sent', 'signed', 'active', 'completed', 'cancelled']).optional(),
}).strict()

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { data: contract, error } = await auth.admin
      .from('contracts')
      .select('*, client:clients(id, name, email), project:projects(id, name)')
      .eq('id', id)
      .eq('tenant_id', auth.tenantId)
      .maybeSingle()

    if (error) throw error
    if (!contract) return apiError('Contract not found', 404)

    // Fetch items
    const { data: items } = await auth.admin
      .from('contract_items')
      .select('*')
      .eq('contract_id', id)
      .order('sort_order', { ascending: true })

    return apiSuccess({ ...contract, items: items ?? [] })
  } catch (e) {
    return handleRouteError(e)
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    let body: unknown
    try { body = await req.json() } catch { return apiError('Invalid JSON', 400) }

    const parsed = UpdateSchema.safeParse(body)
    if (!parsed.success) {
      return apiError('Validation failed', 400, {
        issues: parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`),
      })
    }

    // Verify exists
    const { data: existing } = await auth.admin
      .from('contracts')
      .select('id, status')
      .eq('id', id)
      .eq('tenant_id', auth.tenantId)
      .maybeSingle()

    if (!existing) return apiError('Contract not found', 404)

    // Only allow editing drafts (except status changes)
    if (existing.status !== 'draft' && !parsed.data.status) {
      return apiError('Only draft contracts can be edited', 400)
    }

    const { data: updated, error } = await auth.admin
      .from('contracts')
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('tenant_id', auth.tenantId)
      .select()
      .single()

    if (error) throw error

    return apiSuccess(updated)
  } catch (e) {
    return handleRouteError(e)
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { data: existing } = await auth.admin
      .from('contracts')
      .select('id, status')
      .eq('id', id)
      .eq('tenant_id', auth.tenantId)
      .maybeSingle()

    if (!existing) return apiSuccess({ deleted: true })

    if (existing.status === 'signed' || existing.status === 'active') {
      return apiError('Cannot delete signed or active contracts', 400)
    }

    const { error } = await auth.admin
      .from('contracts')
      .delete()
      .eq('id', id)
      .eq('tenant_id', auth.tenantId)

    if (error) throw error

    return apiSuccess({ deleted: true })
  } catch (e) {
    return handleRouteError(e)
  }
}
