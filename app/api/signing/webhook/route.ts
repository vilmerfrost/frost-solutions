import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { closeSigningOrder } from '@/lib/signing/idura-client'
import type { SigningWebhookEvent } from '@/lib/signing/types'
import crypto from 'crypto'

function verifyWebhookSignature(body: string, signature: string | null): boolean {
  const secret = process.env.IDURA_WEBHOOK_SECRET
  if (!secret) return true // Skip verification if secret not configured
  if (!signature) return false

  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex')
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get('x-idura-signature')

    if (!verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event: SigningWebhookEvent = JSON.parse(rawBody)
    const admin = createAdminClient()

    // Find the signing order by Idura order ID
    const { data: order, error: findError } = await admin
      .from('signing_orders')
      .select('*')
      .eq('idura_order_id', event.signatureOrderId)
      .single()

    if (findError || !order) {
      return NextResponse.json({ error: 'Signing order not found' }, { status: 404 })
    }

    switch (event.event) {
      case 'SIGNATORY_SIGNED': {
        // Update the signatory status in the JSONB array
        const signatories = (order.signatories as Array<{ id: string; status: string }>) || []
        const updated = signatories.map(s =>
          s.id === event.signatoryId ? { ...s, status: 'SIGNED' } : s
        )

        const allSigned = updated.every(s => s.status === 'SIGNED')

        if (allSigned) {
          // Close the order and get signed documents
          const signedDocs = await closeSigningOrder(event.signatureOrderId)
          const signedPdfBase64 = signedDocs[0]?.blob

          // Store signed PDF URL (in production, upload to storage and store URL)
          // For now, we mark the URL as a data URI placeholder
          const signedPdfUrl = signedPdfBase64
            ? `data:application/pdf;base64,${signedPdfBase64.substring(0, 50)}...`
            : null

          await admin
            .from('signing_orders')
            .update({
              status: 'signed',
              signatories: updated,
              signed_pdf_url: signedPdfUrl,
              updated_at: new Date().toISOString(),
            })
            .eq('id', order.id)
        } else {
          await admin
            .from('signing_orders')
            .update({
              signatories: updated,
              updated_at: new Date().toISOString(),
            })
            .eq('id', order.id)
        }
        break
      }

      case 'SIGNATORY_REJECTED': {
        const signatories = (order.signatories as Array<{ id: string; status: string }>) || []
        const updated = signatories.map(s =>
          s.id === event.signatoryId ? { ...s, status: 'REJECTED' } : s
        )

        await admin
          .from('signing_orders')
          .update({
            status: 'rejected',
            signatories: updated,
            updated_at: new Date().toISOString(),
          })
          .eq('id', order.id)
        break
      }

      case 'SIGNATURE_ORDER_EXPIRED': {
        await admin
          .from('signing_orders')
          .update({
            status: 'expired',
            updated_at: new Date().toISOString(),
          })
          .eq('id', order.id)
        break
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Signing webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
