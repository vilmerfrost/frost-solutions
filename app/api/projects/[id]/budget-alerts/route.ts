import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getTenantId } from '@/lib/serverTenant'

/**
 * GET /api/projects/[id]/budget-alerts
 * Hämtar aktiva budget-alerts för projekt
 */
export async function GET(
 req: Request,
 { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params

  const adminSupabase = createAdminClient(
   process.env.NEXT_PUBLIC_SUPABASE_URL!,
   process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: alerts, error } = await adminSupabase
   .from('budget_alerts')
   .select('*')
   .eq('project_id', id)
   .eq('tenant_id', tenantId)
   .order('created_at', { ascending: false })

  if (error) {
   console.error('Error fetching alerts:', error)
   return NextResponse.json(
    { error: 'Failed to fetch alerts', details: error.message },
    { status: 500 }
   )
  }

  return NextResponse.json({
   alerts: alerts || [],
  })
 } catch (error: any) {
  console.error('Error in GET /api/projects/[id]/budget-alerts:', error)
  return NextResponse.json(
   { error: 'Internal server error', details: error.message },
   { status: 500 }
  )
 }
}

