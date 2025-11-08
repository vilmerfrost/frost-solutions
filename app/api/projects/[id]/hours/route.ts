import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getTenantId } from '@/lib/serverTenant'

/**
 * API route för att hämta projekt-timmar med service role
 * Bypassar RLS och säkerställer korrekt tenant_id
 */
export async function GET(req: Request) {
  try {
    const supabase = createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 })
    }

    let tenantId = await getTenantId()
    
    if (!tenantId) {
      // Try to get tenant from employee record
      const { data: employeeData } = await supabase
        .from('employees')
        .select('tenant_id')
        .eq('auth_user_id', user.id)
        .maybeSingle()
      
      if (employeeData?.tenant_id) {
        tenantId = employeeData.tenant_id
      }
    }
    
    if (!tenantId) {
      return NextResponse.json({ error: 'No tenant ID found' }, { status: 400 })
    }

    const adminSupabase = createAdminClient()

    // Get employee to check tenant
    const { data: employeeData } = await adminSupabase
      .from('employees')
      .select('id, role, tenant_id')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    // Use employee's tenant_id if available
    if (employeeData?.tenant_id) {
      const { data: empTenantExists } = await adminSupabase
        .from('tenants')
        .select('id')
        .eq('id', employeeData.tenant_id)
        .maybeSingle()
      
      if (empTenantExists) {
        tenantId = employeeData.tenant_id
        console.log('✅ Using tenant from employee record:', tenantId)
      } else {
        console.log('⚠️ Employee tenant does not exist, keeping original tenant')
      }
    }

    // Check if user is admin
    const isAdmin = employeeData?.role === 'admin' || employeeData?.role === 'Admin' || employeeData?.role === 'ADMIN'
    
    console.log('🔍 API: Fetching project hours', {
      projectId,
      tenantId,
      employeeTenantId: employeeData?.tenant_id,
      isAdmin,
      employeeId: employeeData?.id
    })

    // Get unbilled hours for this project
    let entriesQuery = adminSupabase
      .from('time_entries')
      .select('hours_total, date, ob_type')
      .eq('project_id', projectId)
      .eq('is_billed', false)
      .eq('tenant_id', tenantId)
    
    // If not admin, only get this employee's hours
    if (!isAdmin && employeeData?.id) {
      entriesQuery = entriesQuery.eq('employee_id', employeeData.id)
    }
    
    const { data: entries, error } = await entriesQuery
      .order('date', { ascending: false })
      .limit(50)

    if (error) {
      console.error('❌ Error fetching project hours:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to fetch project hours' },
        { status: 500 }
      )
    }

    const totalHours = (entries || []).reduce((sum: number, row: any) => {
      return sum + Number(row?.hours_total ?? 0)
    }, 0)

    console.log('✅ API: Project hours calculated', {
      projectId,
      totalHours,
      entryCount: entries?.length || 0,
      sampleEntries: entries?.slice(0, 3).map(e => ({ date: e.date, hours: e.hours_total }))
    })

    return NextResponse.json({
      hours: totalHours,
      entries: entries || [],
      count: entries?.length || 0
    })
  } catch (err: any) {
    console.error('Unexpected error in projects/[id]/hours:', err)
    return NextResponse.json(
      { error: 'Internal server error', details: err.message },
      { status: 500 }
    )
  }
}

