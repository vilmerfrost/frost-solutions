export type UserRole = 'admin' | 'Admin' | 'supervisor' | 'worker' | 'subcontractor'

const ADMIN_ROLES: string[] = ['admin', 'Admin']
const MANAGEMENT_ROLES: string[] = ['admin', 'Admin', 'supervisor']

export function canManageBinders(role: string | null): boolean {
  return MANAGEMENT_ROLES.includes(role ?? '')
}

export function canManageTemplates(role: string | null): boolean {
  return ADMIN_ROLES.includes(role ?? '')
}

export function canCreateChecklistTemplates(role: string | null): boolean {
  return MANAGEMENT_ROLES.includes(role ?? '')
}

export function canSignOffChecklist(role: string | null): boolean {
  return MANAGEMENT_ROLES.includes(role ?? '')
}

export function canManageCases(role: string | null): boolean {
  return MANAGEMENT_ROLES.includes(role ?? '')
}

export function canAccessTab(
  role: string | null,
  tabConfig: { restricted_roles?: string[] }
): boolean {
  const restricted = tabConfig.restricted_roles ?? []
  if (restricted.length === 0) return true
  return restricted.includes(role ?? '')
}
