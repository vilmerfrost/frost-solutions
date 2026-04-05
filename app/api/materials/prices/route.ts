import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/utils/supabase/admin'
import { parseSearchParams, apiSuccess, apiError } from '@/lib/api'

export const runtime = 'nodejs'

const SearchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  supplier: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
})

/**
 * GET /api/materials/prices?q=plywood&category=trä
 * Public catalog search — full-text search on supplier_catalog_items, sorted by price.
 */
export async function GET(req: NextRequest) {
  try {
    const params = parseSearchParams(req, SearchSchema)
    if (params.error) return params.error

    const { q, category, supplier, page, limit } = params.data
    const admin = createAdminClient()

    let query = admin
      .from('supplier_catalog_items')
      .select('*', { count: 'exact' })
      .order('price_sek', { ascending: true })

    // Full-text search using the Swedish GIN index
    if (q) {
      // Use websearch_to_tsquery for user-friendly query parsing
      query = query.textSearch('product_name', q, { type: 'websearch', config: 'swedish' })
    }

    if (category) {
      query = query.eq('category', category)
    }

    if (supplier) {
      query = query.eq('supplier_name', supplier)
    }

    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, count, error } = await query

    if (error) {
      console.error('Price search error:', error)
      return apiError('Failed to search prices', 500)
    }

    return apiSuccess({
      items: data ?? [],
      meta: {
        page,
        limit,
        total: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / limit),
      },
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Error in GET /api/materials/prices:', msg)
    return apiError('Internal server error', 500)
  }
}
