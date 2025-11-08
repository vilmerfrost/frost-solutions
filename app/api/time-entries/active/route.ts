import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getTenantId } from '@/lib/serverTenant'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = await getTenantId()
    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'No tenant found' }, { status: 400 })
    }

    const url = new URL(req.url)
    const employeeId = url.searchParams.get('employeeId')

    if (!employeeId) {
      return NextResponse.json({ success: false, error: 'Missing employeeId' }, { status: 400 })
    }

    const adminPublic = createAdminClient(8000, 'public')

    // Verify that employee belongs to current user/tenant
    const { data: employeeRecord, error: employeeError } = await adminPublic
      .from('employees')
      .select('id, tenant_id, auth_user_id')
      .eq('id', employeeId)
      .eq('tenant_id', tenantId)
      .maybeSingle()

    if (employeeError) {
      console.error('❌ Active time entry: error verifying employee', employeeError)
    }

    if (!employeeRecord || employeeRecord.auth_user_id !== user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    // Use public schema for time_entries (Supabase REST API only supports public schema)
    const { data: entry, error } = await adminPublic
      .from('time_entries')
      .select('id, date, start_time, project_id, tenant_id')
      .eq('tenant_id', tenantId)
      .eq('employee_id', employeeId)
      .is('end_time', null)
      .order('date', { ascending: false })
      .order('start_time', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('❌ Active time entry: query error', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: entry ?? null })
  } catch (error: any) {
    console.error('Unexpected active time entry error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch active time entry' }, { status: 500 })
  }
}


