import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getTenantId } from '@/lib/serverTenant'

/**
 * Kontrollera status för ROT-ansökan hos Skatteverket
 * 
 * OBS: Skatteverket-integration saknas. Returnerar lagrad status från databasen
 * utan att kontakta Skatteverkets API. Användaren hänvisas till manuell kontroll.
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

  // ============================================================================
  // SKATTEVERKETS API — NOT YET INTEGRATED
  // ============================================================================
  // Riktig integration kräver Skatteverkets API-nyckel och BankID.
  // Returnerar lagrad status utan modifiering.
  // ============================================================================

  // Uppdatera last_status_check
  await supabase
   .from('rot_applications')
   .update({ last_status_check: new Date().toISOString() })
   .eq('id', id)

  // Om status är pending_submission eller submitted utan riktig integration,
  // informera användaren att manuell kontroll krävs
  const pendingStatuses = ['pending_submission', 'submitted', 'under_review']
  if (pendingStatuses.includes(application.status)) {
   return NextResponse.json({
    status: 'pending_integration',
    message: 'Statusuppdatering från Skatteverket är inte tillgänglig. Kontrollera status manuellt på skatteverket.se.',
    stored_status: application.status,
   })
  }

  // För redan avgjorda ansökningar (approved, rejected, etc.), returnera lagrad status
  return NextResponse.json({
   status: application.status,
   message: application.status,
   case_number: application.case_number,
  })
 } catch (err: any) {
  console.error('Error checking ROT application status:', err)
  return NextResponse.json(
   { error: err.message || 'Internal server error' },
   { status: 500 }
  )
 }
}

