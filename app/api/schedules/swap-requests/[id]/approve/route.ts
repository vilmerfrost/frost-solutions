import { NextRequest } from 'next/server'
import { resolveAuthAdmin, apiSuccess, apiError, handleRouteError } from '@/lib/api'

/**
 * POST /api/schedules/swap-requests/[id]/approve
 * Manager approves a swap request, swapping the employee assignments.
 * The [id] here is the swap_request id stored in metadata.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { id: swapRequestId } = await params

    // Find the schedule slot that contains this swap request
    // We search through schedule_slots metadata for the swap request id
    const { data: slots, error: searchErr } = await auth.admin
      .from('schedule_slots')
      .select('*')
      .eq('tenant_id', auth.tenantId)
      .not('metadata', 'is', null)

    if (searchErr) {
      return apiError('Failed to search schedule slots', 500)
    }

    // Find the slot containing this swap request
    let targetSlot: (typeof slots)[number] | null = null
    let swapRequest: Record<string, unknown> | null = null

    for (const slot of slots ?? []) {
      const meta = (slot.metadata as Record<string, unknown>) ?? {}
      const requests = (meta.swap_requests as Array<Record<string, unknown>>) ?? []
      const found = requests.find((sr) => sr.id === swapRequestId)
      if (found) {
        targetSlot = slot
        swapRequest = found
        break
      }
    }

    if (!targetSlot || !swapRequest) {
      return apiError('Swap request not found', 404)
    }

    if (swapRequest.status !== 'pending') {
      return apiError(`Swap request is already ${swapRequest.status}`, 409)
    }

    const originalEmployeeId = targetSlot.employee_id
    const targetEmployeeId = swapRequest.target_employee_id as string

    // Update the schedule slot to assign the target employee
    const { error: swapErr } = await auth.admin
      .from('schedule_slots')
      .update({ employee_id: targetEmployeeId })
      .eq('id', targetSlot.id)

    if (swapErr) {
      return apiError('Failed to swap employee assignment', 500)
    }

    // Update swap request status in metadata
    const meta = (targetSlot.metadata as Record<string, unknown>) ?? {}
    const requests = (meta.swap_requests as Array<Record<string, unknown>>) ?? []
    const updatedRequests = requests.map((sr) => {
      if (sr.id === swapRequestId) {
        return {
          ...sr,
          status: 'approved',
          approved_by: auth.user.id,
          approved_at: new Date().toISOString(),
          original_employee_id: originalEmployeeId,
        }
      }
      return sr
    })

    await auth.admin
      .from('schedule_slots')
      .update({
        metadata: { ...meta, swap_requests: updatedRequests },
      })
      .eq('id', targetSlot.id)

    // Notify both employees
    try {
      const { data: employees } = await auth.admin
        .from('employees')
        .select('id, auth_user_id, full_name')
        .eq('tenant_id', auth.tenantId)
        .in('id', [originalEmployeeId, targetEmployeeId])

      for (const emp of employees ?? []) {
        if (!emp.auth_user_id) continue
        await auth.admin.from('notifications').insert({
          tenant_id: auth.tenantId,
          created_by: auth.user.id,
          recipient_id: emp.auth_user_id,
          recipient_employee_id: emp.id,
          type: 'info',
          title: 'Passbyte godkant',
          message: `Ett passbyte har godkants for ${new Date(targetSlot.start_time).toLocaleDateString('sv-SE')}`,
          link: '/calendar',
          read: false,
        })
      }
    } catch {
      // Notification failure is not critical
    }

    return apiSuccess({
      swap_request_id: swapRequestId,
      schedule_id: targetSlot.id,
      original_employee_id: originalEmployeeId,
      new_employee_id: targetEmployeeId,
      status: 'approved',
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
