import { NextRequest } from 'next/server'
import { z } from 'zod'
import { parseBody, apiSuccess, apiError, handleRouteError } from '@/lib/api'
import { resolveAuthAdmin } from '@/lib/api/auth'
import { getTemplateById, fillTemplate } from '@/lib/ata/contract-templates'

const GenerateSchema = z.object({
  templateId: z.string().min(1),
  projectId: z.string().uuid(),
})

/**
 * POST /api/contracts/generate
 * Fills a contract template with project + client + tenant data.
 * Requires auth.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const parsed = await parseBody(req, GenerateSchema)
    if (parsed.error) return parsed.error

    const { templateId, projectId } = parsed.data
    const { admin, tenantId } = auth

    // Look up template
    const template = getTemplateById(templateId)
    if (!template) {
      return apiError('Template not found', 404)
    }

    // Fetch project
    const { data: project, error: projectError } = await admin
      .from('projects')
      .select('id, name, start_date, end_date, budget, client_id')
      .eq('id', projectId)
      .eq('tenant_id', tenantId)
      .single()

    if (projectError || !project) {
      return apiError('Project not found', 404)
    }

    // Fetch client
    const { data: client } = await admin
      .from('clients')
      .select('id, name')
      .eq('id', project.client_id)
      .single()

    // Fetch tenant (contractor)
    const { data: tenant } = await admin
      .from('tenants')
      .select('id, company_name')
      .eq('id', tenantId)
      .single()

    // Build placeholder values
    const values: Record<string, string> = {
      project_name: project.name ?? '',
      client_name: client?.name ?? 'Bestallare',
      contractor_name: tenant?.company_name ?? 'Entreprenor',
      start_date: project.start_date ?? '',
      end_date: project.end_date ?? '',
      contract_sum: project.budget != null ? String(project.budget) : '0',
    }

    const filled = fillTemplate(template, values)

    return apiSuccess({
      template: filled,
      placeholdersUsed: values,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
