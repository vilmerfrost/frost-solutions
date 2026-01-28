import { NextResponse, NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// GET - Fetch single ÄTA request
export async function GET(
 req: NextRequest,
 { params }: { params: Promise<{ id: string }> }
) {
 const supabase = createClient()
 const { data: { user } } = await supabase.auth.getUser()
 
 if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 }

 const { id } = await params

 const { data, error } = await (supabase
  .from('aeta_requests') as any)
  .select('*')
  .eq('id', id)
  .single()

 if (error) {
  return NextResponse.json({ error: error.message }, { status: 500 })
 }

 return NextResponse.json({ data })
}

// PATCH - Update ÄTA request (admin operations)
export async function PATCH(
 req: NextRequest,
 { params }: { params: Promise<{ id: string }> }
) {
 const supabase = createClient()
 const { data: { user } } = await supabase.auth.getUser()
 
 if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 }

 const { id } = await params
 const body = await req.json()
 
 // Separate status update from other admin updates
 const { 
  status, 
  admin_notes,
  // New admin fields
  follows_main_contract,
  custom_hourly_rate,
  custom_material_markup,
  linked_moment,
  customer_approval_status,
  customer_email,
  customer_phone,
  customer_approval_token,
  impacts_timeline,
  new_completion_date,
  internal_notes,
 } = body

 // Build update payload
 const updatePayload: any = {
  updated_at: new Date().toISOString(),
 }

 // Handle internal status (approved/rejected)
 if (status && ['approved', 'rejected', 'pending'].includes(status)) {
  updatePayload.status = status
  if (status === 'approved') {
   updatePayload.approved_by = user.id
   updatePayload.reviewed_at = new Date().toISOString()
  } else if (status === 'rejected') {
   updatePayload.approved_by = null
   updatePayload.reviewed_at = new Date().toISOString()
  }
 }

 // Admin notes
 if (admin_notes !== undefined) updatePayload.admin_notes = admin_notes

 // Pricing fields
 if (follows_main_contract !== undefined) updatePayload.follows_main_contract = follows_main_contract
 if (custom_hourly_rate !== undefined) updatePayload.custom_hourly_rate = custom_hourly_rate
 if (custom_material_markup !== undefined) updatePayload.custom_material_markup = custom_material_markup
 if (linked_moment !== undefined) updatePayload.linked_moment = linked_moment

 // Customer approval fields
 if (customer_approval_status !== undefined) updatePayload.customer_approval_status = customer_approval_status
 if (customer_email !== undefined) updatePayload.customer_email = customer_email
 if (customer_phone !== undefined) updatePayload.customer_phone = customer_phone
 if (customer_approval_token !== undefined) updatePayload.customer_approval_token = customer_approval_token

 // Timeline fields
 if (impacts_timeline !== undefined) updatePayload.impacts_timeline = impacts_timeline
 if (new_completion_date !== undefined) updatePayload.new_completion_date = new_completion_date

 // Internal notes
 if (internal_notes !== undefined) updatePayload.internal_notes = internal_notes

 const { data, error } = await (supabase
  .from('aeta_requests') as any)
  .update(updatePayload)
  .eq('id', id)
  .select()
  .single()

 if (error) {
  console.error('Error updating ÄTA request:', error)
  return NextResponse.json({ error: error.message }, { status: 500 })
 }

 // If approved, create time_entry
 if (status === 'approved' && data) {
  // Calculate hours from category if not explicitly set
  const hours = data.hours || 
   (data.estimated_hours_category === '2h' ? 2 : 
    data.estimated_hours_category === '4-8h' ? 6 : 
    data.estimated_hours_category === '>1dag' ? 8 : 0)

  if (hours > 0) {
   const timeEntryPayload: any = {
    project_id: data.project_id,
    employee_id: data.employee_id,
    tenant_id: data.tenant_id,
    date: new Date().toISOString().split('T')[0],
    hours_total: hours,
    ob_type: 'work',
    is_billed: false,
    amount_total: 0,
   }

   // Try with description first
   let result = await (supabase
    .from('time_entries') as any)
    .insert([{
     ...timeEntryPayload,
     description: `ÄTA: ${data.title || data.description || 'Ändringsarbete'}`,
    }])

   // Fallback without description if column doesn't exist
   if (result.error && (result.error.code === '42703' || result.error.message?.includes('description'))) {
    result = await (supabase
     .from('time_entries') as any)
     .insert([timeEntryPayload])
   }

   if (result.error) {
    console.error('Error creating time entry from approved AETA:', result.error)
    // Continue anyway - ÄTA is approved even if time_entry failed
   }
  }
 }

 return NextResponse.json({ data })
}

// DELETE - Delete ÄTA request (admin only)
export async function DELETE(
 req: NextRequest,
 { params }: { params: Promise<{ id: string }> }
) {
 const supabase = createClient()
 const { data: { user } } = await supabase.auth.getUser()
 
 if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 }

 const { id } = await params

 const { error } = await supabase
  .from('aeta_requests')
  .delete()
  .eq('id', id)

 if (error) {
  return NextResponse.json({ error: error.message }, { status: 500 })
 }

 return NextResponse.json({ success: true })
}
