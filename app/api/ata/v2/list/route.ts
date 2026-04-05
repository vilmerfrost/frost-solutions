import { NextRequest } from 'next/server'
import { resolveAuthAdmin, apiSuccess, apiError, handleRouteError } from '@/lib/api'

export async function GET(req: NextRequest) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('project_id')

    let query = auth.admin
      .from('rot_applications')
      .select('*, projects(name)')
      .eq('tenant_id', auth.tenantId)
      .not('ata_type', 'is', null)
      .order('created_at', { ascending: false })

    if (projectId) {
      query = query.eq('project_id', projectId)
    }

    const { data, error } = await query

    if (error) return apiError(error.message, 500)
    return apiSuccess(data ?? [])
  } catch (err) {
    return handleRouteError(err)
  }
}
