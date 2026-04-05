import { NextRequest } from 'next/server'
import { resolveAuthAdmin, apiSuccess, apiError, handleRouteError } from '@/lib/api'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { orderId } = await params

    const { data: order, error } = await auth.admin
      .from('signing_orders')
      .select('*')
      .eq('id', orderId)
      .eq('tenant_id', auth.tenantId)
      .single()

    if (error || !order) {
      return apiError('Signing order not found', 404)
    }

    return apiSuccess({
      id: order.id,
      iduraOrderId: order.idura_order_id,
      documentType: order.document_type,
      documentId: order.document_id,
      status: order.status,
      signatories: order.signatories,
      signedPdfUrl: order.signed_pdf_url,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
