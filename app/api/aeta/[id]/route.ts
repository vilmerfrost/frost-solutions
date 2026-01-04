import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// Uppdatera ÄTA-förfrågan (godkänn/avvisa)
export async function PATCH(
 req: Request,
 { params }: { params: Promise<{ id: string }> }
) {
 const supabase = createClient()
 const { data: { user } } = await supabase.auth.getUser()
 
 if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 }

 const { id } = await params
 const body = await req.json()
 const { status, admin_notes } = body // status: 'approved' eller 'rejected'

 if (!status || !['approved', 'rejected'].includes(status)) {
  return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
 }

 const { data, error } = await supabase
  .from('aeta_requests')
  .update({
   status,
   approved_by: status === 'approved' ? user.id : null,
   admin_notes: admin_notes || null,
   reviewed_at: new Date().toISOString(),
  })
  .eq('id', id)
  .select()
  .single()

 if (error) {
  return NextResponse.json({ error: error.message }, { status: 500 })
 }

 // Om godkänd, skapa time_entry från ÄTA-förfrågan
 if (status === 'approved' && data) {
  const { error: timeError } = await supabase
   .from('time_entries')
   .insert([{
    project_id: data.project_id,
    employee_id: data.employee_id,
    tenant_id: data.tenant_id,
    date: new Date().toISOString().split('T')[0],
    hours_total: data.hours,
    ob_type: 'work',
    description: `ÄTA: ${data.description}`,
    is_billed: false,
    amount_total: 0,
   }])

  if (timeError) {
   console.error('Error creating time entry from approved AETA:', timeError)
   // Fortsätt ändå - ÄTA är godkänd även om time_entry misslyckades
  }
 }

 return NextResponse.json({ data })
}

