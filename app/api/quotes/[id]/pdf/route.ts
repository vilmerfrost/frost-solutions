import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getTenantId } from '@/lib/serverTenant'
import { generateQuotePDF } from '@/lib/pdf/generateQuotePDF'
import { sendQuoteEmail } from '@/lib/email/sendQuoteEmail'
import { logQuoteChange } from '@/lib/quotes/approval'

export const runtime = 'nodejs'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
 try {
  const { id: quoteId } = await params
  const tenantId = await getTenantId()
  if (!tenantId) {
   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const admin = createAdminClient()

  const { data: quote, error: qErr } = await admin
   .from('quotes')
   .select('*, customer:clients(name)')
   .eq('tenant_id', tenantId)
   .eq('id', quoteId)
   .maybeSingle()
  
  if (qErr || !quote) {
   return NextResponse.json({ error: 'Offert saknas' }, { status: 404 })
  }

  const { data: items, error: iErr } = await admin
   .from('quote_items')
   .select('*')
   .eq('tenant_id', tenantId)
   .eq('quote_id', quoteId)
   .order('order_index', { ascending: true })
  
  if (iErr) throw iErr

  const pdf = await generateQuotePDF(quote, items ?? [])

  return new NextResponse(new Uint8Array(pdf), {
   headers: {
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="offert-${quote.quote_number}.pdf"`
   }
  })
 } catch (e: any) {
  return NextResponse.json({ error: e.message ?? 'PDF misslyckades' }, { status: 500 })
 }
}

