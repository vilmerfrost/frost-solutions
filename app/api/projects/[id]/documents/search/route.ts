import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuthAdmin, parseSearchParams, apiSuccess, apiError, handleRouteError } from '@/lib/api'

const SearchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required'),
})

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { id: projectId } = await params
    const parsed = parseSearchParams(req, SearchQuerySchema)
    if (parsed.error) return parsed.error

    const searchTerm = parsed.data.q

    // Use ILIKE for flexible matching on file_name and description
    const { data, error } = await auth.admin
      .from('project_documents')
      .select('*')
      .eq('project_id', projectId)
      .eq('tenant_id', auth.tenantId)
      .or(`file_name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false })

    if (error) return apiError('Failed to search documents', 500)

    // Sort results by relevance: exact filename matches first, then partial
    const lowerQ = searchTerm.toLowerCase()
    const ranked = (data ?? []).sort((a, b) => {
      const aName = (a.file_name || '').toLowerCase()
      const bName = (b.file_name || '').toLowerCase()
      const aExact = aName.includes(lowerQ) ? 1 : 0
      const bExact = bName.includes(lowerQ) ? 1 : 0
      return bExact - aExact
    })

    return apiSuccess(ranked)
  } catch (error) {
    return handleRouteError(error)
  }
}
