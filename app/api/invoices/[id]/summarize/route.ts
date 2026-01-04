import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
 const { id: invoiceId } = await context.params
 const supabase = createClient()

 // Hämta faktura + rader
 const [{ data: invoice }, { data: lines }] = await Promise.all([
  supabase.from('invoices').select('id, number, project_id').eq('id', invoiceId).single(),
  supabase.from('invoice_lines').select('description, hours, rate, amount').eq('invoice_id', invoiceId),
 ])
 if (!invoice) return NextResponse.json({ error: 'Faktura saknas' }, { status: 404 })

 // Skapa prompten
 const list = (lines || [])
  .slice(0, 50)
  .map((e) => `• ${e.description}: ${e.hours}h (${e.amount} kr)`)
  .join('\n')

 const userPrompt = `Sammanfatta kort fakturan "${invoice.number}" utifrån poster:\n${list}\n\n3–4 meningar, svensk ton, sakligt.`

 // Demo-respons för nu!
 const summary = `Demo-sammanfattning (ersätt med riktig AI-respons).\nPoster: ${lines?.length || 0}`

 return NextResponse.json({ summary })
}
