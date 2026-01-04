import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getTenantId } from '@/lib/serverTenant'

/**
 * Skicka ROT-ansökan till Skatteverket
 * 
 * OBS: Detta är en STUB-implementation. För riktig integration behöver du:
 * 1. Skatteverkets API-nyckel och dokumentation
 * 2. BankID-autentisering
 * 3. E-tjänst certifiering
 * 
 * För nu simulerar vi API-anropet och sparar ärendenummer.
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

  const { id } = await params
  const tenantId = await getTenantId()

  if (!tenantId) {
   return NextResponse.json({ error: 'No tenant found' }, { status: 400 })
  }

  // Hämta ROT-ansökan
  const { data: application, error: appError } = await supabase
   .from('rot_applications')
   .select('*')
   .eq('id', id)
   .eq('tenant_id', tenantId)
   .single()

  if (appError || !application) {
   return NextResponse.json({ error: 'Application not found' }, { status: 404 })
  }

  if (application.status !== 'draft') {
   return NextResponse.json({ error: 'Application already submitted' }, { status: 400 })
  }

  // ============================================================================
  // SKATTEVERKETS API STUB
  // ============================================================================
  // I produktion skulle detta vara ett riktigt API-anrop till Skatteverket
  // För nu simulerar vi ett lyckat svar
  // ============================================================================
  
  // Simulera API-anrop (tar 1-2 sekunder)
  await new Promise(resolve => setTimeout(resolve, 1500))

  // Generera mock ärendenummer
  const mockCaseNumber = `ROT-${Date.now().toString().slice(-8)}`
  const mockReferenceId = `REF-${Date.now()}`

  // Logga API-anropet
  await supabase.from('rot_api_logs').insert({
   rot_application_id: id,
   tenant_id: tenantId,
   api_endpoint: 'https://api.skatteverket.se/rot/submit',
   http_method: 'POST',
   request_body: {
    application_id: id,
    customer_person_number: application.customer_person_number,
    property_designation: application.property_designation,
    work_type: application.work_type,
    work_cost_sek: application.work_cost_sek,
    material_cost_sek: application.material_cost_sek,
    total_cost_sek: application.total_cost_sek,
   },
   response_body: {
    case_number: mockCaseNumber,
    reference_id: mockReferenceId,
    status: 'submitted',
   },
   response_status: 200,
  })

  // Uppdatera ansökan
  const { error: updateError } = await supabase
   .from('rot_applications')
   .update({
    status: 'submitted',
    case_number: mockCaseNumber,
    reference_id: mockReferenceId,
    submission_date: new Date().toISOString(),
    last_status_check: new Date().toISOString(),
   })
   .eq('id', id)

  if (updateError) {
   console.error('Error updating ROT application:', updateError)
   return NextResponse.json({ error: 'Failed to update application' }, { status: 500 })
  }

  return NextResponse.json({
   success: true,
   case_number: mockCaseNumber,
   reference_id: mockReferenceId,
   message: 'Ansökan skickad till Skatteverket',
  })
 } catch (err: any) {
  console.error('Error submitting ROT application:', err)
  return NextResponse.json(
   { error: err.message || 'Internal server error' },
   { status: 500 }
  )
 }
}

