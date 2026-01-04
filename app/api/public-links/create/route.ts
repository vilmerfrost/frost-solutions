import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getTenantId } from '@/lib/serverTenant'
import { getFeatureFlag } from '@/lib/featureFlags'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'

/**
 * POST /api/public-links/create
 * Skapar publik länk för delning av offert/ÄTA/faktura
 */
export async function POST(req: Request) {
 try {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const tenantId = await getTenantId()
  if (!tenantId) {
   return NextResponse.json({ error: 'No tenant found' }, { status: 400 })
  }

  // Kontrollera feature flag
  const portalEnabled = await getFeatureFlag(tenantId, 'enable_customer_portal')
  if (!portalEnabled) {
   return NextResponse.json(
    { error: 'Customer portal is not enabled for this tenant' },
    { status: 403 }
   )
  }

  const adminSupabase = createAdminClient(
   process.env.NEXT_PUBLIC_SUPABASE_URL!,
   process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Kontrollera admin-access
  const { data: employeeData } = await adminSupabase
   .from('employees')
   .select('id, role')
   .eq('auth_user_id', user.id)
   .eq('tenant_id', tenantId)
   .single()

  if (!employeeData || employeeData.role !== 'admin') {
   return NextResponse.json(
    { error: 'Admin access required' },
    { status: 403 }
   )
  }

  const body = await req.json()
  const {
   resource_type,
   resource_id,
   password,
   expires_at,
   max_views,
  } = body

  if (!resource_type || !resource_id) {
   return NextResponse.json(
    { error: 'resource_type and resource_id are required' },
    { status: 400 }
   )
  }

  const validResourceTypes = ['quote', 'invoice', 'ata', 'project', 'rot_application']
  if (!validResourceTypes.includes(resource_type)) {
   return NextResponse.json(
    { error: `resource_type must be one of: ${validResourceTypes.join(', ')}` },
    { status: 400 }
   )
  }

  // Verifiera att resursen finns och tillhör tenant
  const tableMap: Record<string, string> = {
   quote: 'quotes',
   invoice: 'invoices',
   ata: 'rot_applications',
   project: 'projects',
   rot_application: 'rot_applications',
  }

  const tableName = tableMap[resource_type]
  const { data: resource } = await adminSupabase
   .from(tableName)
   .select('id, tenant_id')
   .eq('id', resource_id)
   .eq('tenant_id', tenantId)
   .single()

  if (!resource) {
   return NextResponse.json(
    { error: 'Resource not found' },
    { status: 404 }
   )
  }

  // Generera access token
  const accessToken = randomBytes(32).toString('hex')

  // Hash lösenord om det finns
  let passwordHash = null
  if (password) {
   passwordHash = await bcrypt.hash(password, 10)
  }

  // Skapa public link
  const { data: publicLink, error: linkError } = await adminSupabase
   .from('public_links')
   .insert({
    tenant_id: tenantId,
    resource_type,
    resource_id,
    access_token: accessToken,
    password_hash: passwordHash,
    expires_at: expires_at || null,
    max_views: max_views || null,
    created_by: employeeData.id,
   })
   .select()
   .single()

  if (linkError) {
   console.error('Error creating public link:', linkError)
   return NextResponse.json(
    { error: 'Failed to create public link', details: linkError.message },
    { status: 500 }
   )
  }

  const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL}/public/${accessToken}`

  // Logga audit event
  try {
   await adminSupabase.rpc('append_audit_event', {
    p_tenant_id: tenantId,
    p_table_name: 'public_links',
    p_record_id: publicLink.id,
    p_action: 'create',
    p_user_id: user.id,
    p_employee_id: employeeData.id,
    p_new_values: { resource_type, resource_id },
   })
  } catch (auditError) {
   console.error('Error logging audit event:', auditError)
  }

  return NextResponse.json(
   {
    id: publicLink.id,
    access_token: accessToken,
    public_url: publicUrl,
    expires_at: publicLink.expires_at,
    max_views: publicLink.max_views,
    created_at: publicLink.created_at,
   },
   { status: 201 }
  )
 } catch (error: any) {
  console.error('Error in POST /api/public-links/create:', error)
  return NextResponse.json(
   { error: 'Internal server error', details: error.message },
   { status: 500 }
  )
 }
}

