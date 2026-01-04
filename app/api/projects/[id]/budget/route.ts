import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getTenantId } from '@/lib/serverTenant'
import { getFeatureFlag } from '@/lib/featureFlags'

/**
 * POST /api/projects/[id]/budget
 * Sätter budget för projekt
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

  // Kontrollera feature flag
  const budgetEnabled = await getFeatureFlag(tenantId, 'enable_budget_alerts')
  if (!budgetEnabled) {
   return NextResponse.json(
    { error: 'Budget alerts is not enabled for this tenant' },
    { status: 403 }
   )
  }

  const { id } = await params
  const body = await req.json()
  const {
   budget_hours,
   budget_material,
   alert_thresholds = [
    { percentage: 70, notify: true },
    { percentage: 90, notify: true },
   ],
  } = body

  if (budget_hours === undefined && budget_material === undefined) {
   return NextResponse.json(
    { error: 'budget_hours or budget_material is required' },
    { status: 400 }
   )
  }

  if (budget_hours !== undefined && budget_hours < 0) {
   return NextResponse.json(
    { error: 'budget_hours cannot be negative' },
    { status: 400 }
   )
  }

  if (budget_material !== undefined && budget_material < 0) {
   return NextResponse.json(
    { error: 'budget_material cannot be negative' },
    { status: 400 }
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

  // Verifiera att projektet finns
  const { data: project } = await adminSupabase
   .from('projects')
   .select('id, tenant_id')
   .eq('id', id)
   .eq('tenant_id', tenantId)
   .single()

  if (!project) {
   return NextResponse.json(
    { error: 'Project not found' },
    { status: 404 }
   )
  }

  // Skapa eller uppdatera budget
  const { data: existingBudget } = await adminSupabase
   .from('project_budgets')
   .select('id')
   .eq('project_id', id)
   .single()

  const budgetData: any = {
   tenant_id: tenantId,
   project_id: id,
   alert_thresholds,
  }

  if (budget_hours !== undefined) {
   budgetData.budget_hours = budget_hours
  }

  if (budget_material !== undefined) {
   budgetData.budget_material = budget_material
  }

  let result
  if (existingBudget) {
   // Uppdatera befintlig budget
   const { data, error } = await adminSupabase
    .from('project_budgets')
    .update(budgetData)
    .eq('id', existingBudget.id)
    .select()
    .single()

   if (error) {
    console.error('Error updating budget:', error)
    return NextResponse.json(
     { error: 'Failed to update budget', details: error.message },
     { status: 500 }
    )
   }

   result = data
  } else {
   // Skapa ny budget
   const { data, error } = await adminSupabase
    .from('project_budgets')
    .insert(budgetData)
    .select()
    .single()

   if (error) {
    console.error('Error creating budget:', error)
    return NextResponse.json(
     { error: 'Failed to create budget', details: error.message },
     { status: 500 }
    )
   }

   result = data
  }

  // Logga audit event
  try {
   await adminSupabase.rpc('append_audit_event', {
    p_tenant_id: tenantId,
    p_table_name: 'project_budgets',
    p_record_id: result.id,
    p_action: existingBudget ? 'update' : 'create',
    p_user_id: user.id,
    p_employee_id: employeeData.id,
    p_new_values: budgetData,
    p_changed_fields: existingBudget ? Object.keys(budgetData) : null,
   })
  } catch (auditError) {
   console.error('Error logging audit event:', auditError)
  }

  return NextResponse.json(
   {
    id: result.id,
    project_id: result.project_id,
    budget_hours: result.budget_hours,
    budget_material: result.budget_material,
    budget_total: result.budget_total,
    alert_thresholds: result.alert_thresholds,
    created_at: result.created_at,
   },
   { status: existingBudget ? 200 : 201 }
  )
 } catch (error: any) {
  console.error('Error in POST /api/projects/[id]/budget:', error)
  return NextResponse.json(
   { error: 'Internal server error', details: error.message },
   { status: 500 }
  )
 }
}

/**
 * GET /api/projects/[id]/budget
 * Hämtar budget för projekt
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

  const { data: budget, error } = await adminSupabase
   .from('project_budgets')
   .select('*')
   .eq('project_id', id)
   .eq('tenant_id', tenantId)
   .single()

  if (error || !budget) {
   return NextResponse.json(
    { error: 'Budget not found' },
    { status: 404 }
   )
  }

  return NextResponse.json(budget)
 } catch (error: any) {
  console.error('Error in GET /api/projects/[id]/budget:', error)
  return NextResponse.json(
   { error: 'Internal server error', details: error.message },
   { status: 500 }
  )
 }
}

