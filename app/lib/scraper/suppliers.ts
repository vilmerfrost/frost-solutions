import * as cheerio from 'cheerio'

// ──────────────────────────────────────────────
// Types
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
  /** Scrape a single category page URL and return parsed items */
  scrapeCategory(url: string): Promise<CatalogItem[]>
  /** Return the list of category URLs to scrape */
  getCategoryUrls(): string[]
}

// ──────────────────────────────────────────────
// Rate limiter — 1 request per 2 seconds
// ──────────────────────────────────────────────

let lastRequestAt = 0

async function rateLimitedFetch(url: string): Promise<string> {
  const now = Date.now()
  const elapsed = now - lastRequestAt
  if (elapsed < 2000) {
    await new Promise((r) => setTimeout(r, 2000 - elapsed))
  }
  lastRequestAt = Date.now()

  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (compatible; FrostSolutions-PriceBot/1.0; +https://frostsolutions.se)',
      Accept: 'text/html,application/xhtml+xml',
    },
    signal: AbortSignal.timeout(15_000),
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`)
  }

  return res.text()
}

// ──────────────────────────────────────────────
// Byggmax scraper (Magento 2 structured product pages)
// ──────────────────────────────────────────────

export const byggmaxScraper: SupplierScraper = {
  name: 'Byggmax',
  baseUrl: 'https://www.byggmax.se',

  getCategoryUrls() {
    return [
      'https://www.byggmax.se/byggvaror/trae',
      'https://www.byggmax.se/byggvaror/skivor',
      'https://www.byggmax.se/byggvaror/isolering',
      'https://www.byggmax.se/byggvaror/golv',
      'https://www.byggmax.se/byggvaror/faerg-tapeter',
    ]
  },

  async scrapeCategory(url: string): Promise<CatalogItem[]> {
    const html = await rateLimitedFetch(url)
    const $ = cheerio.load(html)
    const items: CatalogItem[] = []

    // Extract category from URL path
    const categoryMatch = url.match(/\/([^/]+)$/)
    const category = categoryMatch ? categoryMatch[1] : null

    // Byggmax uses product list elements — adapt selectors to their Magento 2 layout
    $('[data-product-id], .product-item, .product-card').each((_, el) => {
      const $el = $(el)

      const productName =
        $el.find('.product-item-name, .product-name, .product-card__title, h2, h3').first().text().trim()
      if (!productName) return

      // Price parsing — look for structured price elements
      const priceText =
        $el.find('[data-price-amount], .price, .product-price, .product-card__price').first().text().trim()
      const priceMatch = priceText.replace(/\s/g, '').match(/([\d]+[.,]?\d*)/)
      if (!priceMatch) return

      const priceSek = parseFloat(priceMatch[1].replace(',', '.'))
      if (isNaN(priceSek) || priceSek <= 0) return

      // Product URL
      const linkHref = $el.find('a').first().attr('href') ?? ''
      const productUrl = linkHref.startsWith('http')
        ? linkHref
        : `https://www.byggmax.se${linkHref}`

      // SKU
      const sku =
        $el.attr('data-product-id') ??
        $el.find('[data-sku]').attr('data-sku') ??
        null

      // Stock status
      const stockText = $el.find('.stock, .availability, .product-card__stock').text().toLowerCase()
      const inStock = stockText ? !stockText.includes('slut') : null

      // Unit (default 'st')
      const unitText = $el.find('.unit, .product-card__unit, .price-unit').text().trim()
      const unit = unitText || 'st'

      items.push({
        supplier_name: 'Byggmax',
        supplier_url: 'https://www.byggmax.se',
        product_name: productName,
        product_url: productUrl,
        category,
        sku,
        price_sek: priceSek,
        unit,
        in_stock: inStock,
      })
    })

    return items
  },
}

// ──────────────────────────────────────────────
// Registry of all scrapers
// ──────────────────────────────────────────────

export const allScrapers: SupplierScraper[] = [byggmaxScraper]

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
