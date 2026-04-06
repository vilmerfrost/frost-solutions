// ──────────────────────────────────────────────
// Apify integration — Prisjakt price scraping
// ──────────────────────────────────────────────
// Uses the Prisjakt scraper actor on Apify to get aggregated
// prices from Beijer, Ahlsell, and other Swedish retailers.
// Requires APIFY_API_TOKEN env var.
// ──────────────────────────────────────────────

import type { CatalogItem } from './suppliers'

const APIFY_BASE = 'https://api.apify.com/v2'
const PRISJAKT_ACTOR_ID = 'studio-amba/prisjakt-scraper'

// Building material search terms to scrape from Prisjakt
const PRISJAKT_SEARCHES = [
  'virke byggmaterial',
  'isolering byggmaterial',
  'gipsskiva',
  'plywood',
  'skruv byggmaterial',
  'trall',
  'reglar trä',
  'takpapp',
  'betong',
  'puts fasad',
]

interface PrisjaktProduct {
  name: string
  price: number
  url: string
  shop?: string
  shopUrl?: string
  category?: string
  inStock?: boolean
}

/**
 * Run the Prisjakt scraper on Apify and return results as CatalogItems.
 * This is an async operation — the actor run may take 1-5 minutes.
 */
export async function scrapePrisjakt(): Promise<CatalogItem[]> {
  const token = process.env.APIFY_API_TOKEN
  if (!token) {
    console.warn('APIFY_API_TOKEN not set — skipping Prisjakt scrape')
    return []
  }

  const allItems: CatalogItem[] = []

  for (const searchTerm of PRISJAKT_SEARCHES) {
    try {
      const items = await runPrisjaktSearch(token, searchTerm)
      allItems.push(...items)
    } catch (err) {
      console.error(`Prisjakt scrape failed for "${searchTerm}":`, err)
    }
  }

  return allItems
}

async function runPrisjaktSearch(
  token: string,
  searchTerm: string
): Promise<CatalogItem[]> {
  // Start the actor run synchronously (waits for completion, up to 120s)
  const runUrl = `${APIFY_BASE}/acts/${encodeURIComponent(PRISJAKT_ACTOR_ID)}/run-sync-get-dataset-items?token=${token}`

  const res = await fetch(runUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      search: searchTerm,
      maxItems: 50,
      country: 'se',
    }),
    signal: AbortSignal.timeout(120_000),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Apify run failed (${res.status}): ${text}`)
  }

  const products: PrisjaktProduct[] = await res.json()

  return products
    .filter((p) => p.price > 0 && p.shop)
    .map((p) => {
      // Map Prisjakt shop names to our supplier names
      const supplierName = mapShopName(p.shop ?? '')

      return {
        supplier_name: supplierName,
        supplier_url: p.shopUrl ?? '',
        product_name: p.name,
        product_url: p.url ?? '',
        category: inferCategoryFromSearch(searchTerm),
        sku: null,
        price_sek: p.price,
        unit: 'st',
        in_stock: p.inStock ?? null,
      }
    })
}

/** Map Prisjakt shop names to our normalized supplier names */
function mapShopName(shop: string): string {
  const s = shop.toLowerCase()
  if (s.includes('byggmax')) return 'Byggmax'
  if (s.includes('beijer')) return 'Beijer Bygg'
  if (s.includes('xl-bygg') || s.includes('xlbygg')) return 'XL-Bygg'
  if (s.includes('ahlsell')) return 'Ahlsell'
  if (s.includes('bauhaus')) return 'Bauhaus'
  if (s.includes('hornbach')) return 'Hornbach'
  if (s.includes('k-rauta') || s.includes('krauta')) return 'K-Rauta'
  if (s.includes('jula')) return 'Jula'
  // Return the original name for unmapped shops
  return shop
}

function inferCategoryFromSearch(searchTerm: string): string {
  const t = searchTerm.toLowerCase()
  if (t.includes('virke') || t.includes('trall') || t.includes('reglar')) return 'virke'
  if (t.includes('isoler')) return 'isolering'
  if (t.includes('gips') || t.includes('plywood')) return 'skivor'
  if (t.includes('skruv')) return 'skruv'
  if (t.includes('takpapp') || t.includes('puts') || t.includes('fasad')) return 'övrigt'
  if (t.includes('betong')) return 'betong'
  return 'övrigt'
}
