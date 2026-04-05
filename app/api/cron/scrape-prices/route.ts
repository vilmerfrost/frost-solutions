import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { ALL_SCRAPERS, calcPriceChangePercent, type CatalogItem } from '@/lib/scraper/suppliers'

export const runtime = 'nodejs'
export const maxDuration = 120

/**
 * GET /api/cron/scrape-prices
 * Nightly cron — scrapes supplier prices and upserts to supplier_catalog_items.
 */
export async function GET(req: Request) {
  try {
    // Auth: CRON_SECRET
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient(30_000)
    let totalUpserted = 0
    let totalErrors = 0
    const errors: string[] = []

    for (const scraper of ALL_SCRAPERS) {
      const urls = scraper.getCategoryUrls()

      for (const url of urls) {
        try {
          const items = await scraper.scrapeCategory(url)

          for (const item of items) {
            try {
              await upsertCatalogItem(admin, item)
              totalUpserted++
            } catch (err: unknown) {
              totalErrors++
              const msg = err instanceof Error ? err.message : String(err)
              errors.push(`Upsert error for ${item.product_name}: ${msg}`)
            }
          }
        } catch (err: unknown) {
          totalErrors++
          const msg = err instanceof Error ? err.message : String(err)
          errors.push(`Scrape error for ${url}: ${msg}`)
        }
      }
    }

    return NextResponse.json({
      success: true,
      upserted: totalUpserted,
      errors: totalErrors,
      errorDetails: errors.slice(0, 20),
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Error in GET /api/cron/scrape-prices:', msg)
    return NextResponse.json(
      { error: 'Internal server error', details: msg },
      { status: 500 }
    )
  }
}

async function upsertCatalogItem(
  admin: ReturnType<typeof createAdminClient>,
  item: CatalogItem
) {
  // Look up existing item by supplier_name + sku (or supplier_name + product_name if no sku)
  let existingQuery = admin
    .from('supplier_catalog_items')
    .select('id, price_sek')
    .eq('supplier_name', item.supplier_name)

  if (item.sku) {
    existingQuery = existingQuery.eq('sku', item.sku)
  } else {
    existingQuery = existingQuery.eq('product_name', item.product_name)
  }

  const { data: existing } = await existingQuery.limit(1).single()

  const previousPrice = existing?.price_sek ?? null
  const priceChangePercent = calcPriceChangePercent(item.price_sek, previousPrice)

  if (existing) {
    await admin
      .from('supplier_catalog_items')
      .update({
        product_name: item.product_name,
        product_url: item.product_url,
        category: item.category,
        price_sek: item.price_sek,
        unit: item.unit,
        in_stock: item.in_stock,
        scraped_at: new Date().toISOString(),
        previous_price_sek: previousPrice,
        price_change_percent: priceChangePercent,
      })
      .eq('id', existing.id)
  } else {
    await admin.from('supplier_catalog_items').insert({
      supplier_name: item.supplier_name,
      supplier_url: item.supplier_url,
      product_name: item.product_name,
      product_url: item.product_url,
      category: item.category,
      sku: item.sku,
      price_sek: item.price_sek,
      unit: item.unit,
      in_stock: item.in_stock,
      scraped_at: new Date().toISOString(),
      previous_price_sek: null,
      price_change_percent: null,
    })
  }
}
