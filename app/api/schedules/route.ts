// app/api/schedules/route.ts
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuthAdmin, apiSuccess, apiError, handleRouteError } from '@/lib/api'
import { createScheduleSchema } from '@/lib/validation/scheduling'
import { findConflicts } from '@/lib/scheduling/conflicts'

export async function POST(req: NextRequest) {
  try {
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return apiError('Invalid JSON body', 400)
    }

    let parsed: z.infer<typeof createScheduleSchema>
    try {
      parsed = createScheduleSchema.parse(body)
    } catch (e) {
      if (e instanceof z.ZodError) {
        return apiError(e.issues[0]?.message ?? 'Invalid payload', 400)
      }
      throw e
    }

    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const start = new Date(parsed.start_time)
    const end = new Date(parsed.end_time)

    if (!(start < end)) return apiError('end_time must be greater than start_time', 400)
    if ((+end - +start) / 36e5 > 12) return apiError('duration must be <= 12 hours', 400)

    // Soft conflict check for DX (DB EXCLUDE handles races)
    const conf = await findConflicts(auth.tenantId, parsed.employee_id, parsed.start_time, parsed.end_time)
    if (conf.hasConflict) {
      return apiError('Conflict detected', 409, { conflicts: conf.conflicts as unknown as Record<string, unknown> })
    }

    const insertPayload: Record<string, unknown> = {
      tenant_id: auth.tenantId,
      employee_id: parsed.employee_id,
      project_id: parsed.project_id,
      start_time: parsed.start_time,
      end_time: parsed.end_time,
      status: parsed.status ?? 'scheduled',
      notes: parsed.notes ?? null,
      created_by: auth.user.id
    }

    // Add optional fields if provided
    if (parsed.shift_type) {
      insertPayload.shift_type = parsed.shift_type
    }
    if (parsed.transport_time_minutes !== undefined) {
      insertPayload.transport_time_minutes = parsed.transport_time_minutes
    }

    const { data, error } = await auth.admin
      .from('schedule_slots')
      .insert(insertPayload)
      .select()
      .single()

    if (error) {
      const msg = error.message || 'Failed to create schedule'
      const status = msg.includes('prevent_double_booking') ? 409 : 500
      return apiError(msg, status)
    }

    // Send notification to the employee about the new schedule
    try {
      const { data: employeeData } = await auth.admin
        .from('employees')
        .select('auth_user_id, full_name')
        .eq('id', parsed.employee_id)
        .eq('tenant_id', auth.tenantId)
        .maybeSingle()

      if (employeeData?.auth_user_id) {
        const { data: projectData } = await auth.admin
          .from('projects')
          .select('name')
          .eq('id', parsed.project_id)
          .eq('tenant_id', auth.tenantId)
          .maybeSingle()

        const projectName = projectData?.name || 'Ett projekt'
        const startDate = new Date(parsed.start_time).toLocaleDateString('sv-SE', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        })

        await auth.admin
          .from('notifications')
          .insert({
            tenant_id: auth.tenantId,
            created_by: auth.user.id,
            recipient_id: employeeData.auth_user_id,
            recipient_employee_id: parsed.employee_id,
            type: 'info',
            title: 'Du har schemalagts pa ett pass',
            message: `Du har schemalagts pa ${projectName} den ${startDate}`,
            link: `/calendar`,
            read: false,
          })
      }
    } catch (notifError) {
      console.error('Failed to send notification:', notifError)
    }

    return apiSuccess(data, 201)
  } catch (e) {
    return handleRouteError(e)
  }
}

export async function GET(req: NextRequest) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { searchParams } = req.nextUrl

    const employee_id = searchParams.get('employee_id')
    const project_id = searchParams.get('project_id')
    const start_date = searchParams.get('start_date')
    const end_date = searchParams.get('end_date')
    const status = searchParams.get('status')

    let q = auth.admin.from('schedule_slots').select('*').eq('tenant_id', auth.tenantId)

    if (employee_id) q = q.eq('employee_id', employee_id)
    if (project_id) q = q.eq('project_id', project_id)
    if (status) q = q.eq('status', status)
    if (start_date) q = q.gte('start_time', `${start_date}T00:00:00Z`)
    if (end_date) q = q.lte('end_time', `${end_date}T23:59:59Z`)

    const { data, error } = await q.order('start_time', { ascending: true })

    if (error) {
      return apiError(error.message || 'Failed to fetch schedules', 500)
    }

    return apiSuccess(data ?? [])
  } catch (e) {
    return handleRouteError(e)
  }
}
