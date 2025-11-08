import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getTenantId } from '@/lib/serverTenant'
import { generateQuoteNumber } from '@/lib/pricing/generateQuoteNumber'
import { logQuoteChange } from '@/lib/quotes/approval'

export const runtime = 'nodejs'

export async function POST(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const tenantId = await getTenantId()
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const admin = createAdminClient()

    const { data: quote } = await admin
      .from('quotes')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('id', params.id)
      .maybeSingle()
    
    if (!quote) {
      return NextResponse.json({ error: 'Offert saknas' }, { status: 404 })
    }

    const { data: items } = await admin
      .from('quote_items')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('quote_id', params.id)
      .order('order_index', { ascending: true })

    const newNumber = await generateQuoteNumber(tenantId)

    const { data: created } = await admin
      .from('quotes')
      .insert({
        tenant_id: tenantId,
        quote_number: newNumber,
        version_number: quote.version_number + 1,
        title: `${quote.title} (kopia)`,
        customer_id: quote.customer_id,
        project_id: quote.project_id,
        valid_until: quote.valid_until,
        kma_enabled: quote.kma_enabled,
        status: 'draft',
        created_by: quote.created_by
      })
      .select()
      .single()

    if (items?.length) {
      const cloned = items.map(i => ({
        tenant_id: tenantId,
        quote_id: created.id,
        item_type: i.item_type,
        name: i.name,
        description: i.description,
        quantity: i.quantity,
        unit: i.unit,
        unit_price: i.unit_price,
        discount: i.discount,
        vat_rate: i.vat_rate,
        order_index: i.order_index
      }))
      await admin.from('quote_items').insert(cloned)
    }

    await logQuoteChange(tenantId, created.id, 'duplicated', { source_quote_id: params.id })

    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

