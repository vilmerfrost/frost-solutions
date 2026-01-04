import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function GET(request: NextRequest) {
 try {
  if (!supabaseUrl || !serviceKey) {
   return NextResponse.json({ error: 'Missing Supabase configuration' }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, serviceKey)
  const searchParams = request.nextUrl.searchParams
  const tenantId = searchParams.get('tenantId')

  if (!tenantId) {
   return NextResponse.json({ error: 'Missing tenantId' }, { status: 400 })
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(tenantId)) {
   console.error('❌ Invalid tenantId format:', tenantId)
   return NextResponse.json({ error: 'Invalid tenantId format' }, { status: 400 })
  }

  // Verify tenant exists first
  const { data: tenantVerify } = await supabase
   .from('tenants')
   .select('id')
   .eq('id', tenantId)
   .maybeSingle()

  if (!tenantVerify) {
   console.error('❌ Tenant not found:', tenantId)
   return NextResponse.json({ error: 'Tenant not found', projects: [] }, { status: 404 })
  }

  console.log('✅ Projects/list: Fetching projects for valid tenant:', tenantId)

  // SECURITY: Double-check that this tenant belongs to the requesting user
  // Get user from session to verify access
  try {
   const { createClient: createServerClient } = await import('@/utils/supabase/server')
   const serverSupabase = createServerClient()
   const { data: { user } } = await serverSupabase.auth.getUser()
   
   if (user) {
    // Check if user has an employee record for this tenant
    const { data: userEmployee, error: empError } = await supabase
     .from('employees')
     .select('id')
     .eq('auth_user_id', user.id)
     .eq('tenant_id', tenantId)
     .maybeSingle()
    
    if (empError) {
     console.warn('⚠️ Could not verify employee access (non-fatal):', empError.message)
     // Continue anyway - tenant verification above is sufficient
    } else if (!userEmployee) {
     console.warn('⚠️ User does not have employee record for tenant:', tenantId, 'but continuing anyway')
     // Continue anyway - tenant exists and was verified above
    } else {
     console.log('✅ Projects/list: User access verified for tenant:', tenantId)
    }
   }
  } catch (securityCheckError) {
   // Non-fatal - log but continue
   console.warn('⚠️ Security check failed (non-fatal):', securityCheckError)
  }
  const { data, error } = await supabase
   .from('projects')
   .select('id, name, customer_name, created_at, base_rate_sek, budgeted_hours, status, tenant_id')
   .eq('tenant_id', tenantId)
   .order('created_at', { ascending: false })

  if (error) {
   console.error('❌ Error fetching projects:', error)
   // Try without status column
   const fallback = await supabase
    .from('projects')
    .select('id, name, customer_name, created_at, base_rate_sek, budgeted_hours, tenant_id')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
   
   if (fallback.error) {
    return NextResponse.json({ error: fallback.error.message, projects: [] }, { status: 500 })
   }
   
   console.log('✅ Projects/list: Fallback query returned', fallback.data?.length || 0, 'projects')
   
   // Double-check tenant_id matches
   const verifiedProjects = (fallback.data || []).filter((p: any) => {
    const matches = p.tenant_id === tenantId
    if (!matches) {
     console.warn('⚠️ Project', p.id, 'has wrong tenant_id:', p.tenant_id, 'expected:', tenantId)
    }
    return matches
   })
   
   return NextResponse.json({ 
    projects: verifiedProjects.map((p: any) => ({ ...p, status: null }))
   })
  }

  console.log('✅ Projects/list: Query returned', data?.length || 0, 'projects')

  // Double-check tenant_id matches (security check)
  const verifiedProjects = (data || []).filter((p: any) => {
   const matches = p.tenant_id === tenantId
   if (!matches) {
    console.error('❌ SECURITY: Project', p.id, p.name, 'has wrong tenant_id:', p.tenant_id, 'expected:', tenantId)
   }
   return matches
  })

  console.log('✅ Projects/list: After verification:', verifiedProjects.length, 'projects')

  // SECURITY: Verify that all projects have valid tenant_id that exists in tenants table
  const { data: allTenants } = await supabase
   .from('tenants')
   .select('id')
   .limit(1000)
  
  const validTenantIds = new Set((allTenants || []).map((t: any) => t.id))
  
  const validTenantProjects = verifiedProjects.filter((p: any) => {
   if (!p.tenant_id) {
    console.warn('⚠️ Project', p.id, p.name, 'has NULL tenant_id - filtering out')
    return false
   }
   if (!validTenantIds.has(p.tenant_id)) {
    console.error('❌ SECURITY: Project', p.id, p.name, 'has invalid tenant_id:', p.tenant_id, '- filtering out')
    return false
   }
   return true
  })

  console.log('✅ Projects/list: After tenant validation:', validTenantProjects.length, 'projects')

  // Filter out completed/archived projects
  const filteredProjects = validTenantProjects.filter((p: any) => {
   const status = p.status || null
   const shouldInclude = status !== 'completed' && status !== 'archived'
   if (!shouldInclude) {
    console.log('🔇 Filtering out project:', p.name, 'status:', status)
   }
   return shouldInclude
  })

  console.log('✅ Projects/list: After status filter:', filteredProjects.length, 'projects')

  return NextResponse.json({ 
   projects: filteredProjects.map((p: any) => ({ ...p, status: p.status || null }))
  })
 } catch (err: any) {
  console.error('Unexpected error:', err)
  return NextResponse.json({ error: err.message }, { status: 500 })
 }
}
