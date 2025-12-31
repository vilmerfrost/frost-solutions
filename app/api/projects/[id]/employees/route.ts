import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getTenantId } from '@/lib/serverTenant'

/**
 * API route for managing project employees
 * GET: List all employees assigned to a project
 * POST: Assign an employee to a project
 * DELETE: Remove an employee from a project
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const tenantId = await getTenantId()

    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { error: 'Service role key not configured' },
        { status: 500 }
      )
    }

    const adminSupabase = createAdminClient(supabaseUrl, serviceKey)

    // Get all employees assigned to this project
    const { data: assignments, error } = await adminSupabase
      .from('project_employees')
      .select(`
        id,
        employee_id,
        assigned_at,
        employees (
          id,
          full_name,
          email,
          role
        )
      `)
      .eq('project_id', projectId)
      .eq('tenant_id', tenantId)
      .order('assigned_at', { ascending: false })

    if (error) {
      console.error('Error fetching project employees:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to fetch project employees' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: assignments || [] })
  } catch (err: any) {
    console.error('Error in GET /api/projects/[id]/employees:', err)
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const tenantId = await getTenantId()

    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { employee_id } = body

    if (!employee_id) {
      return NextResponse.json(
        { error: 'employee_id is required' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { error: 'Service role key not configured' },
        { status: 500 }
      )
    }

    const adminSupabase = createAdminClient(supabaseUrl, serviceKey)

    // Check if employee is already assigned
    const { data: existing } = await adminSupabase
      .from('project_employees')
      .select('id')
      .eq('project_id', projectId)
      .eq('employee_id', employee_id)
      .eq('tenant_id', tenantId)
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: 'Employee is already assigned to this project' },
        { status: 409 }
      )
    }

    // Assign employee to project
    const { data, error } = await adminSupabase
      .from('project_employees')
      .insert({
        project_id: projectId,
        employee_id: employee_id,
        tenant_id: tenantId,
        assigned_at: new Date().toISOString(),
      } as any)
      .select(`
        id,
        employee_id,
        assigned_at,
        employees (
          id,
          full_name,
          email,
          role
        )
      `)
      .single()

    if (error) {
      console.error('Error assigning employee to project:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to assign employee' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (err: any) {
    console.error('Error in POST /api/projects/[id]/employees:', err)
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const tenantId = await getTenantId()

    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const employee_id = searchParams.get('employee_id')

    if (!employee_id) {
      return NextResponse.json(
        { error: 'employee_id query parameter is required' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { error: 'Service role key not configured' },
        { status: 500 }
      )
    }

    const adminSupabase = createAdminClient(supabaseUrl, serviceKey)

    // Remove employee from project
    const { error } = await adminSupabase
      .from('project_employees')
      .delete()
      .eq('project_id', projectId)
      .eq('employee_id', employee_id)
      .eq('tenant_id', tenantId)

    if (error) {
      console.error('Error removing employee from project:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to remove employee' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Error in DELETE /api/projects/[id]/employees:', err)
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

