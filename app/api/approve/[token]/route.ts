import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'

// POST - Customer approves or rejects the ÄTA
// This is a PUBLIC endpoint - no auth required
export async function POST(
 req: NextRequest,
 { params }: { params: Promise<{ token: string }> }
) {
 try {
  const { token } = await params
  
  // Validate token format (UUID)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!token || !uuidRegex.test(token)) {
   return NextResponse.json({ error: 'Ogiltig länk' }, { status: 400 })
  }

  const body = await req.json()
  const { approved } = body

  if (typeof approved !== 'boolean') {
   return NextResponse.json({ error: 'Missing approved field' }, { status: 400 })
  }

  const admin = createAdminClient()

  // First, fetch the ÄTA to verify it exists and hasn't been processed
  const { data: ata, error: fetchError } = await (admin
   .from('aeta_requests') as any)
   .select('id, customer_approval_status')
   .eq('customer_approval_token', token)
   .single()

  if (fetchError || !ata) {
   return NextResponse.json({ error: 'Länken är ogiltig eller har upphört' }, { status: 404 })
  }

  // Check if already processed
  if (['APPROVED_DIGITAL', 'REJECTED'].includes(ata.customer_approval_status)) {
   return NextResponse.json({ 
    error: 'Detta ärende har redan behandlats',
    status: ata.customer_approval_status 
   }, { status: 400 })
  }

  // Update the status
  const newStatus = approved ? 'APPROVED_DIGITAL' : 'REJECTED'
  
  const { error: updateError } = await (admin
   .from('aeta_requests') as any)
   .update({
    customer_approval_status: newStatus,
    customer_approval_timestamp: new Date().toISOString(),
   })
   .eq('id', ata.id)

  if (updateError) {
   console.error('Error updating ÄTA approval status:', updateError)
   return NextResponse.json({ error: 'Kunde inte uppdatera status' }, { status: 500 })
  }

  return NextResponse.json({ 
   success: true, 
   status: newStatus,
   message: approved ? 'Tack för ditt godkännande!' : 'Arbetet har nekats'
  })
 } catch (error: any) {
  console.error('Error in customer approval:', error)
  return NextResponse.json({ error: 'Ett fel uppstod' }, { status: 500 })
 }
}

// GET - Fetch ÄTA info for the approval page (public)
export async function GET(
 req: NextRequest,
 { params }: { params: Promise<{ token: string }> }
) {
 try {
  const { token } = await params
  
  // Validate token format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!token || !uuidRegex.test(token)) {
   return NextResponse.json({ error: 'Ogiltig länk' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: ata, error } = await (admin
   .from('aeta_requests') as any)
   .select(`
    id,
    title,
    description,
    change_type,
    photos,
    estimated_hours_category,
    estimated_material_cost,
    ordered_by_name,
    customer_approval_status,
    customer_approval_timestamp,
    project_id,
    created_at
   `)
   .eq('customer_approval_token', token)
   .single()

  if (error || !ata) {
   return NextResponse.json({ error: 'Länken är ogiltig eller har upphört' }, { status: 404 })
  }

  // Fetch project name
  const { data: project } = await admin
   .from('projects')
   .select('name')
   .eq('id', ata.project_id)
   .single()

  return NextResponse.json({
   data: {
    ...ata,
    project_name: project?.name || 'Okänt projekt',
   }
  })
 } catch (error: any) {
  console.error('Error fetching ÄTA for approval:', error)
  return NextResponse.json({ error: 'Ett fel uppstod' }, { status: 500 })
 }
}
