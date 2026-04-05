import { NextRequest } from 'next/server'
import { apiSuccess, apiError, handleRouteError } from '@/lib/api'
import { resolvePortalAuth } from '@/lib/portal/auth'
import { getStripe } from '@/lib/stripe/client'

export const runtime = 'nodejs'

/**
 * POST /api/portal/invoices/[id]/pay
 * Customer initiates payment for an invoice via Stripe Checkout.
 * Uses portal auth (JWT), not Supabase auth.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await resolvePortalAuth(req)
    if (auth.error) return auth.error

    const { id: invoiceId } = await params

    // Fetch the invoice — must belong to the portal user's client/tenant
    const { data: invoice, error: invErr } = await auth.admin
      .from('invoices')
      .select('id, invoice_number, total_amount, status, client_id, tenant_id, currency')
      .eq('id', invoiceId)
      .eq('client_id', auth.user.clientId)
      .eq('tenant_id', auth.user.tenantId)
      .single()

    if (invErr || !invoice) {
      return apiError('Invoice not found', 404)
    }

    if (invoice.status === 'paid') {
      return apiError('Invoice is already paid', 409)
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return apiError('Stripe is not configured', 503)
    }

    const stripe = getStripe()
    const amount = Math.round(Number(invoice.total_amount) * 100) // Convert to ore
    const currency = (invoice.currency ?? 'sek').toLowerCase()

    // Fetch tenant for branding
    const { data: tenant } = await auth.admin
      .from('tenants')
      .select('name')
      .eq('id', auth.user.tenantId)
      .maybeSingle()

    const baseUrl = process.env.NEXT_PUBLIC_PORTAL_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://app.frostsolutions.se'

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: `Faktura ${invoice.invoice_number}`,
              description: `Betalning till ${tenant?.name ?? 'leverantor'}`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: 'portal_invoice_payment',
        invoice_id: invoiceId,
        tenant_id: auth.user.tenantId,
        client_id: auth.user.clientId,
        portal_user_id: auth.user.id,
      },
      customer_email: auth.user.email,
      success_url: `${baseUrl}/portal/invoices/${invoiceId}?payment=success`,
      cancel_url: `${baseUrl}/portal/invoices/${invoiceId}?payment=cancelled`,
    })

    // Store the pending checkout session ID on the invoice
    await auth.admin
      .from('invoices')
      .update({
        metadata: {
          stripe_checkout_session_id: session.id,
          payment_initiated_at: new Date().toISOString(),
          payment_initiated_by: auth.user.id,
        },
      })
      .eq('id', invoiceId)

    return apiSuccess({
      checkout_url: session.url,
      session_id: session.id,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
