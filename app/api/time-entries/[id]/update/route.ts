import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getTenantId } from '@/lib/serverTenant'

/**
 * API route för att uppdatera time_entries med service role
 * Bypassar RLS och säkerställer korrekt tenant_id
 * Updated: Fixed tenant_id handling and .single() error
 */
export async function PATCH(
 req: Request,
 { params }: { params: Promise<{ id: string }> }
) {
 try {
  const { id: entryId } = await params
  const supabase = createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
   return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
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

  const payload = await req.json()

  // First, get the existing time entry to verify it exists and get its tenant_id
  const { data: existingEntry, error: fetchError } = await adminSupabase
   .from('time_entries')
   .select('id, tenant_id, employee_id')
   .eq('id', entryId)
   .maybeSingle()

  if (fetchError || !existingEntry) {
   console.error('Time entry not found:', { entryId, error: fetchError })
   return NextResponse.json(
    { error: 'Time entry not found', entryId },
    { status: 404 }
   )
  }

  // Use tenant_id from existing entry (most reliable) or from payload, or from JWT
  let tenantId = existingEntry.tenant_id
  
  // If payload contains tenant_id, verify it exists and use it if valid
  if (payload.tenant_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(payload.tenant_id)) {
   const { data: payloadTenantCheck } = await adminSupabase
    .from('tenants')
    .select('id')
    .eq('id', payload.tenant_id)
    .single()
   
   if (payloadTenantCheck) {
    tenantId = payload.tenant_id
    console.log('✅ Using tenantId from payload:', tenantId)
   }
  }

  // Ensure tenant_id is set in payload
  payload.tenant_id = tenantId

  // Update with service role to bypass RLS
  // Don't filter by tenant_id - we already verified the entry exists
  const { data, error } = await adminSupabase
   .from('time_entries')
   .update(payload)
   .eq('id', entryId)
   .select()
   .maybeSingle() // Use maybeSingle instead of single to handle 0 rows gracefully

  if (error) {
   console.error('Error updating time entry:', error)
   return NextResponse.json(
    { error: error.message || 'Failed to update time entry', details: error },
    { status: 500 }
   )
  }

  if (!data) {
   console.error('No data returned after update:', { entryId, tenantId })
   return NextResponse.json(
    { error: 'Time entry was not updated. It may have been deleted or moved.', entryId },
    { status: 404 }
   )
  }

  return NextResponse.json({ success: true, data })
 } catch (err: any) {
  console.error('Error in time-entries/[id]/update API:', err)
  return NextResponse.json(
   { error: err.message || 'Internal server error' },
   { status: 500 }
  )
 }
}

