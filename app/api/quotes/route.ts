import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuthAdmin, apiSuccess, apiError, handleRouteError } from '@/lib/api'
import { generateQuoteNumber } from '@/lib/pricing/generateQuoteNumber'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const QuotesQuerySchema = z.object({
  status: z.string().optional(),
  customer_id: z.string().uuid().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
})

const CreateQuoteSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  customer_id: z.string().uuid().optional().nullable(),
  project_id: z.string().uuid().optional().nullable(),
  valid_until: z.string().optional().nullable(),
  kma_enabled: z.boolean().default(false),
  created_by: z.string().uuid().optional().nullable(),
})

export async function GET(req: NextRequest) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const rawParams = Object.fromEntries(req.nextUrl.searchParams.entries())
    const parsed = QuotesQuerySchema.safeParse(rawParams)
    if (!parsed.success) {
      const issues = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`)
      return apiError('Invalid query parameters', 400, { issues })
    }

    const { status, customer_id, page, limit } = parsed.data
    const from = (page - 1) * limit
    const to = from + limit - 1

    let q = auth.admin
      .from('quotes')
      .select('id, quote_number, title, status, total_amount, created_at, customer_id', { count: 'exact' })
      .eq('tenant_id', auth.tenantId)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (status) q = q.eq('status', status)
    if (customer_id) q = q.eq('customer_id', customer_id)

    const { data, error, count } = await q
    if (error) throw error

    return apiSuccess({ data, meta: { page, limit, count } })
  } catch (e) {
    return handleRouteError(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return apiError('Invalid JSON body', 400)
    }

    const parsed = CreateQuoteSchema.safeParse(body)
    if (!parsed.success) {
      const issues = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`)
      return apiError('Validation failed', 400, { issues })
    }

    const quoteNumber = await generateQuoteNumber(auth.tenantId)

    // Ensure empty strings are converted to null for UUID fields
    const payload = {
      tenant_id: auth.tenantId,
      quote_number: quoteNumber,
      title: parsed.data.title,
      customer_id: parsed.data.customer_id || null,
      project_id: parsed.data.project_id || null,
      valid_until: parsed.data.valid_until || null,
      kma_enabled: parsed.data.kma_enabled,
      created_by: auth.user.id,
      status: 'draft'
    }

    const { data, error } = await auth.admin.from('quotes').insert(payload).select().single()
    if (error) throw error

    // Log history
    await auth.admin.from('quote_history').insert({
      tenant_id: auth.tenantId,
      quote_id: data.id,
      event_type: 'created',
      event_data: { payload }
    })

    return apiSuccess(data, 201)
  } catch (e) {
    return handleRouteError(e)
  }
}
