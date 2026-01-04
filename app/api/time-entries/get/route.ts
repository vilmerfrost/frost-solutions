import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getTenantId } from '@/lib/serverTenant'

export async function GET(req: Request) {
 try {
  const supabase = createClient()
  const {
   data: { user },
   error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
   return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const tenantId = await getTenantId()
  if (!tenantId) {
   return NextResponse.json({ error: 'No tenant ID found' }, { status: 400 })
  }

  const url = new URL(req.url)
  const entryId = url.searchParams.get('id')

  if (!entryId) {
   return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data, error } = await admin
   .from('time_entries')
   .select('id, date, start_time, end_time, project_id, employee_id, tenant_id')
   .eq('id', entryId)
   .eq('tenant_id', tenantId)
   .maybeSingle()

  if (error) {
   console.error('time-entries/get error:', error)
   return NextResponse.json({ error: error.message || 'Failed to fetch entry' }, { status: 500 })
  }

  if (!data) {
   return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
  }

  return NextResponse.json({ entry: data })
 } catch (error: any) {
  console.error('Unexpected error in time-entries/get:', error)
  return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
 }
}


