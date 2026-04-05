import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuthAdmin, parseBody, apiSuccess, apiError, handleRouteError } from '@/lib/api'

const UpdateClientSchema = z.object({
  tenantId: z.string().uuid(),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email().optional().nullable(),
  address: z.string().optional().nullable(),
  orgNumber: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await params

    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const body = await parseBody(request, UpdateClientSchema)
    if (body.error) return body.error

    const { tenantId, name, email, address, orgNumber, phone } = body.data

    // Check if user is admin
    const { data: employees } = await auth.admin
      .from('employees')
      .select('id, role, tenant_id')
      .eq('auth_user_id', auth.user.id)
      .eq('tenant_id', tenantId)

    if (!employees || employees.length === 0) {
      return apiError('No employee record found for this tenant', 403)
    }

    const isAdmin = employees.some(emp =>
      ['admin', 'Admin'].includes(emp.role ?? '')
    )

    if (!isAdmin) {
      return apiError('Admin access required', 403)
    }

    // Verify client exists and belongs to tenant
    const { data: existingClient } = await auth.admin
      .from('clients')
      .select('id')
      .eq('id', clientId)
      .eq('tenant_id', tenantId)
      .single()

    if (!existingClient) {
      return apiError('Client not found or access denied', 404)
    }

    // Build update payload with progressive fallback
    const updatePayload: Record<string, unknown> = {
      name,
      email: email || null,
      address: address || null,
      phone: phone || null,
    }

    // Try to add org_number if it exists
    try {
      const testQuery = await auth.admin
        .from('clients')
        .select('org_number')
        .eq('id', clientId)
        .limit(1)

      if (!testQuery.error) {
        updatePayload.org_number = orgNumber || null
      }
    } catch {
      // Column doesn't exist, skip it
    }

    // Update client
    const { data, error } = await auth.admin
      .from('clients')
      .update(updatePayload)
      .eq('id', clientId)
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (error) {
      console.error('Error updating client:', error)
      return apiError(error.message || 'Failed to update client', 500)
    }

    return apiSuccess({ success: true, client: data })
  } catch (err) {
    return handleRouteError(err)
  }
}
