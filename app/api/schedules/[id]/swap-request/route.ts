import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuthAdmin, apiSuccess, apiError, handleRouteError } from '@/lib/api'

const swapRequestSchema = z.object({
  targetEmployeeId: z.string().uuid(),
  reason: z.string().max(500).optional(),
})

/**
 * POST /api/schedules/[id]/swap-request
 * Request to swap a shift with another employee.
 * Stores swap request in the schedule's metadata JSONB.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { id: scheduleId } = await params

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return apiError('Invalid JSON body', 400)
    }

    const parsed = swapRequestSchema.safeParse(body)
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? 'Invalid payload', 400)
    }

    const { targetEmployeeId, reason } = parsed.data

    // Fetch the schedule slot
    const { data: slot, error: fetchErr } = await auth.admin
      .from('schedule_slots')
      .select('*')
      .eq('id', scheduleId)
      .eq('tenant_id', auth.tenantId)
      .single()

    if (fetchErr || !slot) {
      return apiError('Schedule slot not found', 404)
    }

    // Verify target employee exists
    const { data: targetEmployee } = await auth.admin
      .from('employees')
      .select('id, full_name')
      .eq('id', targetEmployeeId)
      .eq('tenant_id', auth.tenantId)
      .single()

    if (!targetEmployee) {
      return apiError('Target employee not found', 404)
    }

    // Store swap request in metadata
    const existingMeta = (slot.metadata as Record<string, unknown>) ?? {}
    const swapRequests = (existingMeta.swap_requests as Array<Record<string, unknown>>) ?? []

    // Prevent duplicate pending requests
    const hasPending = swapRequests.some(
      (sr) => sr.target_employee_id === targetEmployeeId && sr.status === 'pending'
    )
    if (hasPending) {
      return apiError('A pending swap request already exists for this employee', 409)
    }

    const swapRequest = {
      id: crypto.randomUUID(),
      requester_id: auth.user.id,
      target_employee_id: targetEmployeeId,
      target_employee_name: targetEmployee.full_name,
      reason: reason ?? null,
      status: 'pending',
      created_at: new Date().toISOString(),
    }

    swapRequests.push(swapRequest)

    const { error: updateErr } = await auth.admin
      .from('schedule_slots')
      .update({
        metadata: { ...existingMeta, swap_requests: swapRequests },
      })
      .eq('id', scheduleId)

    if (updateErr) {
      return apiError('Failed to create swap request', 500)
    }

    return apiSuccess(swapRequest, 201)
  } catch (error) {
    return handleRouteError(error)
  }
}

/**
 * GET /api/schedules/[id]/swap-request
 * List swap requests for this schedule slot.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { id: scheduleId } = await params

    const { data: slot, error: fetchErr } = await auth.admin
      .from('schedule_slots')
      .select('metadata')
      .eq('id', scheduleId)
      .eq('tenant_id', auth.tenantId)
      .single()

    if (fetchErr || !slot) {
      return apiError('Schedule slot not found', 404)
    }

    const meta = (slot.metadata as Record<string, unknown>) ?? {}
    const swapRequests = (meta.swap_requests as Array<Record<string, unknown>>) ?? []

    return apiSuccess(swapRequests)
  } catch (error) {
    return handleRouteError(error)
  }
}
