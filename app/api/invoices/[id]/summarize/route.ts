import { NextRequest } from 'next/server'
import { resolveAuthAdmin, apiSuccess, apiError, handleRouteError } from '@/lib/api'
import { callOpenRouter } from '@/lib/ai/openrouter'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error
    const { id } = await params

    // Check that OpenRouter is configured
    if (!process.env.OPENROUTER_API_KEY) {
      return apiError('AI-sammanfattning är inte konfigurerad. OPENROUTER_API_KEY saknas.', 503)
    }

    // Fetch invoice with client info and line items
    const { data: invoice, error: invError } = await auth.admin
      .from('invoices')
      .select('*, client:clients(name)')
      .eq('id', id)
      .eq('tenant_id', auth.tenantId)
      .single()

    if (invError || !invoice) return apiError('Faktura saknas', 404)

    const { data: lines } = await auth.admin
      .from('invoice_lines')
      .select('description, hours, rate, amount')
      .eq('invoice_id', id)

    // Build context for the AI
    const lineList = (lines || [])
      .slice(0, 50)
      .map((l) => `- ${l.description || 'Utan beskrivning'}: ${l.hours ?? 0}h × ${l.rate ?? 0} kr = ${l.amount ?? 0} kr`)
      .join('\n')

    const subtotal = (lines || []).reduce((sum, l) => sum + (l.amount ?? 0), 0)
    const vatAmount = subtotal * 0.25
    const total = subtotal + vatAmount

    const invoiceContext = [
      `Fakturanummer: ${invoice.ocr_number || invoice.id}`,
      `Kund: ${invoice.client?.name || invoice.customer_name || 'Okänd'}`,
      `Fakturadatum: ${invoice.invoice_date || invoice.issue_date || 'Ej angivet'}`,
      `Förfallodatum: ${invoice.due_date || 'Ej angivet'}`,
      `Status: ${invoice.status || 'Okänd'}`,
      `Belopp (exkl. moms): ${subtotal.toFixed(2)} kr`,
      `Moms (25%): ${vatAmount.toFixed(2)} kr`,
      `Totalbelopp: ${total.toFixed(2)} kr`,
      invoice.total_amount ? `Registrerat totalbelopp: ${invoice.total_amount} kr` : null,
      '',
      `Fakturarader (${lines?.length || 0} st):`,
      lineList || '(Inga rader)',
    ].filter(Boolean).join('\n')

    const systemPrompt = `Du är en hjälpsam assistent för ett svenskt byggföretag. Du sammanfattar fakturor kort och sakligt på svenska. Svara med ren text, inga markdown-rubriker.`

    const userPrompt = `Sammanfatta denna faktura i 3-5 meningar. Inkludera vad fakturan avser, nyckelbelopp, betalningsstatus och förfallodatum, samt eventuella anmärkningsvärda poster.\n\n${invoiceContext}`

    const summary = await callOpenRouter(systemPrompt, userPrompt, {
      maxTokens: 512,
    })

    return apiSuccess({ summary })
  } catch (err) {
    return handleRouteError(err)
  }
}
