import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuthAdmin, parseBody, apiSuccess, apiError } from '@/lib/api'

export const runtime = 'nodejs'

const CompareSchema = z.object({
  items: z.array(
    z.object({
      name: z.string().min(1),
      quantity: z.coerce.number().min(1).default(1),
    })
  ).min(1, 'At least one item is required'),
})

/**
 * POST /api/materials/prices/compare
 * Compare prices across suppliers for a list of materials.
 * Requires auth (tenant feature).
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const body = await parseBody(req, CompareSchema)
    if (body.error) return body.error

    const { items } = body.data
    const results: Array<{
      requested_name: string
      quantity: number
      matches: Array<{
        supplier_name: string
        product_name: string
        product_url: string | null
        price_sek: number
        total_sek: number
        unit: string
        in_stock: boolean | null
        price_change_percent: number | null
      }>
      cheapest_total: number | null
    }> = []

    for (const item of items) {
      // Full-text search for each requested material
      const { data, error } = await auth.admin
        .from('supplier_catalog_items')
        .select('supplier_name, product_name, product_url, price_sek, unit, in_stock, price_change_percent')
        .textSearch('product_name', item.name, { type: 'websearch', config: 'swedish' })
        .order('price_sek', { ascending: true })
        .limit(10)

      if (error) {
        console.error(`Compare search error for "${item.name}":`, error)
        results.push({
          requested_name: item.name,
          quantity: item.quantity,
          matches: [],
          cheapest_total: null,
        })
        continue
      }

      const matches = (data ?? []).map((row) => ({
        supplier_name: row.supplier_name as string,
        product_name: row.product_name as string,
        product_url: row.product_url as string | null,
        price_sek: Number(row.price_sek),
        total_sek: Number(row.price_sek) * item.quantity,
        unit: row.unit as string,
        in_stock: row.in_stock as boolean | null,
        price_change_percent: row.price_change_percent != null ? Number(row.price_change_percent) : null,
      }))

      results.push({
        requested_name: item.name,
        quantity: item.quantity,
        matches,
        cheapest_total: matches.length > 0 ? matches[0].total_sek : null,
      })
    }

    const grandTotal = results.reduce((sum, r) => sum + (r.cheapest_total ?? 0), 0)

    return apiSuccess({ comparisons: results, cheapest_grand_total: grandTotal })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Error in POST /api/materials/prices/compare:', msg)
    return apiError('Internal server error', 500)
  }
}
