import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getTenantId } from '@/lib/serverTenant'

export async function POST(req: NextRequest) {
 const data = await req.json()

 // Get tenant from JWT claim (authoritative) or fallback to payload/cookie
 const claimTenant = await getTenantId()
 const finalTenantId = claimTenant || data.tenant_id

 if (!finalTenantId) {
  return NextResponse.json({ error: 'Missing tenant_id' }, { status: 400 })
 }

 data.tenant_id = finalTenantId

 const supabase = createClient()
 // Use time_entries table instead of time_reports
 const { error } = await supabase.from('time_entries').insert(data)
 
 if (error) {
  console.error('Error inserting time entry:', error)
  return NextResponse.json({ error: error.message }, { status: 400 })
 }
 
 return NextResponse.json({ success: true })
}
