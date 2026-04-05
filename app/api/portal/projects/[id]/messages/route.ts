import { NextRequest } from 'next/server'
import { z } from 'zod'
import { parseBody, apiSuccess, apiError, handleRouteError } from '@/lib/api'
import { resolvePortalAuth } from '@/lib/portal/auth'

const SendMessageSchema = z.object({
  message: z.string().min(1).max(5000),
  attachments: z.array(z.object({
    name: z.string(),
    url: z.string().url(),
  })).optional(),
})

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await resolvePortalAuth(req)
    if (auth.error) return auth.error

    const { id: projectId } = await params

    // Verify project belongs to customer's client
    const { data: project } = await auth.admin
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('client_id', auth.user.clientId)
      .eq('tenant_id', auth.user.tenantId)
      .single()

    if (!project) return apiError('Project not found', 404)

    // Fetch messages
    const { data: messages } = await auth.admin
      .from('project_messages')
      .select('*')
      .eq('project_id', projectId)
      .eq('tenant_id', auth.user.tenantId)
      .order('created_at', { ascending: true })

    // Mark employee messages as read
    await auth.admin
      .from('project_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('project_id', projectId)
      .eq('tenant_id', auth.user.tenantId)
      .eq('sender_type', 'employee')
      .is('read_at', null)

    return apiSuccess(messages ?? [])
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await resolvePortalAuth(req)
    if (auth.error) return auth.error

    const { id: projectId } = await params
    const parsed = await parseBody(req, SendMessageSchema)
    if (parsed.error) return parsed.error

    // Verify project belongs to customer's client
    const { data: project } = await auth.admin
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('client_id', auth.user.clientId)
      .eq('tenant_id', auth.user.tenantId)
      .single()

    if (!project) return apiError('Project not found', 404)

    const { data: msg, error: insertError } = await auth.admin
      .from('project_messages')
      .insert({
        tenant_id: auth.user.tenantId,
        project_id: projectId,
        sender_type: 'customer',
        sender_id: auth.user.id,
        sender_name: auth.user.name,
        message: parsed.data.message,
        attachments: parsed.data.attachments ?? [],
      })
      .select()
      .single()

    if (insertError || !msg) return apiError('Failed to send message', 500)

    return apiSuccess(msg, 201)
  } catch (error) {
    return handleRouteError(error)
  }
}
