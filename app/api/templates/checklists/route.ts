import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuthAdmin, parseBody, apiSuccess, apiError, handleRouteError } from '@/lib/api'
import { canCreateChecklistTemplates } from '@/lib/binders/permissions'

export async function GET(request: NextRequest) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const url = new URL(request.url)
    const category = url.searchParams.get('category')

    let query = auth.admin
      .from('checklist_templates')
      .select('id, name, description, category, structure, created_at')
      .eq('tenant_id', auth.tenantId)
      .order('category', { ascending: true })

    if (category) query = query.eq('category', category)

    const { data, error } = await query
    if (error) return apiError(error.message, 500)
    return apiSuccess({ templates: data || [] })
  } catch (err) {
    return handleRouteError(err)
  }
}

const CreateChecklistTemplateSchema = z.object({
  name: z.string().min(1, 'Namn krävs'),
  description: z.string().optional(),
  category: z.string().optional(),
  structure: z.object({
    sections: z.array(z.object({
      name: z.string().min(1),
      items: z.array(z.object({
        label: z.string().min(1),
        type: z.enum(['yes_no', 'measurement', 'dropdown', 'text']),
        config: z.record(z.string(), z.unknown()).optional(),
      })),
    })),
  }),
})

export async function POST(request: NextRequest) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { data: emp } = await auth.admin
      .from('employees')
      .select('id, role')
      .eq('auth_user_id', auth.user.id)
      .eq('tenant_id', auth.tenantId)
      .single()

    if (!canCreateChecklistTemplates(emp?.role ?? null)) {
      return apiError('Behörighet saknas', 403)
    }

    const body = await parseBody(request, CreateChecklistTemplateSchema)
    if (body.error) return body.error

    const { data, error } = await auth.admin
      .from('checklist_templates')
      .insert({
        tenant_id: auth.tenantId,
        name: body.data.name,
        description: body.data.description || null,
        category: body.data.category || null,
        structure: body.data.structure,
        created_by: emp?.id || auth.user.id,
      })
      .select()
      .single()

    if (error) return apiError(error.message, 500)
    return apiSuccess({ template: data }, 201)
  } catch (err) {
    return handleRouteError(err)
  }
}
