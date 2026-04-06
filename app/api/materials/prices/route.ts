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
  limit: z.coerce.number().min(1).max(100).default(50),
})

// Map supplier_name in DB to the key the frontend uses
const SUPPLIER_KEY_MAP: Record<string, string> = {
  'Byggmax': 'byggmax',
  'Beijer Bygg': 'beijer',
  'XL-Bygg': 'xl_bygg',
  'Ahlsell': 'ahlsell',
}

// Map frontend category keys to DB category values
const CATEGORY_MAP: Record<string, string[]> = {
  tra: ['virke', 'trall', 'trae'],
  skruv: ['skruv'],
  isolering: ['isolering'],
  el: ['el'],
  vvs: ['vvs'],
}

interface SupplierPrices {
  byggmax?: number | null
  beijer?: number | null
  xl_bygg?: number | null
  ahlsell?: number | null
}

interface PriceResult {
  id: string
  product_name: string
  category: string
  unit: string
  prices: SupplierPrices
  price_change_percent?: number | null
}

/**
 * GET /api/materials/prices?q=plywood&category=tra
 * Returns grouped results with per-supplier prices for the frontend.
 */
export async function GET(req: NextRequest) {
  try {
    const params = parseSearchParams(req, SearchSchema)
    if (params.error) return params.error

    const { q, category, supplier, page, limit } = params.data
    const admin = createAdminClient()

    let query = admin
      .from('supplier_catalog_items')
      .select('id, product_name, supplier_name, category, price_sek, unit, price_change_percent, scraped_at')
      .order('price_sek', { ascending: true })
      .limit(500)

    // Full-text search
    if (q) {
      query = query.textSearch('product_name', q, { type: 'websearch', config: 'swedish' })
    }

    // Category filter
    if (category && category !== 'alla') {
      const dbCategories = CATEGORY_MAP[category]
      if (dbCategories) {
        query = query.in('category', dbCategories)
      } else {
        query = query.eq('category', category)
      }
    }

    // Supplier filter
    if (supplier) {
      const dbName = Object.entries(SUPPLIER_KEY_MAP).find(([, v]) => v === supplier)?.[0]
      if (dbName) query = query.eq('supplier_name', dbName)
    }

    const { data: rows, error } = await query

    if (error) {
      console.error('Price search error:', error)
      return apiError('Failed to search prices', 500)
    }

    // Group rows by product_name → merge supplier prices
    const grouped = new Map<string, PriceResult>()

    for (const row of rows ?? []) {
      const key = row.product_name.toLowerCase().trim()
      const supplierKey = SUPPLIER_KEY_MAP[row.supplier_name] ?? row.supplier_name.toLowerCase()

      if (!grouped.has(key)) {
        grouped.set(key, {
          id: row.id,
          product_name: row.product_name,
          category: row.category ?? 'övrigt',
          unit: row.unit ?? 'st',
          prices: {},
          price_change_percent: row.price_change_percent,
        })
      }

      const entry = grouped.get(key)!
      ;(entry.prices as Record<string, number | null>)[supplierKey] = row.price_sek
    }

    const results = Array.from(grouped.values())

    // Paginate
    const start = (page - 1) * limit
    const paged = results.slice(start, start + limit)

    // Metadata
    const latestScrape = (rows ?? []).reduce<string | null>((latest, r) => {
      if (!latest || r.scraped_at > latest) return r.scraped_at
      return latest
    }, null)

    const changesToday = (rows ?? []).filter(
      (r) => r.price_change_percent != null && r.price_change_percent !== 0
    ).length

    return apiSuccess({
      results: paged,
      updated_at: latestScrape ?? '',
      changes_today: changesToday,
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Error in GET /api/materials/prices:', msg)
    return apiError('Internal server error', 500)
  }
}
