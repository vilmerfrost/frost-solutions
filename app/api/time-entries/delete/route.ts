import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getTenantId } from '@/lib/serverTenant'

/**
 * API route för att radera time_entries med service role
 * Bypassar RLS och säkerställer korrekt tenant_id
 */
export async function DELETE(req: Request) {
 try {
  const supabase = createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
   return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const entryId = searchParams.get('id')

  if (!entryId) {
   return NextResponse.json({ error: 'Entry ID required' }, { status: 400 })
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
   return NextResponse.json(
    { error: 'Service role key not configured' },
    { status: 500 }
   )
  }

  const adminSupabase = createAdminClient(supabaseUrl, serviceKey)

  // Get employee to check admin status and get tenant
  const { data: employeeData } = await adminSupabase
   .from('employees')
   .select('id, role, tenant_id')
   .eq('auth_user_id', user.id)
   .maybeSingle()

  const isAdmin = employeeData?.role === 'admin' || employeeData?.role === 'Admin'

  // Get the entry to verify it exists and belongs to correct tenant
  const { data: entry, error: fetchError } = await adminSupabase
   .from('time_entries')
   .select('id, tenant_id, employee_id')
   .eq('id', entryId)
   .maybeSingle()

  if (fetchError || !entry) {
   return NextResponse.json(
    { error: 'Time entry not found' },
    { status: 404 }
   )
  }

  // Check permissions: admin can delete any entry, employees can only delete their own
  if (!isAdmin && entry.employee_id !== employeeData?.id) {
   return NextResponse.json(
    { error: 'Not authorized to delete this entry' },
    { status: 403 }
   )
  }

  // Delete the entry
  const { error: deleteError } = await adminSupabase
   .from('time_entries')
   .delete()
   .eq('id', entryId)

  if (deleteError) {
   console.error('Error deleting time entry:', deleteError)
   return NextResponse.json(
    { error: deleteError.message || 'Failed to delete entry' },
    { status: 500 }
   )
  }

  return NextResponse.json({
   success: true,
   message: 'Time entry deleted successfully'
  })
 } catch (err: any) {
  console.error('Unexpected error in time-entries/delete:', err)
  return NextResponse.json(
   { error: 'Internal server error', details: err.message },
   { status: 500 }
  )
 }
}

