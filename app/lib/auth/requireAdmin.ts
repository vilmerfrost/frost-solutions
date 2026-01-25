// app/lib/auth/requireAdmin.ts
// Server-side admin authentication check

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { redirect } from 'next/navigation'

export interface AdminAuthResult {
  user: {
    id: string
    email?: string
  }
  tenantId: string
  isAdmin: true
}

/**
 * Server-side check that user is authenticated and is an admin
 * Redirects to login or shows access denied if not authorized
 * 
 * @returns AdminAuthResult with user info, tenant ID, and admin confirmation
 * @throws Redirects to login if not authenticated
 * @throws Returns null if authenticated but not admin (caller should handle)
 */
export async function requireAdmin(): Promise<AdminAuthResult | null> {
  const supabase = createClient()
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/login?redirect=/admin')
  }
  
  // Get tenant from JWT claim or employee record
  const admin = createAdminClient()
  
  // First try JWT claim
  let tenantId = user.app_metadata?.tenant_id as string | undefined
  
  // Fallback: lookup from employees table
  if (!tenantId) {
    const { data: employee } = await admin
      .from('employees')
      .select('tenant_id, role')
      .eq('auth_user_id', user.id)
      .maybeSingle()
    
    if (employee) {
      tenantId = employee.tenant_id
    }
  }
  
  if (!tenantId) {
    // No tenant - redirect to onboarding
    redirect('/onboarding')
  }
  
  // Check if user is admin
  const { data: employeeData } = await admin
    .from('employees')
    .select('role')
    .eq('auth_user_id', user.id)
    .eq('tenant_id', tenantId)
    .maybeSingle()
  
  const role = employeeData?.role?.toLowerCase()
  const isAdmin = role === 'admin' || role === 'super_admin'
  
  if (!isAdmin) {
    // User is authenticated but not admin
    return null
  }
  
  return {
    user: {
      id: user.id,
      email: user.email,
    },
    tenantId,
    isAdmin: true,
  }
}
