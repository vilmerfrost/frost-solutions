import { resolveAuthAdmin, apiSuccess, handleRouteError } from '@/lib/api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { data, error } = await auth.admin
      .from('quote_templates')
      .select('*')
      .eq('tenant_id', auth.tenantId)
      .order('created_at', { ascending: false })

    if (error) {
      // Table doesn't exist or other DB error — graceful degradation
      console.warn('[quote-templates] DB query failed, returning empty:', error.message)
      return apiSuccess({
        templates: [],
        message: 'Offertmallar är inte konfigurerade ännu.',
      })
    }

    return apiSuccess({ data })
  } catch (e) {
    return handleRouteError(e)
  }
}
