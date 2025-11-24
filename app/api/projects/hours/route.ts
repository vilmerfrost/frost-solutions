import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getTenantId } from '@/lib/serverTenant'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface HoursRequestBody {
  projectIds?: string[]
  includeBilled?: boolean
}

export async function POST(req: NextRequest) {
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

    const body = (await req.json()) as HoursRequestBody
    const projectIds = Array.isArray(body?.projectIds) ? body.projectIds.filter(Boolean) : []

    if (projectIds.length === 0) {
      return NextResponse.json({ success: true, totals: {} })
    }

    const includeBilled = Boolean(body?.includeBilled)

    // Use public schema - time_entries table is in public schema, not app schema
    const adminClient = createAdminClient()

    let hoursQuery = adminClient
      .from('time_entries')
      .select('project_id, hours_total, is_billed')
      .eq('tenant_id', tenantId)
      .in('project_id', projectIds)

    if (!includeBilled) {
      hoursQuery = hoursQuery.eq('is_billed', false)
    }

    const { data, error } = await hoursQuery

    if (error) {
      console.error('❌ Projects/hours: error fetching time entries', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    const totals = (data ?? []).reduce<Record<string, number>>((acc, entry) => {
      const projectId = (entry as any).project_id
      if (!projectId) return acc
      const hours = Number((entry as any).hours_total ?? 0)
      acc[projectId] = (acc[projectId] ?? 0) + hours
      return acc
    }, {})

    return NextResponse.json({ success: true, totals })
  } catch (error: any) {
    console.error('Unexpected projects/hours error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch project hours' }, { status: 500 })
  }
}


