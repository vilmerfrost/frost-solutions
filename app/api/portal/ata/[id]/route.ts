import { NextRequest } from 'next/server'
import { apiSuccess, apiError, handleRouteError } from '@/lib/api'
import { resolvePortalAuth } from '@/lib/portal/auth'

/**
 * GET /api/portal/ata/[id]
 * Fetch a single ÄTA's details for the customer portal.
 * Requires portal auth + ÄTA must belong to a project of the customer's client.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await resolvePortalAuth(req)
    if (auth.error) return auth.error

    const { id: ataId } = await params

    // Fetch ÄTA with project name, verifying it belongs to the customer's client
    const { data: ata } = await auth.admin
      .from('rot_applications')
      .select('id, description, ata_type, urgency, work_type, work_cost_sek, material_cost_sek, total_cost_sek, cost_frame, photos, customer_approval_status, status_timeline, created_at, projects!inner(id, name, client_id)')
      .eq('id', ataId)
      .eq('tenant_id', auth.user.tenantId)
      .single()

    if (!ata) return apiError('ÄTA not found', 404)

    // Verify the project belongs to the customer's client
    const project = (ata as Record<string, unknown>).projects as {
      id: string
      name: string
      client_id: string
    } | null

    if (!project || project.client_id !== auth.user.clientId) {
      return apiError('ÄTA not found', 404)
    }

    return apiSuccess({
      id: ata.id,
      description: ata.description,
      ata_type: ata.ata_type,
      urgency: ata.urgency,
      work_type: ata.work_type,
      work_cost_sek: ata.work_cost_sek,
      material_cost_sek: ata.material_cost_sek,
      total_cost_sek: ata.total_cost_sek,
      cost_frame: ata.cost_frame,
      photos: ata.photos ?? [],
      customer_approval_status: ata.customer_approval_status,
      status_timeline: ata.status_timeline ?? [],
      created_at: ata.created_at,
      project_name: project.name,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
