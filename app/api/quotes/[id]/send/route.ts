import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getTenantId } from '@/lib/serverTenant'
import { sendQuoteEmail } from '@/lib/email/sendQuoteEmail'
import { generateQuotePDF } from '@/lib/pdf/generateQuotePDF'
import { logQuoteChange } from '@/lib/quotes/approval'
import { getBaseUrlFromHeaders } from '@/utils/url'

export const runtime = 'nodejs'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: quoteId } = await params
    const tenantId = await getTenantId()
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const admin = createAdminClient()
    const { to } = await req.json()

    const { data: quote } = await admin
      .from('quotes')
      .select('*, customer:clients(name)')
      .eq('tenant_id', tenantId)
      .eq('id', quoteId)
      .maybeSingle()
    
    if (!quote) {
      return NextResponse.json({ error: 'Offert saknas' }, { status: 404 })
    }

    const { data: items } = await admin
      .from('quote_items')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('quote_id', quoteId)
      .order('order_index', { ascending: true })

    const pdf = await generateQuotePDF(quote, items ?? [])
    // Use getBaseUrlFromHeaders to get current origin (works with ngrok, localhost, production)
    const baseUrl = getBaseUrlFromHeaders(req.headers)
    const trackingUrl = `${baseUrl}/api/emails/track?tenant_id=${tenantId}&quote_id=${quoteId}`

    await sendQuoteEmail({
      tenantId,
      quoteId: quoteId,
      to,
      subject: `Offert ${quote.quote_number}`,
      pdfBuffer: pdf,
      trackingUrl
    })

    await admin
      .from('quotes')
      .update({ status: 'sent' } as any)
      .eq('tenant_id', tenantId)
      .eq('id', quoteId)

    await logQuoteChange(tenantId, quoteId, 'sent', { to })

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Utskick misslyckades' }, { status: 500 })
  }
}

