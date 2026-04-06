import type { SupabaseClient } from '@supabase/supabase-js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = SupabaseClient<any, any, any>

export interface ChecklistItemDef {
  label: string
  type: 'yes_no' | 'measurement' | 'dropdown' | 'text'
  config?: Record<string, unknown>
}

export interface ChecklistSection {
  name: string
  items: ChecklistItemDef[]
}

export interface ChecklistTemplateStructure {
  sections: ChecklistSection[]
}

export async function instantiateChecklist(
  admin: AnySupabaseClient,
  opts: {
    tenantId: string
    projectId: string
    templateId: string
    assignedTo?: string
    binderTabId?: string
    createdBy: string
  }
): Promise<{ checklistId: string } | { error: string }> {
  const { data: template, error: tErr } = await admin
    .from('checklist_templates')
    .select('name, structure')
    .eq('id', opts.templateId)
    .eq('tenant_id', opts.tenantId)
    .single()

  if (tErr || !template) {
    return { error: 'Mall hittades inte' }
  }

  const structure = template.structure as ChecklistTemplateStructure

  const { data: checklist, error: cErr } = await admin
    .from('checklists')
    .insert({
      tenant_id: opts.tenantId,
      project_id: opts.projectId,
      binder_tab_id: opts.binderTabId || null,
      template_id: opts.templateId,
      name: template.name,
      status: 'draft',
      assigned_to: opts.assignedTo || null,
      created_by: opts.createdBy,
    })
    .select('id')
    .single()

  if (cErr || !checklist) {
    return { error: cErr?.message || 'Kunde inte skapa egenkontroll' }
  }

  let sortOrder = 0
  const itemRows = structure.sections.flatMap((section) =>
    section.items.map((item) => ({
      checklist_id: checklist.id,
      section: section.name,
      sort_order: sortOrder++,
      label: item.label,
      item_type: item.type,
      config: item.config || {},
      status: 'pending',
    }))
  )

  if (itemRows.length > 0) {
    const { error: iErr } = await admin
      .from('checklist_items')
      .insert(itemRows)

    if (iErr) {
      await admin.from('checklists').delete().eq('id', checklist.id)
      return { error: iErr.message || 'Kunde inte skapa kontrollpunkter' }
    }
  }

  return { checklistId: checklist.id }
}
