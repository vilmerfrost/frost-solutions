import type { SupabaseClient } from '@supabase/supabase-js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = SupabaseClient<any, any, any>

export const CASE_STATUSES = ['ny', 'pagaende', 'atgardad', 'godkand'] as const
export type CaseStatus = typeof CASE_STATUSES[number]

export const CASE_PRIORITIES = ['low', 'medium', 'high', 'critical'] as const
export type CasePriority = typeof CASE_PRIORITIES[number]

export const STATUS_LABELS: Record<CaseStatus, string> = {
  ny: 'Ny',
  pagaende: 'Pågående',
  atgardad: 'Åtgärdad',
  godkand: 'Godkänd',
}

export const PRIORITY_LABELS: Record<CasePriority, string> = {
  low: 'Låg',
  medium: 'Medium',
  high: 'Hög',
  critical: 'Kritisk',
}

const MANAGEMENT_ROLES: string[] = ['admin', 'Admin', 'supervisor']

export function canManageCases(role: string | null): boolean {
  return MANAGEMENT_ROLES.includes(role ?? '')
}

export function isValidTransition(from: CaseStatus, to: CaseStatus): boolean {
  const idx = CASE_STATUSES.indexOf(from)
  const toIdx = CASE_STATUSES.indexOf(to)
  return toIdx === idx + 1 || to === 'ny'
}

export async function createCaseFromChecklistItem(
  admin: AnySupabaseClient,
  opts: {
    tenantId: string
    projectId: string
    checklistItemId: string
    itemLabel: string
    createdBy: string
  }
): Promise<{ caseId: string } | { error: string }> {
  const { data: newCase, error } = await admin
    .from('cases')
    .insert({
      tenant_id: opts.tenantId,
      project_id: opts.projectId,
      title: `Avvikelse: ${opts.itemLabel}`,
      status: 'ny',
      priority: 'medium',
      created_by: opts.createdBy,
      source_type: 'checklist',
      source_id: opts.checklistItemId,
    })
    .select('id')
    .single()

  if (error || !newCase) {
    return { error: error?.message || 'Kunde inte skapa ärende' }
  }

  await admin
    .from('checklist_items')
    .update({ case_id: newCase.id })
    .eq('id', opts.checklistItemId)

  return { caseId: newCase.id }
}
