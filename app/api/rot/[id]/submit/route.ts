import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getTenantId } from '@/lib/serverTenant'

/**
 * Skicka ROT-ansökan till Skatteverket
 *
 * OBS: Skatteverket-integration saknas. Ansökan sparas lokalt med status
 * pending_submission men skickas INTE till Skatteverket. Kräver:
 * 1. Skatteverkets API-nyckel och dokumentation
 * 2. BankID-autentisering
 * 3. E-tjänst certifiering
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
  // SKATTEVERKETS API — NOT YET INTEGRATED
  // ============================================================================
  // Riktig integration kräver Skatteverkets API-nyckel, BankID och e-tjänst-
  // certifiering. Ansökan sparas lokalt med status pending_submission.
  // ============================================================================

  // Uppdatera ansökan till pending_submission så användaren ser att den behöver skickas manuellt
  const { error: updateError } = await supabase
   .from('rot_applications')
   .update({
    status: 'pending_submission',
    last_status_check: new Date().toISOString(),
   })
   .eq('id', id)

  if (updateError) {
   console.error('Error updating ROT application:', updateError)
   return NextResponse.json({ error: 'Failed to update application' }, { status: 500 })
  }

  return NextResponse.json({
   error: 'Skatteverket-integration är inte konfigurerad. ROT-ansökan har sparats lokalt men har inte skickats till Skatteverket.',
   status: 'pending_integration',
   submitted: false,
  })
 } catch (err: any) {
  console.error('Error submitting ROT application:', err)
  return NextResponse.json(
   { error: err.message || 'Internal server error' },
   { status: 500 }
  )
 }
}

