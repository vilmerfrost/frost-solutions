import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/utils/supabase/server'

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function PATCH(
 request: NextRequest,
 { params }: { params: Promise<{ id: string }> }
) {
 try {
  if (!supabaseUrl || !serviceKey) {
   return NextResponse.json(
    { error: 'Missing Supabase configuration' },
    { status: 500 }
   )
  }

  const { id: clientId } = await params
  const body = await request.json()
  const { tenantId, name, email, address, orgNumber, phone } = body

  if (!tenantId || !name) {
   return NextResponse.json(
    { error: 'Missing required fields: tenantId, name' },
    { status: 400 }
   )
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(tenantId) || !uuidRegex.test(clientId)) {
   return NextResponse.json(
    { error: 'Invalid UUID format' },
    { status: 400 }
   )
  }

  // Get user from session to verify access
  const serverSupabase = createServerClient()
  const { data: { user }, error: userError } = await serverSupabase.auth.getUser()

  if (userError || !user) {
   return NextResponse.json(
    { error: 'Not authenticated' },
    { status: 401 }
   )
  }

  // Use service role for admin operations
  const adminSupabase = createClient(supabaseUrl, serviceKey)

  // Check if user is admin
  const { data: employees } = await adminSupabase
   .from('employees')
   .select('id, role, tenant_id')
   .eq('auth_user_id', user.id)
   .eq('tenant_id', tenantId)

  if (!employees || employees.length === 0) {
   return NextResponse.json(
    { error: 'No employee record found for this tenant' },
    { status: 403 }
   )
  }

  const isAdmin = employees.some(emp => 
   emp.role === 'admin' || emp.role === 'Admin' || emp.role?.toLowerCase() === 'admin'
  )

  if (!isAdmin) {
   return NextResponse.json(
    { error: 'Admin access required' },
    { status: 403 }
   )
  }

  // Verify client exists and belongs to tenant
  const { data: existingClient } = await adminSupabase
   .from('clients')
   .select('id')
   .eq('id', clientId)
   .eq('tenant_id', tenantId)
   .single()

  if (!existingClient) {
   return NextResponse.json(
    { error: 'Client not found or access denied' },
    { status: 404 }
   )
  }

  // Build update payload with progressive fallback
  const updatePayload: any = {
   name,
   email: email || null,
   address: address || null,
   phone: phone || null,
  }

  // Try to add org_number if it exists
  try {
   // Check if org_number column exists by trying to select it
   const testQuery = await adminSupabase
    .from('clients')
    .select('org_number')
    .eq('id', clientId)
    .limit(1)
   
   if (!testQuery.error) {
    updatePayload.org_number = orgNumber || null
   }
  } catch (err) {
   // Column doesn't exist, skip it
   console.log('org_number column not available, skipping')
  }

  // Update client
  const { data, error } = await adminSupabase
   .from('clients')
   .update(updatePayload)
   .eq('id', clientId)
   .eq('tenant_id', tenantId)
   .select()
   .single()

  if (error) {
   console.error('Error updating client:', error)
   return NextResponse.json(
    { error: error.message || 'Failed to update client' },
    { status: 500 }
   )
  }

  return NextResponse.json({ 
   success: true,
   client: data 
  })
 } catch (err: any) {
  console.error('Unexpected error updating client:', err)
  return NextResponse.json(
   { error: err.message || 'Internal server error' },
   { status: 500 }
  )
 }
}

