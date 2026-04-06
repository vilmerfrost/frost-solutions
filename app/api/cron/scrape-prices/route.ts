import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { ALL_SCRAPERS, calcPriceChangePercent, type CatalogItem } from '@/lib/scraper/suppliers'
import { scrapePrisjakt } from '@/lib/scraper/apify'

export const runtime = 'nodejs'
export const maxDuration = 300

/**
 * GET /api/cron/scrape-prices
 * Nightly cron — scrapes supplier prices via APIs and upserts to supplier_catalog_items.
 * Byggmax (GraphQL) + XL-Bygg (data route) run directly.
 * Prisjakt (Apify) runs if APIFY_API_TOKEN is set.
 */
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient(30_000)
    let totalUpserted = 0
    let totalErrors = 0
    const errors: string[] = []
    const supplierStats: Record<string, number> = {}

    // ── Direct API scrapers (Byggmax, XL-Bygg) ──
    for (const scraper of ALL_SCRAPERS) {
      const urls = scraper.getCategoryUrls()
      let scraperCount = 0

      for (const url of urls) {
        try {
          const items = await scraper.scrapeCategory(url)

          for (const item of items) {
            try {
              await upsertCatalogItem(admin, item)
              totalUpserted++
              scraperCount++
            } catch (err: unknown) {
              totalErrors++
              const msg = err instanceof Error ? err.message : String(err)
              errors.push(`Upsert error [${scraper.name}] ${item.product_name}: ${msg}`)
            }
          }
        } catch (err: unknown) {
          totalErrors++
          const msg = err instanceof Error ? err.message : String(err)
          errors.push(`Scrape error [${scraper.name}] ${url}: ${msg}`)
        }
      }

      supplierStats[scraper.name] = scraperCount
    }

    // ── Apify Prisjakt (if configured) ──
    try {
      const prisjaktItems = await scrapePrisjakt()
      let prisjaktCount = 0

      for (const item of prisjaktItems) {
        try {
          await upsertCatalogItem(admin, item)
          totalUpserted++
          prisjaktCount++
        } catch (err: unknown) {
          totalErrors++
          const msg = err instanceof Error ? err.message : String(err)
          errors.push(`Upsert error [Prisjakt] ${item.product_name}: ${msg}`)
        }
      }

      supplierStats['Prisjakt'] = prisjaktCount
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      errors.push(`Prisjakt scrape error: ${msg}`)
    }

    return NextResponse.json({
      success: true,
      upserted: totalUpserted,
      errors: totalErrors,
      supplierStats,
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
