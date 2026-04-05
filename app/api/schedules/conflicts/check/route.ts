import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuthAdmin, apiSuccess, apiError, handleRouteError } from '@/lib/api'
import { findConflicts } from '@/lib/scheduling/conflicts'

const ConflictCheckSchema = z.object({
  employee_id: z.string().uuid(),
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
  exclude_schedule_id: z.string().uuid().optional(),
})

export async function POST(req: NextRequest) {
  try {
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return apiError('Invalid JSON body', 400)
    }

    let parsed: z.infer<typeof ConflictCheckSchema>
    try {
      parsed = ConflictCheckSchema.parse(body)
    } catch (e) {
      if (e instanceof z.ZodError) {
        return apiError(e.issues[0]?.message ?? 'Invalid payload', 400)
      }
      throw e
    }

    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const result = await findConflicts(
      auth.tenantId,
      parsed.employee_id,
      parsed.start_date,
      parsed.end_date,
      parsed.exclude_schedule_id
    )

    return apiSuccess(result)
  } catch (error) {
    return handleRouteError(error)
  }
}
