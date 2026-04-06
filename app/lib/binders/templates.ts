import { SupabaseClient } from '@supabase/supabase-js'

export interface TabDefinition {
  name: string
  key: string
  icon: string
  restricted: boolean
}

export interface BinderTemplateStructure {
  tabs: TabDefinition[]
}

export const BSAB_DEFAULT_STRUCTURE: BinderTemplateStructure = {
  tabs: [
    { name: 'Ritningar', key: '01-ritningar', icon: 'blueprint', restricted: false },
    { name: 'Beskrivningar', key: '02-beskrivningar', icon: 'file-text', restricted: false },
    { name: 'Administrativt', key: '03-administrativt', icon: 'folder', restricted: false },
    { name: 'Avtal', key: '04-avtal', icon: 'file-lock', restricted: true },
    { name: 'Ekonomi', key: '05-ekonomi', icon: 'banknote', restricted: true },
    { name: 'Foton', key: '06-foton', icon: 'camera', restricted: false },
    { name: 'KMA', key: '07-kma', icon: 'shield-check', restricted: false },
  ],
}

export async function createBinderFromTemplate(
  admin: SupabaseClient,
  opts: {
    tenantId: string
    projectId: string
    templateId: string
    name: string
    createdBy: string
  }
): Promise<{ binderId: string } | { error: string }> {
  const { data: template, error: tErr } = await admin
    .from('binder_templates')
    .select('structure')
    .eq('id', opts.templateId)
    .eq('tenant_id', opts.tenantId)
    .single()

  if (tErr || !template) {
    return { error: 'Template not found' }
  }

  const structure = template.structure as BinderTemplateStructure

  const { data: existing } = await admin
    .from('binders')
    .select('sort_order')
    .eq('project_id', opts.projectId)
    .eq('tenant_id', opts.tenantId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0

  const { data: binder, error: bErr } = await admin
    .from('binders')
    .insert({
      tenant_id: opts.tenantId,
      project_id: opts.projectId,
      name: opts.name,
      template_id: opts.templateId,
      sort_order: nextOrder,
      created_by: opts.createdBy,
    })
    .select('id')
    .single()

  if (bErr || !binder) {
    return { error: bErr?.message || 'Failed to create binder' }
  }

  const tabRows = structure.tabs.map((tab, i) => ({
    tenant_id: opts.tenantId,
    binder_id: binder.id,
    name: tab.name,
    key: tab.key,
    sort_order: i,
    config: {
      icon: tab.icon,
      restricted_roles: tab.restricted ? ['admin'] : [],
    },
    created_by: opts.createdBy,
  }))

  const { error: tabErr } = await admin
    .from('binder_tabs')
    .insert(tabRows)

  if (tabErr) {
    await admin.from('binders').delete().eq('id', binder.id)
    return { error: tabErr.message || 'Failed to create tabs' }
  }

  return { binderId: binder.id }
}

export async function createEmptyBinder(
  admin: SupabaseClient,
  opts: {
    tenantId: string
    projectId: string
    name: string
    createdBy: string
  }
): Promise<{ binderId: string } | { error: string }> {
  const { data: existing } = await admin
    .from('binders')
    .select('sort_order')
    .eq('project_id', opts.projectId)
    .eq('tenant_id', opts.tenantId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0

  const { data: binder, error } = await admin
    .from('binders')
    .insert({
      tenant_id: opts.tenantId,
      project_id: opts.projectId,
      name: opts.name,
      template_id: null,
      sort_order: nextOrder,
      created_by: opts.createdBy,
    })
    .select('id')
    .single()

  if (error || !binder) {
    return { error: error?.message || 'Failed to create binder' }
  }

  return { binderId: binder.id }
}
