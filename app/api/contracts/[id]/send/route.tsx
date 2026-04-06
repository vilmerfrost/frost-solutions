import { NextRequest } from 'next/server'
import { z } from 'zod'
import { renderToBuffer } from '@react-pdf/renderer'
import { resolveAuthAdmin, apiSuccess, apiError, handleRouteError } from '@/lib/api'
import { createSigningOrder } from '@/lib/signing/idura-client'
import { ContractPDF } from '@/lib/pdf/contract-template'

export const runtime = 'nodejs'

const SendSchema = z.object({
  signatories: z.array(z.object({ reference: z.string().min(1) })).min(1),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    let body: unknown
    try { body = await req.json() } catch { return apiError('Invalid JSON', 400) }

    const parsed = SendSchema.safeParse(body)
    if (!parsed.success) {
      return apiError('Ange minst en mottagare', 400)
    }

    const { data: contract, error: cErr } = await auth.admin
      .from('contracts')
      .select('*, client:clients(id, name), project:projects(id, name)')
      .eq('id', id)
      .eq('tenant_id', auth.tenantId)
      .maybeSingle()

    if (cErr || !contract) return apiError('Contract not found', 404)
    if (contract.status !== 'draft') {
      return apiError('Only draft contracts can be sent for signing', 400)
    }

    const { data: items } = await auth.admin
      .from('contract_items')
      .select('*')
      .eq('contract_id', id)
      .order('sort_order', { ascending: true })

    const { data: tenant } = await auth.admin
      .from('tenants')
      .select('name')
      .eq('id', auth.tenantId)
      .single()

    const pdfBuffer = await renderToBuffer(
      <ContractPDF
        contract={contract}
        items={items ?? []}
        tenantName={tenant?.name ?? 'Foretag'}
      />
    )

    const pdfBase64 = Buffer.from(pdfBuffer).toString('base64')
    const appUrl = process.env.NEXT_PUBLIC_APP_URL
      ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

    const order = await createSigningOrder({
      documentTitle: `Avtal ${contract.contract_number} — ${contract.title}`,
      documentPdfBase64: pdfBase64,
      signatories: parsed.data.signatories,
      webhookUrl: `${appUrl}/api/signing/webhook`,
    })

    await auth.admin.from('signing_orders').insert({
      tenant_id: auth.tenantId,
      document_type: 'contract',
      document_id: id,
      idura_order_id: order.id,
      status: 'pending',
      signatories: order.signatories.map((s: any) => ({
        id: s.id,
        reference: s.reference,
        status: s.status,
        href: s.href,
      })),
    })

    await auth.admin
      .from('contracts')
      .update({ status: 'sent', updated_at: new Date().toISOString() })
      .eq('id', id)

    return apiSuccess({
      orderId: order.id,
      signatories: order.signatories.map((s: any) => ({
        id: s.id,
        reference: s.reference,
        signingUrl: s.href,
      })),
    })
  } catch (e) {
    return handleRouteError(e)
  }
}
