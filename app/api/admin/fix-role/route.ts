import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

/**
 * API route för att uppdatera user's role till admin
 * Använder service role för att kringgå RLS
 */
export async function POST(req: Request) {
 try {
  const supabase = createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
   return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Get tenant
  let tenantId = (user.app_metadata as any)?.tenant_id || null

  // Use service role to update
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
   return NextResponse.json(
    { error: 'Service role key not configured. Check your .env.local file.' },
    { status: 500 }
   )
  }

  const adminSupabase = createAdminClient(supabaseUrl, serviceKey)

  // Try to find employee record - use .limit(1) and handle array response
  let { data: empDataList, error: empListError } = await adminSupabase
   .from('employees')
   .select('id, tenant_id, role, auth_user_id, email')
   .eq('auth_user_id', user.id)
   .limit(10)

  let empData = null
  if (empDataList && Array.isArray(empDataList)) {
   // If we have tenantId, prefer that match
   if (tenantId) {
    empData = empDataList.find((e: any) => e.tenant_id === tenantId) || empDataList[0] || null
   } else {
    empData = empDataList[0] || null
   }
  }

  // If not found by auth_user_id, try by email
  if (!empData && user.email) {
   const { data: empByEmailList } = await adminSupabase
    .from('employees')
    .select('id, tenant_id, role, auth_user_id, email')
    .eq('email', user.email)
    .limit(10)
   
   if (empByEmailList && Array.isArray(empByEmailList)) {
    if (tenantId) {
     empData = empByEmailList.find((e: any) => e.tenant_id === tenantId) || empByEmailList[0] || null
    } else {
     empData = empByEmailList[0] || null
    }
   }
  }

  if (!empData) {
   // Employee record doesn't exist - create it with admin role
   if (!tenantId) {
    return NextResponse.json(
     { error: 'No tenant found. Please complete onboarding first.' },
     { status: 404 }
    )
   }

   // Create new employee record with admin role
   const employeeName = user.user_metadata?.full_name || 
             user.user_metadata?.name || 
             user.email?.split('@')[0] || 
             'Admin'

   const insertPayload: any = {
    auth_user_id: user.id,
    tenant_id: tenantId,
    role: 'admin',
    name: employeeName,
    email: user.email,
   }

   // Try with full_name first
   let insertResult = await adminSupabase
    .from('employees')
    .insert([insertPayload])
    .select('id')
    .single()

   // Fallback without full_name if needed
   if (insertResult.error && (insertResult.error.code === '42703' || insertResult.error.message?.includes('full_name'))) {
    const { full_name, ...payloadMinimal } = insertPayload
    insertResult = await adminSupabase
     .from('employees')
     .insert([payloadMinimal])
     .select('id')
     .single()
   }

   // Fallback without base_rate_sek/default_rate_sek if needed
   if (insertResult.error && (insertResult.error.code === '42703' || 
     insertResult.error.message?.includes('base_rate_sek') || 
     insertResult.error.message?.includes('default_rate_sek'))) {
    const { base_rate_sek, default_rate_sek, ...payloadMinimal } = insertPayload
    insertResult = await adminSupabase
     .from('employees')
     .insert([payloadMinimal])
     .select('id')
     .single()
   }

   if (insertResult.error || !insertResult.data) {
    console.error('Error creating employee:', insertResult.error)
    return NextResponse.json(
     { error: insertResult.error?.message || 'Failed to create employee record' },
     { status: 500 }
    )
   }

   return NextResponse.json({
    success: true,
    message: 'Employee record created with admin role',
    employeeId: insertResult.data.id,
    tenantId,
    created: true,
   })
  }

  tenantId = tenantId || empData.tenant_id

  // Update existing employee role to admin
  const { error: updateError } = await adminSupabase
   .from('employees')
   .update({ role: 'admin' })
   .eq('id', empData.id)

  if (updateError) {
   console.error('Error updating role:', updateError)
   return NextResponse.json(
    { error: updateError.message },
    { status: 500 }
   )
  }

  return NextResponse.json({
   success: true,
   message: 'Role updated to admin successfully',
   employeeId: empData.id,
   tenantId,
   created: false,
  })
 } catch (err: any) {
  console.error('Error in fix-role API:', err)
  return NextResponse.json(
   { error: err.message || 'Internal server error' },
   { status: 500 }
  )
 }
}

