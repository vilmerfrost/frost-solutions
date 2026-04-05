// app/api/work-orders/route.ts
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuthAdmin, apiSuccess, apiError, handleRouteError } from '@/lib/api'
import { CreateWorkOrderSchema } from '@/lib/schemas/work-order'
import { getUserRole, getWorkOrderNumber } from '@/lib/work-orders/helpers'

export async function POST(req: NextRequest) {
  try {
    const role = await getUserRole()

    // Both admin & manager can create
    if (!['admin', 'manager'].includes(role)) {
      return apiError('Endast administratorer/chefer far skapa arbetsorder.', 403)
    }

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return apiError('Invalid JSON body', 400)
    }

    let parsed: z.infer<typeof CreateWorkOrderSchema>
    try {
      parsed = CreateWorkOrderSchema.parse(body)
    } catch (e) {
      if (e instanceof z.ZodError) {
        return apiError(e.issues[0]?.message ?? 'Ogiltig indata.', 400)
      }
      throw e
    }

    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    let number: string
    try {
      number = await getWorkOrderNumber(auth.tenantId)
    } catch (error) {
      console.error('Failed to generate work order number:', error)
      const year = new Date().getFullYear()
      const timestamp = Date.now().toString().slice(-6)
      number = `WO-${year}-${timestamp}`
      console.warn('Using fallback work order number:', number)
    }

    const { data, error } = await auth.admin
      .from('work_orders')
      .insert({
        tenant_id: auth.tenantId,
        number,
        title: parsed.title,
        description: parsed.description ?? null,
        project_id: parsed.project_id ?? null,
        assigned_to: parsed.assigned_to ?? null,
        created_by: auth.user.id,
        status: 'new',
        priority: parsed.priority ?? 'medium',
        scheduled_date: parsed.scheduled_date ?? null,
        scheduled_start_time: parsed.scheduled_start_time ?? null,
        scheduled_end_time: parsed.scheduled_end_time ?? null
      })
      .select('*')
      .single()

    // Send notification if assigned to someone
    if (!error && data && parsed.assigned_to) {
      try {
        const { data: employee } = await auth.admin
          .from('employees')
          .select('auth_user_id, full_name')
          .eq('id', parsed.assigned_to)
          .eq('tenant_id', auth.tenantId)
          .single()

        if (employee?.auth_user_id) {
          await auth.admin
            .from('notifications')
            .insert({
              tenant_id: auth.tenantId,
              recipient_id: employee.auth_user_id,
              type: 'info',
              title: 'Ny arbetsorder tilldelad',
              message: `Du har blivit tilldelad arbetsordern "${parsed.title}" (#${number})`,
              link: `/work-orders/${data.id}`,
              created_by: auth.user.id,
            })
        }
      } catch (notifError) {
        console.error('Failed to send notification:', notifError)
      }
    }

    if (error) {
      return apiError(error.message || 'Failed to create work order', 500)
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
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const project_id = searchParams.get('project_id')
    const assigned_to = searchParams.get('assigned_to')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0)

    let q = auth.admin
      .from('work_orders')
      .select('*')
      .eq('tenant_id', auth.tenantId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) q = q.eq('status', status)
    if (priority) q = q.eq('priority', priority)
    if (project_id) q = q.eq('project_id', project_id)
    if (assigned_to) q = q.eq('assigned_to', assigned_to)

    const { data, error } = await q

    if (error) {
      console.error('Error fetching work orders:', error)
      return apiError(error.message || 'Failed to fetch work orders', 500)
    }

    return apiSuccess(data ?? [])
  } catch (e) {
    return handleRouteError(e)
  }
}
