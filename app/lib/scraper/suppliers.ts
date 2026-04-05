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
// Beijer Bygg scraper
// ──────────────────────────────────────────────

export const beijerScraper: SupplierScraper = {
  name: 'Beijer Bygg',
  baseUrl: 'https://www.beijerbygg.se',

  getCategoryUrls() {
    return [
      'https://www.beijerbygg.se/privat/produkter/virke',
      'https://www.beijerbygg.se/privat/produkter/skivor',
      'https://www.beijerbygg.se/privat/produkter/isolering',
      'https://www.beijerbygg.se/privat/produkter/golv',
      'https://www.beijerbygg.se/privat/produkter/farg-och-tapet',
    ]
  },

  async scrapeCategory(url: string): Promise<CatalogItem[]> {
    const html = await rateLimitedFetch(url)
    const $ = cheerio.load(html)
    const items: CatalogItem[] = []

    const categoryMatch = url.match(/\/([^/]+)$/)
    const category = categoryMatch ? categoryMatch[1] : null

    // Beijer uses a different product grid layout
    $('.product-list-item, .product-card, [data-product-id], .product-tile').each((_, el) => {
      const $el = $(el)

      const productName =
        $el.find('.product-card__name, .product-tile__title, .product-name, h3, h2').first().text().trim()
      if (!productName) return

      const priceText =
        $el.find('.product-card__price, .product-tile__price, .price, [data-price]').first().text().trim()
      const priceMatch = priceText.replace(/\s/g, '').match(/([\d]+[.,]?\d*)/)
      if (!priceMatch) return

      const priceSek = parseFloat(priceMatch[1].replace(',', '.'))
      if (isNaN(priceSek) || priceSek <= 0) return

      const linkHref = $el.find('a').first().attr('href') ?? ''
      const productUrl = linkHref.startsWith('http')
        ? linkHref
        : `https://www.beijerbygg.se${linkHref}`

      const sku =
        $el.attr('data-product-id') ??
        $el.find('[data-sku], [data-article-number]').first().attr('data-sku') ??
        $el.find('[data-article-number]').first().attr('data-article-number') ??
        null

      const stockText = $el.find('.stock-status, .availability, .product-tile__stock').text().toLowerCase()
      const inStock = stockText ? !stockText.includes('slut') : null

      const unitText = $el.find('.unit, .price-unit, .product-tile__unit').text().trim()
      const unit = unitText || 'st'

      items.push({
        supplier_name: 'Beijer Bygg',
        supplier_url: 'https://www.beijerbygg.se',
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
// XL-Bygg scraper
// ──────────────────────────────────────────────

export const xlByggScraper: SupplierScraper = {
  name: 'XL-Bygg',
  baseUrl: 'https://www.xl-bygg.se',

  getCategoryUrls() {
    return [
      'https://www.xl-bygg.se/produkter/virke-och-tra',
      'https://www.xl-bygg.se/produkter/byggskivor',
      'https://www.xl-bygg.se/produkter/isolering',
      'https://www.xl-bygg.se/produkter/golv',
      'https://www.xl-bygg.se/produkter/farg-och-tapet',
    ]
  },

  async scrapeCategory(url: string): Promise<CatalogItem[]> {
    const html = await rateLimitedFetch(url)
    const $ = cheerio.load(html)
    const items: CatalogItem[] = []

    const categoryMatch = url.match(/\/([^/]+)$/)
    const category = categoryMatch ? categoryMatch[1] : null

    // XL-Bygg uses a typical e-commerce product listing
    $('.product-item, .product-card, .product-list__item, [data-product]').each((_, el) => {
      const $el = $(el)

      const productName =
        $el.find('.product-item__name, .product-card__title, .product-title, h3, h2').first().text().trim()
      if (!productName) return

      const priceText =
        $el.find('.product-item__price, .product-card__price, .price, .current-price').first().text().trim()
      const priceMatch = priceText.replace(/\s/g, '').match(/([\d]+[.,]?\d*)/)
      if (!priceMatch) return

      const priceSek = parseFloat(priceMatch[1].replace(',', '.'))
      if (isNaN(priceSek) || priceSek <= 0) return

      const linkHref = $el.find('a').first().attr('href') ?? ''
      const productUrl = linkHref.startsWith('http')
        ? linkHref
        : `https://www.xl-bygg.se${linkHref}`

      const sku =
        $el.attr('data-product') ??
        $el.attr('data-product-id') ??
        $el.find('[data-sku]').attr('data-sku') ??
        null

      const stockText = $el.find('.stock, .stock-status, .availability').text().toLowerCase()
      const inStock = stockText ? !stockText.includes('slut') : null

      const unitText = $el.find('.unit, .price-unit').text().trim()
      const unit = unitText || 'st'

      items.push({
        supplier_name: 'XL-Bygg',
        supplier_url: 'https://www.xl-bygg.se',
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
// Ahlsell scraper
// ──────────────────────────────────────────────

export const ahlsellScraper: SupplierScraper = {
  name: 'Ahlsell',
  baseUrl: 'https://www.ahlsell.se',

  getCategoryUrls() {
    return [
      'https://www.ahlsell.se/produkter/vvs/',
      'https://www.ahlsell.se/produkter/el/',
      'https://www.ahlsell.se/produkter/verktyg/',
      'https://www.ahlsell.se/produkter/ror/',
      'https://www.ahlsell.se/produkter/fastighet/',
    ]
  },

  async scrapeCategory(url: string): Promise<CatalogItem[]> {
    const html = await rateLimitedFetch(url)
    const $ = cheerio.load(html)
    const items: CatalogItem[] = []

    const categoryMatch = url.match(/\/produkter\/([^/]+)/)
    const category = categoryMatch ? categoryMatch[1] : null

    // Ahlsell has a professional B2B product catalog layout
    $('.product-list-item, .product-card, .search-result-item, [data-article-id]').each((_, el) => {
      const $el = $(el)

      const productName =
        $el.find('.product-name, .product-card__name, .article-name, h3, h2').first().text().trim()
      if (!productName) return

      const priceText =
        $el.find('.product-price, .price, .article-price, [data-price]').first().text().trim()
      const priceMatch = priceText.replace(/\s/g, '').match(/([\d]+[.,]?\d*)/)
      if (!priceMatch) return

      const priceSek = parseFloat(priceMatch[1].replace(',', '.'))
      if (isNaN(priceSek) || priceSek <= 0) return

      const linkHref = $el.find('a').first().attr('href') ?? ''
      const productUrl = linkHref.startsWith('http')
        ? linkHref
        : `https://www.ahlsell.se${linkHref}`

      const sku =
        $el.attr('data-article-id') ??
        ($el.find('[data-sku], .article-number').first().text().trim() || null)

      const stockText = $el.find('.stock-status, .availability, .stock-indicator').text().toLowerCase()
      const inStock = stockText
        ? stockText.includes('lager') || stockText.includes('tillgänglig')
        : null

      const unitText = $el.find('.unit, .price-unit, .article-unit').text().trim()
      const unit = unitText || 'st'

      items.push({
        supplier_name: 'Ahlsell',
        supplier_url: 'https://www.ahlsell.se',
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

export const ALL_SCRAPERS: SupplierScraper[] = [
  byggmaxScraper,
  beijerScraper,
  xlByggScraper,
  ahlsellScraper,
]

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
