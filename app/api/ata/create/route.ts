import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getTenantId } from '@/lib/serverTenant'
import { getFeatureFlag } from '@/lib/featureFlags'

/**
 * POST /api/ata/create
 * Skapar ny ÄTA (rot_application) med förbättrad funktionalitet
 */
export async function POST(req: Request) {
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

  // Kontrollera feature flag
  const ataEnabled = await getFeatureFlag(tenantId, 'enable_ata_2_0')
  if (!ataEnabled) {
   return NextResponse.json(
    { error: 'ÄTA 2.0 is not enabled for this tenant' },
    { status: 403 }
   )
  }

  // Kontrollera admin-access
  const adminSupabase = createAdminClient(
   process.env.NEXT_PUBLIC_SUPABASE_URL!,
   process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: employeeData } = await adminSupabase
   .from('employees')
   .select('id, role')
   .eq('auth_user_id', user.id)
   .eq('tenant_id', tenantId)
   .single()

  if (!employeeData || employeeData.role !== 'admin') {
   return NextResponse.json(
    { error: 'Admin access required' },
    { status: 403 }
   )
  }

  const body = await req.json()
  const {
   project_id,
   description,
   cost_frame,
   invoice_mode = 'separate',
   items = [],
  } = body

  if (!project_id || !description) {
   return NextResponse.json(
    { error: 'project_id and description are required' },
    { status: 400 }
   )
  }

  if (!['separate', 'add_to_main'].includes(invoice_mode)) {
   return NextResponse.json(
    { error: 'invoice_mode must be "separate" or "add_to_main"' },
    { status: 400 }
   )
  }

  // Verifiera att projektet finns och tillhör tenant
  const { data: project } = await adminSupabase
   .from('projects')
   .select('id, tenant_id')
   .eq('id', project_id)
   .eq('tenant_id', tenantId)
   .single()

  if (!project) {
   return NextResponse.json(
    { error: 'Project not found' },
    { status: 404 }
   )
  }

  // Skapa rot_application
  const { data: rotApplication, error: rotError } = await adminSupabase
   .from('rot_applications')
   .insert({
    tenant_id: tenantId,
    project_id,
    description,
    cost_frame: cost_frame || null,
    invoice_mode,
    status_timeline: [
     {
      status: 'created',
      timestamp: new Date().toISOString(),
      user_id: user.id,
      comment: null,
     },
    ],
   })
   .select()
   .single()

  if (rotError) {
   console.error('Error creating rot_application:', rotError)
   return NextResponse.json(
    { error: 'Failed to create ÄTA', details: rotError.message },
    { status: 500 }
   )
  }

  // Skapa ata_items om items finns
  if (items && items.length > 0) {
   const ataItems = items.map((item: any, index: number) => ({
    tenant_id: tenantId,
    rot_application_id: rotApplication.id,
    description: item.description,
    quantity: item.quantity || 1,
    unit_price: item.unit_price,
    total_price: (item.quantity || 1) * item.unit_price,
    sort_order: index,
   }))

   const { error: itemsError } = await adminSupabase
    .from('ata_items')
    .insert(ataItems)

   if (itemsError) {
    console.error('Error creating ata_items:', itemsError)
    // Logga fel men returnera success (ÄTA skapad)
   }
  }

  // Logga audit event
  try {
   await adminSupabase.rpc('append_audit_event', {
    p_tenant_id: tenantId,
    p_table_name: 'rot_applications',
    p_record_id: rotApplication.id,
    p_action: 'create',
    p_user_id: user.id,
    p_employee_id: employeeData.id,
    p_new_values: {
     description,
     cost_frame,
     invoice_mode,
    },
    p_changed_fields: null,
   })
  } catch (auditError) {
   console.error('Error logging audit event:', auditError)
   // Fortsätt även om audit log misslyckas
  }

  return NextResponse.json(
   {
    id: rotApplication.id,
    project_id: rotApplication.project_id,
    description: rotApplication.description,
    cost_frame: rotApplication.cost_frame,
    invoice_mode: rotApplication.invoice_mode,
    status_timeline: rotApplication.status_timeline,
    created_at: rotApplication.created_at,
   },
   { status: 201 }
  )
 } catch (error: any) {
  console.error('Error in POST /api/ata/create:', error)
  return NextResponse.json(
   { error: 'Internal server error', details: error.message },
   { status: 500 }
  )
 }
}

