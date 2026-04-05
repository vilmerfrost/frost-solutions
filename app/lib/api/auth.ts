import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { apiError } from './response'

type AuthResult =
  | { user: { id: string; email: string; app_metadata: Record<string, unknown> }; tenantId: string; error: null }
  | { user: null; tenantId: null; error: ReturnType<typeof apiError> }

export async function resolveAuth(): Promise<AuthResult> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return { user: null, tenantId: null, error: apiError('Unauthorized', 401) }
  }

  const tenantId = (user.app_metadata as Record<string, string>)?.tenant_id
  if (!tenantId) {
    return { user: null, tenantId: null, error: apiError('No tenant associated with user', 403) }
  }

  return { user: { id: user.id, email: user.email ?? '', app_metadata: user.app_metadata ?? {} }, tenantId, error: null }
}

type AuthAdminResult =
  | { user: { id: string; email: string; app_metadata: Record<string, unknown> }; tenantId: string; admin: ReturnType<typeof createAdminClient>; error: null }
  | { user: null; tenantId: null; error: ReturnType<typeof apiError> }

export async function resolveAuthAdmin(): Promise<AuthAdminResult> {
  const result = await resolveAuth()
  if (result.error) {
    return { user: null, tenantId: null, error: result.error }
  }

  const admin = createAdminClient()
  return { user: result.user, tenantId: result.tenantId, admin, error: null }
}
