// ──────────────────────────────────────────────
// Supplier price scrapers — API-based
// ──────────────────────────────────────────────
// Byggmax: Magento 2 GraphQL (public, no auth)
// XL-Bygg: Next.js data route (public, no auth)
// Beijer / Ahlsell: via Apify Prisjakt actor (optional)
// ──────────────────────────────────────────────

export interface CatalogItem {
  supplier_name: string
  supplier_url: string
  product_name: string
  product_url: string
  category: string | null
  sku: string | null
  price_sek: number
  unit: string
  in_stock: boolean | null
}

export interface SupplierScraper {
  name: string
  baseUrl: string
  /** Fetch products for a given category or page */
  scrapeCategory(url: string): Promise<CatalogItem[]>
  /** Return the list of category URLs / page URLs to scrape */
  getCategoryUrls(): string[]
}

// ──────────────────────────────────────────────
// Rate limiter — 1 req per second for API calls
// ──────────────────────────────────────────────

let lastRequestAt = 0

async function rateLimitedFetch(
  url: string,
  init?: RequestInit
): Promise<Response> {
  const now = Date.now()
  const elapsed = now - lastRequestAt
  if (elapsed < 1000) {
    await new Promise((r) => setTimeout(r, 1000 - elapsed))
  }
  lastRequestAt = Date.now()

  const res = await fetch(url, {
    ...init,
    headers: {
      'User-Agent':
        'Mozilla/5.0 (compatible; FrostSolutions-PriceBot/1.0; +https://frostsolutions.se)',
      Accept: 'application/json',
      ...init?.headers,
    },
    signal: AbortSignal.timeout(15_000),
  })

  if (!res.ok) {
    throw new Error(`Fetch failed ${url}: ${res.status} ${res.statusText}`)
  }

  return res
}

// ──────────────────────────────────────────────
// Byggmax — Magento 2 GraphQL API
// ──────────────────────────────────────────────

const BYGGMAX_GRAPHQL = 'https://www.byggmax.se/graphql'

const BYGGMAX_CATEGORIES = [
  'trall',
  'virke',
  'skivor',
  'isolering',
  'golv',
  'faerg',
  'skruv',
  'beslag',
]

function byggmaxQuery(search: string, page: number, pageSize = 40): string {
  return JSON.stringify({
    query: `{
      products(search: "${search}", pageSize: ${pageSize}, currentPage: ${page}) {
        total_count
        page_info { current_page total_pages }
        items {
          name
          sku
          url_key
          price_range {
            minimum_price {
              final_price { value currency }
              regular_price { value currency }
            }
          }
          stock_status
        }
      }
    }`,
  })
}

export const byggmaxScraper: SupplierScraper = {
  name: 'Byggmax',
  baseUrl: 'https://www.byggmax.se',

  getCategoryUrls() {
    // Each "URL" is a search term — we iterate pages inside scrapeCategory
    return BYGGMAX_CATEGORIES.map((cat) => `graphql:${cat}`)
  },

  async scrapeCategory(url: string): Promise<CatalogItem[]> {
    const searchTerm = url.replace('graphql:', '')
    const allItems: CatalogItem[] = []
    let page = 1
    let totalPages = 1

    while (page <= totalPages && page <= 5) {
      const res = await rateLimitedFetch(BYGGMAX_GRAPHQL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: byggmaxQuery(searchTerm, page),
      })

      const json = await res.json()
      const products = json?.data?.products

      if (!products?.items?.length) break

      totalPages = products.page_info?.total_pages ?? 1

      for (const item of products.items) {
        const price =
          item.price_range?.minimum_price?.final_price?.value ??
          item.price_range?.minimum_price?.regular_price?.value
        if (!price || price <= 0) continue

        allItems.push({
          supplier_name: 'Byggmax',
          supplier_url: 'https://www.byggmax.se',
          product_name: item.name,
          product_url: `https://www.byggmax.se/${item.url_key}`,
          category: searchTerm,
          sku: item.sku ?? null,
          price_sek: price,
          unit: 'st',
          in_stock: item.stock_status === 'IN_STOCK' ? true : item.stock_status === 'OUT_OF_STOCK' ? false : null,
        })
      }

      page++
    }

    return allItems
  },
}

// ──────────────────────────────────────────────
// XL-Bygg — Next.js data route
// ──────────────────────────────────────────────

async function getXlByggBuildId(): Promise<string> {
  const res = await rateLimitedFetch('https://www.xlbygg.se/privat/produkter')
  const html = await res.text()

  // Extract buildId from __NEXT_DATA__
  const match = html.match(/"buildId"\s*:\s*"([^"]+)"/)
  if (!match) throw new Error('Could not extract XL-Bygg buildId')
  return match[1]
}

export const xlByggScraper: SupplierScraper = {
  name: 'XL-Bygg',
  baseUrl: 'https://www.xlbygg.se',

  getCategoryUrls() {
    // We generate page URLs dynamically in scrapeCategory
    return ['xlbygg:all']
  },

  async scrapeCategory(_url: string): Promise<CatalogItem[]> {
    const buildId = await getXlByggBuildId()
    const allItems: CatalogItem[] = []
    let page = 1
    let totalPages = 1

    // Scrape up to 10 pages (480 products) to stay reasonable
    while (page <= totalPages && page <= 10) {
      const dataUrl = `https://www.xlbygg.se/_next/data/${buildId}/privat/produkter.json?page=${page}`
      const res = await rateLimitedFetch(dataUrl)
      const json = await res.json()

      const data = json?.pageProps?.data
      if (!data?.products?.length) break

      totalPages = Math.min(data.num_pages ?? 1, 10)

      for (const p of data.products) {
        // Price is in SEK öre (cents) — divide by 100
        // Actually check: best_offer.price might be in öre or whole SEK
        const rawPrice = p.best_offer?.price
        if (!rawPrice || rawPrice <= 0) continue

        // XL-Bygg stores prices in whole SEK with VAT included
        const priceSek = rawPrice > 100000 ? rawPrice / 100 : rawPrice

        const slug = p.slug ?? ''
        const category = inferCategory(p.title ?? '')

        allItems.push({
          supplier_name: 'XL-Bygg',
          supplier_url: 'https://www.xlbygg.se',
          product_name: p.title ?? p.name ?? 'Okänd produkt',
          product_url: slug
            ? `https://www.xlbygg.se/privat/produkter/${slug}`
            : 'https://www.xlbygg.se/privat/produkter',
          category,
          sku: p.article_ids?.[0] ?? String(p.id) ?? null,
          price_sek: priceSek,
          unit: (p.unit ?? p.best_offer?.unit_label ?? 'st').toLowerCase(),
          in_stock:
            p.stocked_warehouses?.jarnia?.status === 'IN_STOCK'
              ? true
              : p.stocked_warehouses?.jarnia?.status === 'OUT_OF_STOCK'
                ? false
                : p.is_sellable ?? null,
        })
      }

      page++
    }

    return allItems
  },
}

/** Simple keyword-based category inference from product title */
function inferCategory(title: string): string {
  const t = title.toLowerCase()
  if (t.includes('virke') || t.includes('trall') || t.includes('regel') || t.includes('planka'))
    return 'virke'
  if (t.includes('skiva') || t.includes('plywood') || t.includes('osb') || t.includes('gips'))
    return 'skivor'
  if (t.includes('isoler')) return 'isolering'
  if (t.includes('golv') || t.includes('parkett') || t.includes('laminat')) return 'golv'
  if (t.includes('färg') || t.includes('tapet') || t.includes('lack')) return 'farg'
  if (t.includes('skruv') || t.includes('spik') || t.includes('bult') || t.includes('fäste'))
    return 'skruv'
  if (t.includes('rör') || t.includes('vvs') || t.includes('kran')) return 'vvs'
  if (t.includes('kabel') || t.includes('el') || t.includes('kontakt')) return 'el'
  if (t.includes('dörr') || t.includes('fönster')) return 'dorrar-fonster'
  return 'övrigt'
}

// ──────────────────────────────────────────────
// Registry
// ──────────────────────────────────────────────

export const ALL_SCRAPERS: SupplierScraper[] = [byggmaxScraper, xlByggScraper]

/** @deprecated Use ALL_SCRAPERS instead */
export const allScrapers: SupplierScraper[] = ALL_SCRAPERS

// ──────────────────────────────────────────────
// Price change calculation
// ──────────────────────────────────────────────

export function calcPriceChangePercent(
  current: number,
  previous: number | null | undefined
): number | null {
  if (previous == null || previous === 0) return null
  return Math.round(((current - previous) / previous) * 10000) / 100
}
