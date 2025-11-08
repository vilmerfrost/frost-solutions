import type { SupabaseClient } from '@supabase/supabase-js'

export interface PricingItem {
  id?: string
  item_type: 'material' | 'labor' | 'other'
  quantity: number
  unit_price: number
  discount?: number   // %
  vat_rate?: number   // %
}

export interface PricingContext {
  tenantId: string
  items: PricingItem[]
  customerSegment?: string
  projectType?: string
}

export async function applyPricingRules(ctx: PricingContext, supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('pricing_rules')
    .select('*')
    .eq('tenant_id', ctx.tenantId)
    .eq('active', true)
    .order('priority', { ascending: true })

  if (error) throw error
  let discountPct = 0
  let markupPct = 0

  for (const r of (data ?? [])) {
    const condSegmentOk = !r.customer_segment || r.customer_segment === ctx.customerSegment
    const condTypeOk = !r.project_type || r.project_type === ctx.projectType
    const qtyTotal = ctx.items.reduce((s, i) => s + (i.quantity || 0), 0)
    const qtyOk =
      (r.min_quantity == null || qtyTotal >= Number(r.min_quantity)) &&
      (r.max_quantity == null || qtyTotal <= Number(r.max_quantity))

    if (condSegmentOk && condTypeOk && qtyOk) {
      discountPct += Number(r.discount_percent || 0)
      markupPct += Number(r.markup_percent || 0)
    }
  }
  return { discountPct, markupPct }
}

export async function calculateQuoteTotal(
  ctx: PricingContext,
  supabase: SupabaseClient
) {
  const baseSubtotal = ctx.items.reduce((sum, it) => sum + (it.quantity * it.unit_price), 0)

  const { discountPct, markupPct } = await applyPricingRules(ctx, supabase)

  // Rabatt på subtotal
  const ruleDiscountAmount = baseSubtotal * (discountPct / 100)

  // Enskilda raders rabatter (om du vill räkna med dem här; annars ligger de i DB-generatorerna)
  const rowDiscounts = ctx.items.reduce((sum, it) => {
    const row = it.quantity * it.unit_price
    const d = row * ((it.discount || 0) / 100)
    return sum + d
  }, 0)

  const subtotalAfterDiscount = baseSubtotal - ruleDiscountAmount - rowDiscounts

  // Markup appliceras efter rabatter
  const afterMarkup = subtotalAfterDiscount * (1 + (markupPct / 100))

  // Svensk moms 25% (kan per rad i DB; här kör vi globalt som fallback)
  const taxRate = 0.25
  const tax = afterMarkup * taxRate
  const total = afterMarkup + tax

  return {
    subtotal: round2(baseSubtotal),
    discount: round2(ruleDiscountAmount + rowDiscounts),
    tax: round2(tax),
    total: round2(total)
  }
}

const round2 = (n: number) => Math.round(n * 100) / 100

