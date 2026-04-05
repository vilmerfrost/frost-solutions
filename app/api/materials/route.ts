// app/api/materials/route.ts
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuthAdmin, parseBody, parseSearchParams, apiSuccess, apiPaginated, apiError, handleRouteError } from '@/lib/api'

export const runtime = 'nodejs'

const MaterialsQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
})

const CreateMaterialSchema = z.object({
  sku: z.string().optional().nullable(),
  name: z.string().min(1, 'Name is required'),
  category: z.string().optional().nullable(),
  unit: z.string().min(1, 'Unit is required'),
  price: z.number({ error: 'Price is required' }),
})

export async function GET(req: NextRequest) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const params = parseSearchParams(req, MaterialsQuerySchema)
    if (params.error) return params.error

    const { search, category, page, limit } = params.data

    let query = auth.admin
      .from('materials')
      .select('*', { count: 'exact' })
      .eq('tenant_id', auth.tenantId)
      .order('name', { ascending: true })

    if (search) {
      query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`)
    }

    if (category) {
      query = query.eq('category', category)
    }

    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      console.error('[Materials API] Error:', error)
      return apiError('Failed to fetch materials', 500)
    }

    return apiPaginated(data || [], { page, limit, total: count || 0 })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const body = await parseBody(req, CreateMaterialSchema)
    if (body.error) return body.error

    const { sku, name, category, unit, price } = body.data

    const { data, error } = await auth.admin
      .from('materials')
      .insert({
        tenant_id: auth.tenantId,
        sku: sku || null,
        name,
        category: category || null,
        unit,
        price,
      })
      .select()
      .single()

    if (error) {
      console.error('[Materials API] Create error:', error)
      return apiError(error.message || 'Failed to create material', 500)
    }

    return apiSuccess(data, 201)
  } catch (error) {
    return handleRouteError(error)
  }
}
