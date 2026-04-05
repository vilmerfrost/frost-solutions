import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuthAdmin, apiSuccess, apiError, handleRouteError } from '@/lib/api'
import { RISK_TEMPLATES } from '@/lib/safety/risk-templates'

const CreateSchema = z.object({
  template_id: z.string().min(1),
  project_id: z.string().uuid(),
  title: z.string().optional(),
})

export async function GET() {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    // Return built-in templates plus any saved tenant-specific assessments
    const { data: saved, error } = await auth.admin
      .from('risk_assessments')
      .select('*')
      .eq('tenant_id', auth.tenantId)
      .order('created_at', { ascending: false })

    if (error) {
      // Table may not exist yet — return templates only
      return apiSuccess({ templates: RISK_TEMPLATES, assessments: [] })
    }

    return apiSuccess({ templates: RISK_TEMPLATES, assessments: saved ?? [] })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return apiError('Invalid JSON body', 400)
    }

    let parsed: z.infer<typeof CreateSchema>
    try {
      parsed = CreateSchema.parse(body)
    } catch (e) {
      if (e instanceof z.ZodError) {
        return apiError(e.issues[0]?.message ?? 'Invalid payload', 400)
      }
      throw e
    }

    const template = RISK_TEMPLATES.find((t) => t.id === parsed.template_id)
    if (!template) return apiError('Template not found', 404)

    const { data: employee } = await auth.admin
      .from('employees')
      .select('id')
      .eq('auth_user_id', auth.user.id)
      .eq('tenant_id', auth.tenantId)
      .maybeSingle()

    const { data, error } = await auth.admin
      .from('risk_assessments')
      .insert({
        tenant_id: auth.tenantId,
        project_id: parsed.project_id,
        template_id: template.id,
        title: parsed.title || template.name,
        work_type: template.workType,
        risks: template.risks,
        created_by: employee?.id ?? null,
      })
      .select()
      .single()

    if (error) return apiError(error.message || 'Failed to create risk assessment', 500)

    return apiSuccess(data, 201)
  } catch (error) {
    return handleRouteError(error)
  }
}
