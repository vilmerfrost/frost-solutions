import { resolveAuthAdmin, apiSuccess, handleRouteError } from '@/lib/api'

export async function GET() {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { data, error } = await auth.admin
      .from('signing_orders')
      .select('id, idura_order_id, document_type, document_id, status, created_at')
      .eq('tenant_id', auth.tenantId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      // Table may not exist yet — return empty
      return apiSuccess([])
    }

    return apiSuccess(data ?? [])
  } catch (err) {
    return handleRouteError(err)
  }
}
