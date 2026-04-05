import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuthAdmin, parseBody, apiSuccess, apiError, handleRouteError } from '@/lib/api'

const CheckInSchema = z.object({
  person_name: z.string().min(1),
  person_id_last4: z.string().max(4).optional(),
  employee_id: z.string().uuid().optional(),
  subcontractor_id: z.string().uuid().optional(),
  check_in_method: z.enum(['manual', 'qr', 'nfc', 'gps']).default('manual'),
  notes: z.string().optional(),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { id: projectId } = await params

    // Get today's attendance (checked in today, regardless of checkout status)
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const { data, error } = await auth.admin
      .from('site_attendance')
      .select('*')
      .eq('project_id', projectId)
      .eq('tenant_id', auth.tenantId)
      .gte('checked_in_at', todayStart.toISOString())
      .order('checked_in_at', { ascending: false })

    if (error) return apiError('Failed to fetch attendance', 500)

    return apiSuccess(data ?? [])
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { id: projectId } = await params
    const parsed = await parseBody(req, CheckInSchema)
    if (parsed.error) return parsed.error

    const { data, error } = await auth.admin
      .from('site_attendance')
      .insert({
        tenant_id: auth.tenantId,
        project_id: projectId,
        person_name: parsed.data.person_name,
        person_id_last4: parsed.data.person_id_last4 ?? null,
        employee_id: parsed.data.employee_id ?? null,
        subcontractor_id: parsed.data.subcontractor_id ?? null,
        check_in_method: parsed.data.check_in_method,
        notes: parsed.data.notes ?? null,
        checked_in_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) return apiError(error.message || 'Failed to check in', 500)

    return apiSuccess(data, 201)
  } catch (error) {
    return handleRouteError(error)
  }
}
