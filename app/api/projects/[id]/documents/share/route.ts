import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuthAdmin, parseBody, apiSuccess, apiError, handleRouteError } from '@/lib/api'

const ShareSchema = z.object({
  document_id: z.string().uuid(),
  shared_with_email: z.string().email().optional(),
  shared_with_name: z.string().optional(),
  permission: z.enum(['view', 'download']).default('view'),
  expires_in_days: z.number().int().min(1).max(365).optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { id: projectId } = await params
    const parsed = await parseBody(req, ShareSchema)
    if (parsed.error) return parsed.error

    const { document_id, shared_with_email, shared_with_name, permission, expires_in_days } = parsed.data

    // Verify document exists and belongs to this project
    const { data: doc } = await auth.admin
      .from('project_documents')
      .select('id')
      .eq('id', document_id)
      .eq('project_id', projectId)
      .eq('tenant_id', auth.tenantId)
      .single()

    if (!doc) return apiError('Document not found', 404)

    // Find employee
    const { data: employee } = await auth.admin
      .from('employees')
      .select('id')
      .eq('auth_user_id', auth.user.id)
      .eq('tenant_id', auth.tenantId)
      .single()

    const expiresAt = expires_in_days
      ? new Date(Date.now() + expires_in_days * 24 * 60 * 60 * 1000).toISOString()
      : null

    const { data: share, error: insertError } = await auth.admin
      .from('document_shares')
      .insert({
        tenant_id: auth.tenantId,
        document_id,
        shared_with_email: shared_with_email ?? null,
        shared_with_name: shared_with_name ?? null,
        permission,
        expires_at: expiresAt,
        created_by: employee?.id ?? null,
      })
      .select()
      .single()

    if (insertError || !share) return apiError('Failed to create share', 500)

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000/app'
    return apiSuccess({
      ...share,
      share_url: `${appUrl}/api/documents/shared/${share.access_token}`,
    }, 201)
  } catch (error) {
    return handleRouteError(error)
  }
}
