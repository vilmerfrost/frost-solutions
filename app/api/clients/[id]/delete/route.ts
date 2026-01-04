import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/utils/supabase/server'

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

/**
 * DELETE /api/clients/[id]
 * Delete a client permanently
 */
export async function DELETE(
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

  // Get user from session to verify admin access
  const serverSupabase = createServerClient()
  const { data: { user }, error: userError } = await serverSupabase.auth.getUser()

  if (userError || !user) {
   return NextResponse.json(
    { error: 'Not authenticated' },
    { status: 401 }
   )
  }

  // Check if user is admin
  const adminSupabase = createClient(supabaseUrl, serviceKey)
  const { data: employee } = await adminSupabase
   .from('employees')
   .select('id, role, tenant_id')
   .eq('auth_user_id', user.id)
   .maybeSingle()

  if (!employee || employee.role !== 'admin') {
   return NextResponse.json(
    { error: 'Unauthorized: Admin access required' },
    { status: 403 }
   )
  }

  const { id: clientId } = await params

  if (!clientId) {
   return NextResponse.json(
    { error: 'Missing client ID' },
    { status: 400 }
   )
  }

  // Verify client exists and belongs to user's tenant
  const { data: client, error: fetchError } = await adminSupabase
   .from('clients')
   .select('id, name, tenant_id')
   .eq('id', clientId)
   .maybeSingle()

  if (fetchError || !client) {
   return NextResponse.json(
    { error: 'Client not found' },
    { status: 404 }
   )
  }

  // Verify tenant match
  if (client.tenant_id !== employee.tenant_id) {
   return NextResponse.json(
    { error: 'Unauthorized: Client does not belong to your tenant' },
    { status: 403 }
   )
  }

  // Check if client has associated ACTIVE projects (not archived/completed)
  // Try with status column first
  let { data: activeProjects, error: projectsError } = await adminSupabase
   .from('projects')
   .select('id, name, status')
   .eq('client_id', clientId)
   .limit(1000)

  // If status column doesn't exist, try without it
  if (projectsError && (projectsError.code === '42703' || projectsError.message?.includes('status'))) {
   const { data: allProjects, error: allProjectsError } = await adminSupabase
    .from('projects')
    .select('id, name')
    .eq('client_id', clientId)
    .limit(1000)
   
   if (!allProjectsError) {
    activeProjects = allProjects
    projectsError = null
   }
  }

  if (projectsError) {
   console.error('Error checking projects:', projectsError)
  }

  // Filter out completed/archived projects
  const filteredProjects = (activeProjects || []).filter((p: any) => {
   const status = p.status || null
   return status !== 'completed' && status !== 'archived'
  })

  console.log(`🔍 Client delete check: ${activeProjects?.length || 0} total projects, ${filteredProjects.length} active projects`)

  if (filteredProjects.length > 0) {
   console.log(`⚠️ Cannot delete client: Has ${filteredProjects.length} active projects`)
   return NextResponse.json(
    { 
     error: 'Cannot delete client: Client has active projects',
     projectCount: filteredProjects.length,
     activeProjectCount: filteredProjects.length,
     totalProjectCount: activeProjects?.length || 0,
     message: `Kunden har ${filteredProjects.length} aktiva projekt och kan inte tas bort. Arkivera kunden istället.`
    },
    { status: 400 }
   )
  }

  console.log('✅ No active projects found, client can be deleted')

  // If there are completed/archived projects, unlink them before deleting client
  if (activeProjects && activeProjects.length > 0) {
   console.log(`🔧 Unlinking ${activeProjects.length} completed/archived projects from client`)
   
   // Update all projects to set client_id to NULL
   const { error: unlinkError } = await adminSupabase
    .from('projects')
    .update({ client_id: null })
    .eq('client_id', clientId)
   
   if (unlinkError) {
    console.error('Error unlinking projects:', unlinkError)
    return NextResponse.json(
     { 
      error: 'Failed to unlink projects from client',
      details: unlinkError.message
     },
     { status: 500 }
    )
   }
   
   console.log('✅ Successfully unlinked projects from client')
  }

  // Check if client has associated invoices
  const { data: invoices, error: invoicesError } = await adminSupabase
   .from('invoices')
   .select('id')
   .eq('client_id', clientId)
   .limit(1000)

  if (invoicesError) {
   console.error('Error checking invoices:', invoicesError)
  }

  if (invoices && invoices.length > 0) {
   console.log(`⚠️ Cannot delete client: Has ${invoices.length} associated invoices`)
   return NextResponse.json(
    { 
     error: 'Cannot delete client: Client has associated invoices',
     invoiceCount: invoices.length,
     message: `Kunden har ${invoices.length} associerade fakturor och kan inte tas bort. Arkivera kunden istället.`
    },
    { status: 400 }
   )
  }

  console.log('✅ No invoices found, proceeding with client deletion')

  // Delete client
  const { error: deleteError } = await adminSupabase
   .from('clients')
   .delete()
   .eq('id', clientId)
   .eq('tenant_id', employee.tenant_id)

  if (deleteError) {
   console.error('Error deleting client:', deleteError)
   return NextResponse.json(
    { error: deleteError.message || 'Failed to delete client' },
    { status: 500 }
   )
  }

  return NextResponse.json({
   success: true,
   message: `Client "${client.name}" deleted successfully`
  })
 } catch (err: any) {
  console.error('Unexpected error deleting client:', err)
  return NextResponse.json(
   { error: err.message || 'Internal server error' },
   { status: 500 }
  )
 }
}
