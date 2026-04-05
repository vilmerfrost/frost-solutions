import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuthAdmin, apiSuccess, apiError, handleRouteError } from '@/lib/api'
import { createSigningOrder } from '@/lib/signing/idura-client'

const CreateSigningSchema = z.object({
  documentType: z.enum(['quote', 'invoice', 'contract', 'ata']),
  documentId: z.string().uuid(),
})

export async function POST(req: NextRequest) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const body = await req.json()
    const parsed = CreateSigningSchema.safeParse(body)
    if (!parsed.success) {
      return apiError(`Validation error: ${parsed.error.issues.map(i => i.message).join(', ')}`, 400)
    }

    const { documentType, documentId } = parsed.data

    // Fetch the document from the appropriate table
    const tableMap: Record<string, string> = {
      quote: 'quotes',
      invoice: 'invoices',
      contract: 'contracts',
      ata: 'aeta_requests',
    }

    const { data: document, error: docError } = await auth.admin
      .from(tableMap[documentType])
      .select('*')
      .eq('id', documentId)
      .eq('tenant_id', auth.tenantId)
      .single()

    if (docError || !document) {
      return apiError('Document not found', 404)
    }

    // TODO: Generate actual PDF from document data
    // For now, use a placeholder — PDF generation will be integrated in a follow-up
    const pdfBase64 = Buffer.from(`Placeholder PDF for ${documentType} ${documentId}`).toString('base64')

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000/app'
    const webhookUrl = `${appUrl}/api/signing/webhook`

    // Create signing order via Idura
    const signingOrder = await createSigningOrder({
      documentTitle: `${documentType}-${document.id}`,
      documentPdfBase64: pdfBase64,
      signatories: [{ reference: `${documentType}-signer` }],
      webhookUrl,
    })

    // Store in database
    const { data: stored, error: storeError } = await auth.admin
      .from('signing_orders')
      .insert({
        tenant_id: auth.tenantId,
        idura_order_id: signingOrder.id,
        document_type: documentType,
        document_id: documentId,
        status: 'pending',
        signatories: signingOrder.signatories,
      })
      .select()
      .single()

    if (storeError) {
      return apiError('Failed to store signing order', 500)
    }

    return apiSuccess({
      id: stored.id,
      iduraOrderId: signingOrder.id,
      status: 'pending',
      signingUrls: signingOrder.signatories.map((s: { id: string; reference: string; href: string }) => ({
        signatoryId: s.id,
        reference: s.reference,
        url: s.href,
      })),
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
