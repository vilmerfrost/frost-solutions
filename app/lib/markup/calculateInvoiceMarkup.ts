// app/lib/markup/calculateInvoiceMarkup.ts
import { createAdminClient } from '@/utils/supabase/admin'
import type { MarkupCalculation, MarkupRule } from '@/types/supplierInvoices'

export async function calculateInvoiceMarkup(
  invoiceId: string,
  projectId: string | null,
  tenantId: string
): Promise<MarkupCalculation> {
  const admin = createAdminClient()

  const [{ data: items }, { data: invoice }, { data: rules }] = await Promise.all([
    admin
      .from('supplier_invoice_items')
      .select('id, item_type, line_total, tenant_id')
      .eq('tenant_id', tenantId)
      .eq('supplier_invoice_id', invoiceId),
    admin
      .from('supplier_invoices')
      .select('supplier_id, tenant_id')
      .eq('tenant_id', tenantId)
      .eq('id', invoiceId)
      .maybeSingle(),
    admin
      .from('markup_rules')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('active', true)
      .order('priority', { ascending: false })
  ])

  if (!items || items.length === 0) {
    return { totalMarkup: 0, breakdown: [] }
  }

  const breakdown: Array<{ itemId: string; markup: number }> = []

  const applyRules = (amt: number, itType: string): number => {
    let add = 0
    const ruleList = (rules as MarkupRule[] | null) ?? []

    for (const r of ruleList) {
      const typeOk = !r.item_type || r.item_type === itType
      const supOk = !r.supplier_id || r.supplier_id === invoice?.supplier_id
      const projOk = !r.project_id || (!!projectId && r.project_id === projectId)
      const amountOk =
        (r.min_amount == null || amt >= Number(r.min_amount)) &&
        (r.max_amount == null || amt <= Number(r.max_amount))

      if (typeOk && supOk && projOk && amountOk) {
        const pct = Number(r.markup_percent || 0)
        const fix = Number(r.markup_fixed || 0)
        add += amt * (pct / 100) + fix
      }
    }

    return add
  }

  let total = 0
  for (const it of items) {
    const m = applyRules(Number(it.line_total || 0), it.item_type)
    breakdown.push({ itemId: it.id, markup: round2(m) })
    total += m
  }

  return { totalMarkup: round2(total), breakdown }
}

const round2 = (n: number) => Math.round(n * 100) / 100

