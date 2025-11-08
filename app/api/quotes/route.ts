import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getTenantId } from '@/lib/serverTenant'
import { extractErrorMessage } from '@/lib/errorUtils'
import { generateQuoteNumber } from '@/lib/pricing/generateQuoteNumber'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const tenantId = await getTenantId()
    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()
    const url = new URL(req.url)
    const status = url.searchParams.get('status')
    const customerId = url.searchParams.get('customer_id')
    const page = Number(url.searchParams.get('page') ?? 1)
    const limit = Math.min(100, Number(url.searchParams.get('limit') ?? 20))
    const from = (page - 1) * limit
    const to = from + limit - 1

    let q = admin
      .from('quotes')
      .select('id, quote_number, title, status, total_amount, created_at, customer_id', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (status) q = q.eq('status', status)
    if (customerId) q = q.eq('customer_id', customerId)

    const { data, error, count } = await q
    if (error) throw error

    return NextResponse.json({ success: true, data, meta: { page, limit, count } })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: extractErrorMessage(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = await getTenantId()
    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const admin = createAdminClient()

    const quoteNumber = await generateQuoteNumber(tenantId)

    // Get user ID from session
    const { createClient } = await import('@/utils/supabase/server')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const payload = {
      tenant_id: tenantId,
      quote_number: quoteNumber,
      title: body.title,
      customer_id: body.customer_id,
      project_id: body.project_id ?? null,
      valid_until: body.valid_until ?? null,
      kma_enabled: !!body.kma_enabled,
      created_by: user?.id || body.created_by || null,
      status: 'draft'
    }

    const { data, error } = await admin.from('quotes').insert(payload).select().single()
    if (error) throw error

    // Log history
    await admin.from('quote_history').insert({
      tenant_id: tenantId,
      quote_id: data.id,
      event_type: 'created',
      event_data: { payload }
    })

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: extractErrorMessage(e) }, { status: 500 })
  }
}

