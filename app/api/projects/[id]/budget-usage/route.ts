import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getTenantId } from '@/lib/serverTenant'

/**
 * GET /api/projects/[id]/budget-usage
 * Hämtar budget usage för projekt
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

  // Använd SQL-funktionen för att beräkna usage
  const { data, error } = await adminSupabase.rpc('get_budget_usage', {
   p_project_id: id,
  })

  if (error) {
   console.error('Error getting budget usage:', error)
   return NextResponse.json(
    { error: 'Failed to get budget usage', details: error.message },
    { status: 500 }
   )
  }

  if (!data || data.length === 0) {
   return NextResponse.json(
    { error: 'Budget not found for project' },
    { status: 404 }
   )
  }

  return NextResponse.json(data[0])
 } catch (error: any) {
  console.error('Error in GET /api/projects/[id]/budget-usage:', error)
  return NextResponse.json(
   { error: 'Internal server error', details: error.message },
   { status: 500 }
  )
 }
}

