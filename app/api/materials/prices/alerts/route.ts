import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuthAdmin, parseBody, parseSearchParams, apiSuccess, apiError } from '@/lib/api'

export const runtime = 'nodejs'

const AlertQuerySchema = z.object({
  active: z.enum(['true', 'false']).optional(),
})

const CreateAlertSchema = z.object({
  product_name_pattern: z.string().min(1, 'Product name pattern is required'),
  threshold_percent: z.coerce.number().min(0.01).default(10),
  direction: z.enum(['drop', 'rise', 'both']).default('drop'),
})

/**
 * GET /api/materials/prices/alerts
 * List tenant's price alerts.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const params = parseSearchParams(req, AlertQuerySchema)
    if (params.error) return params.error

    let query = auth.admin
      .from('material_price_alerts')
      .select('*')
      .eq('tenant_id', auth.tenantId)
      .order('created_at', { ascending: false })

    if (params.data.active !== undefined) {
      query = query.eq('active', params.data.active === 'true')
    }

    const { data, error } = await query

    if (error) {
      console.error('Price alerts list error:', error)
      return apiError('Failed to list alerts', 500)
    }

    return apiSuccess(data ?? [])
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Error in GET /api/materials/prices/alerts:', msg)
    return apiError('Internal server error', 500)
  }
}

/**
 * POST /api/materials/prices/alerts
 * Create a new price alert for the tenant.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const body = await parseBody(req, CreateAlertSchema)
    if (body.error) return body.error

    const { data, error } = await auth.admin
      .from('material_price_alerts')
      .insert({
        tenant_id: auth.tenantId,
        product_name_pattern: body.data.product_name_pattern,
        threshold_percent: body.data.threshold_percent,
        direction: body.data.direction,
      })
      .select()
      .single()

    if (error) {
      console.error('Price alert create error:', error)
      return apiError('Failed to create alert', 500)
    }

    return apiSuccess(data, 201)
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Error in POST /api/materials/prices/alerts:', msg)
    return apiError('Internal server error', 500)
  }
}
