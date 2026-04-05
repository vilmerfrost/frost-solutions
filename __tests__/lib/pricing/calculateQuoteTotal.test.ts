/**
 * @jest-environment node
 */
import {
  calculateQuoteTotal,
  applyPricingRules,
  PricingContext,
} from '@/lib/pricing/calculateQuoteTotal'

/**
 * Build a mock SupabaseClient that returns the given pricing rules
 * when querying the pricing_rules table.
 */
function buildSupaMock(rules: any[] = []) {
  const chain: Record<string, any> = {}
  const methods = ['select', 'eq', 'order']
  for (const m of methods) {
    chain[m] = jest.fn().mockReturnValue(chain)
  }
  chain.then = (resolve: any) => resolve({ data: rules, error: null })

  return { from: jest.fn().mockReturnValue(chain) } as any
}

function buildSupaMockError() {
  const chain: Record<string, any> = {}
  const methods = ['select', 'eq', 'order']
  for (const m of methods) {
    chain[m] = jest.fn().mockReturnValue(chain)
  }
  chain.then = (resolve: any, reject: any) =>
    resolve({ data: null, error: { message: 'db error' } })

  return { from: jest.fn().mockReturnValue(chain) } as any
}

const TENANT = 'tenant-1'

describe('calculateQuoteTotal', () => {
  it('calculates basic total with no rules and no row discounts (25% VAT)', async () => {
    const ctx: PricingContext = {
      tenantId: TENANT,
      items: [
        { item_type: 'material', quantity: 2, unit_price: 100 },
        { item_type: 'labor', quantity: 3, unit_price: 200 },
      ],
    }
    const supabase = buildSupaMock([])

    const result = await calculateQuoteTotal(ctx, supabase)

    // subtotal = 2*100 + 3*200 = 800
    // no discounts, no markup → afterMarkup = 800
    // tax = 800 * 0.25 = 200
    // total = 800 + 200 = 1000
    expect(result.subtotal).toBe(800)
    expect(result.discount).toBe(0)
    expect(result.tax).toBe(200)
    expect(result.total).toBe(1000)
  })

  it('applies row-level discount correctly', async () => {
    const ctx: PricingContext = {
      tenantId: TENANT,
      items: [
        { item_type: 'material', quantity: 10, unit_price: 50, discount: 10 },
      ],
    }
    const supabase = buildSupaMock([])

    const result = await calculateQuoteTotal(ctx, supabase)

    // subtotal = 10 * 50 = 500
    // rowDiscount = 500 * 0.10 = 50
    // afterDiscount = 500 - 50 = 450
    // tax = 450 * 0.25 = 112.5
    // total = 450 + 112.5 = 562.5
    expect(result.subtotal).toBe(500)
    expect(result.discount).toBe(50)
    expect(result.tax).toBe(112.5)
    expect(result.total).toBe(562.5)
  })

  it('applies rule-based discount from pricing_rules', async () => {
    const ctx: PricingContext = {
      tenantId: TENANT,
      items: [
        { item_type: 'labor', quantity: 1, unit_price: 1000 },
      ],
    }
    const rules = [
      { discount_percent: 5, markup_percent: 0, customer_segment: null, project_type: null, min_quantity: null, max_quantity: null },
    ]
    const supabase = buildSupaMock(rules)

    const result = await calculateQuoteTotal(ctx, supabase)

    // subtotal = 1000
    // ruleDiscount = 1000 * 0.05 = 50
    // afterDiscount = 1000 - 50 = 950
    // tax = 950 * 0.25 = 237.5
    // total = 950 + 237.5 = 1187.5
    expect(result.subtotal).toBe(1000)
    expect(result.discount).toBe(50)
    expect(result.tax).toBe(237.5)
    expect(result.total).toBe(1187.5)
  })

  it('applies rule-based markup from pricing_rules', async () => {
    const ctx: PricingContext = {
      tenantId: TENANT,
      items: [
        { item_type: 'material', quantity: 1, unit_price: 1000 },
      ],
    }
    const rules = [
      { discount_percent: 0, markup_percent: 15, customer_segment: null, project_type: null, min_quantity: null, max_quantity: null },
    ]
    const supabase = buildSupaMock(rules)

    const result = await calculateQuoteTotal(ctx, supabase)

    // subtotal = 1000
    // no discount → afterDiscount = 1000
    // afterMarkup = 1000 * 1.15 = 1150
    // tax = 1150 * 0.25 = 287.5
    // total = 1150 + 287.5 = 1437.5
    expect(result.subtotal).toBe(1000)
    expect(result.discount).toBe(0)
    expect(result.tax).toBe(287.5)
    expect(result.total).toBe(1437.5)
  })

  it('applies combined discount + markup', async () => {
    const ctx: PricingContext = {
      tenantId: TENANT,
      items: [
        { item_type: 'labor', quantity: 2, unit_price: 500 },
      ],
    }
    const rules = [
      { discount_percent: 10, markup_percent: 20, customer_segment: null, project_type: null, min_quantity: null, max_quantity: null },
    ]
    const supabase = buildSupaMock(rules)

    const result = await calculateQuoteTotal(ctx, supabase)

    // subtotal = 1000
    // ruleDiscount = 1000 * 0.10 = 100
    // afterDiscount = 1000 - 100 = 900
    // afterMarkup = 900 * 1.20 = 1080
    // tax = 1080 * 0.25 = 270
    // total = 1080 + 270 = 1350
    expect(result.subtotal).toBe(1000)
    expect(result.discount).toBe(100)
    expect(result.tax).toBe(270)
    expect(result.total).toBe(1350)
  })

  it('filters rules by customer segment', async () => {
    const ctx: PricingContext = {
      tenantId: TENANT,
      items: [
        { item_type: 'material', quantity: 1, unit_price: 1000 },
      ],
      customerSegment: 'enterprise',
    }
    const rules = [
      { discount_percent: 10, markup_percent: 0, customer_segment: 'enterprise', project_type: null, min_quantity: null, max_quantity: null },
      { discount_percent: 20, markup_percent: 0, customer_segment: 'startup', project_type: null, min_quantity: null, max_quantity: null },
    ]
    const supabase = buildSupaMock(rules)

    const result = await calculateQuoteTotal(ctx, supabase)

    // Only the enterprise rule (10%) should apply, not startup (20%)
    // ruleDiscount = 1000 * 0.10 = 100
    // afterDiscount = 900, tax = 225, total = 1125
    expect(result.discount).toBe(100)
    expect(result.total).toBe(1125)
  })

  it('filters rules by quantity range (min_quantity / max_quantity)', async () => {
    const ctx: PricingContext = {
      tenantId: TENANT,
      items: [
        { item_type: 'material', quantity: 5, unit_price: 100 },
        { item_type: 'labor', quantity: 3, unit_price: 100 },
      ],
    }
    // Total quantity = 8
    const rules = [
      { discount_percent: 5, markup_percent: 0, customer_segment: null, project_type: null, min_quantity: 5, max_quantity: 10 },
      { discount_percent: 15, markup_percent: 0, customer_segment: null, project_type: null, min_quantity: 20, max_quantity: 50 },
    ]
    const supabase = buildSupaMock(rules)

    const result = await calculateQuoteTotal(ctx, supabase)

    // Only first rule applies (qty 8 is in [5,10])
    // subtotal = 800, ruleDiscount = 800 * 0.05 = 40
    // afterDiscount = 760, tax = 190, total = 950
    expect(result.subtotal).toBe(800)
    expect(result.discount).toBe(40)
    expect(result.total).toBe(950)
  })
})

describe('applyPricingRules', () => {
  it('throws when supabase returns an error', async () => {
    const ctx: PricingContext = {
      tenantId: TENANT,
      items: [{ item_type: 'material', quantity: 1, unit_price: 100 }],
    }
    // Build a mock that resolves with error (the function checks error and throws)
    const chain: Record<string, any> = {}
    const methods = ['select', 'eq', 'order']
    for (const m of methods) {
      chain[m] = jest.fn().mockReturnValue(chain)
    }
    chain.then = (resolve: any) =>
      resolve({ data: null, error: { message: 'db error' } })
    const supabase = { from: jest.fn().mockReturnValue(chain) } as any

    await expect(applyPricingRules(ctx, supabase)).rejects.toEqual({ message: 'db error' })
  })

  it('returns zero discount and markup when no rules match', async () => {
    const ctx: PricingContext = {
      tenantId: TENANT,
      items: [{ item_type: 'material', quantity: 1, unit_price: 100 }],
      customerSegment: 'small',
    }
    const rules = [
      { discount_percent: 10, markup_percent: 0, customer_segment: 'enterprise', project_type: null, min_quantity: null, max_quantity: null },
    ]
    const supabase = buildSupaMock(rules)

    const result = await applyPricingRules(ctx, supabase)

    expect(result.discountPct).toBe(0)
    expect(result.markupPct).toBe(0)
  })
})
