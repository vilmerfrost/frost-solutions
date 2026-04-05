import { NextRequest } from 'next/server'
import Papa from 'papaparse'
import { resolveAuthAdmin, apiSuccess, apiError, handleRouteError } from '@/lib/api'

export const runtime = 'nodejs'

interface CsvRow {
  product_name?: string
  sku?: string
  price?: string
  unit?: string
  category?: string
}

const REQUIRED_COLUMNS = ['product_name', 'price'] as const

/**
 * POST /api/materials/prices/upload
 * Upload a CSV of contractor-negotiated supplier prices.
 *
 * Accepts either:
 *  - multipart/form-data with a `file` field (CSV) and `supplier_name` field
 *  - JSON body with `{ csv: "<base64>", supplier_name: "..." }`
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    let csvText: string
    let supplierName: string

    const contentType = req.headers.get('content-type') ?? ''

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      const file = formData.get('file')
      supplierName = (formData.get('supplier_name') as string) ?? ''

      if (!file || !(file instanceof File)) {
        return apiError('Missing file in form data', 400)
      }
      csvText = await file.text()
    } else {
      const body = await req.json()
      supplierName = body.supplier_name ?? ''

      if (body.csv) {
        csvText = Buffer.from(body.csv, 'base64').toString('utf-8')
      } else if (body.csv_text) {
        csvText = body.csv_text
      } else {
        return apiError('Missing csv (base64) or csv_text in body', 400)
      }
    }

    if (!supplierName.trim()) {
      return apiError('supplier_name is required', 400)
    }

    // Parse CSV
    const parsed = Papa.parse<CsvRow>(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h: string) => h.trim().toLowerCase().replace(/\s+/g, '_'),
    })

    if (parsed.errors.length > 0 && parsed.data.length === 0) {
      return apiError('CSV parsing failed', 400, {
        errors: parsed.errors.slice(0, 5).map((e) => e.message),
      })
    }

    // Validate required columns
    const headers = parsed.meta.fields ?? []
    for (const col of REQUIRED_COLUMNS) {
      if (!headers.includes(col)) {
        return apiError(`Missing required column: ${col}`, 400, {
          found_columns: headers,
          required: [...REQUIRED_COLUMNS],
        })
      }
    }

    const rows = parsed.data
    if (rows.length === 0) {
      return apiError('CSV contains no data rows', 400)
    }

    if (rows.length > 5000) {
      return apiError('CSV exceeds maximum of 5000 rows', 400)
    }

    let upserted = 0
    let skipped = 0
    const errors: string[] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const productName = row.product_name?.trim()
      const priceStr = row.price?.trim()

      if (!productName || !priceStr) {
        skipped++
        continue
      }

      const price = parseFloat(priceStr.replace(',', '.').replace(/\s/g, ''))
      if (isNaN(price) || price < 0) {
        errors.push(`Row ${i + 2}: invalid price "${priceStr}"`)
        skipped++
        continue
      }

      const sku = row.sku?.trim() || null
      const unit = row.unit?.trim() || 'st'
      const category = row.category?.trim() || null

      // Upsert by supplier_name + sku (or supplier_name + product_name)
      const matchFilter: Record<string, string> = {
        supplier_name: supplierName,
      }
      if (sku) {
        matchFilter.sku = sku
      } else {
        matchFilter.product_name = productName
      }

      // Check if existing
      let query = auth.admin
        .from('supplier_catalog_items')
        .select('id')
        .eq('supplier_name', supplierName)

      if (sku) {
        query = query.eq('sku', sku)
      } else {
        query = query.eq('product_name', productName)
      }

      const { data: existing } = await query.limit(1).single()

      const record = {
        supplier_name: supplierName,
        supplier_url: '',
        product_name: productName,
        product_url: '',
        category,
        sku,
        price_sek: price,
        unit,
        in_stock: null,
        scraped_at: new Date().toISOString(),
      }

      if (existing) {
        await auth.admin
          .from('supplier_catalog_items')
          .update(record)
          .eq('id', existing.id)
      } else {
        await auth.admin.from('supplier_catalog_items').insert({
          ...record,
          previous_price_sek: null,
          price_change_percent: null,
        })
      }

      upserted++
    }

    return apiSuccess({
      supplier_name: supplierName,
      total_rows: rows.length,
      upserted,
      skipped,
      errors: errors.slice(0, 20),
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
