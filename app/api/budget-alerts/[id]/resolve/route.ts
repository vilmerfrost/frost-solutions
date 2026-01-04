import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getTenantId } from '@/lib/serverTenant'

/**
 * POST /api/budget-alerts/[id]/resolve
 * Markerar alert som resolved
 */
export async function POST(
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

  // Hämta alert
  const { data: alert, error: alertError } = await adminSupabase
   .from('budget_alerts')
   .select('*')
   .eq('id', id)
   .eq('tenant_id', tenantId)
   .single()

  if (alertError || !alert) {
   return NextResponse.json(
    { error: 'Alert not found' },
    { status: 404 }
   )
  }

  if (alert.status === 'resolved') {
   return NextResponse.json(
    { error: 'Alert already resolved' },
    { status: 409 }
   )
  }

  // Uppdatera alert
  const { data: updatedAlert, error: updateError } = await adminSupabase
   .from('budget_alerts')
   .update({
    status: 'resolved',
   })
   .eq('id', id)
   .select()
   .single()

  if (updateError) {
   console.error('Error updating alert:', updateError)
   return NextResponse.json(
    { error: 'Failed to resolve alert', details: updateError.message },
    { status: 500 }
   )
  }

  return NextResponse.json({
   id: updatedAlert.id,
   status: updatedAlert.status,
  })
 } catch (error: any) {
  console.error('Error in POST /api/budget-alerts/[id]/resolve:', error)
  return NextResponse.json(
   { error: 'Internal server error', details: error.message },
   { status: 500 }
  )
 }
}

