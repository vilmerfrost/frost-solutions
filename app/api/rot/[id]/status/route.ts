import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getTenantId } from '@/lib/serverTenant'

/**
 * Kontrollera status för ROT-ansökan hos Skatteverket
 * 
 * OBS: Detta är en STUB-implementation. För riktig integration behöver du:
 * 1. Skatteverkets API-nyckel
 * 2. BankID-autentisering (för vissa endpoints)
 * 
 * För nu simulerar vi statusuppdateringar.
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

  if (!application.case_number) {
   return NextResponse.json({ error: 'Application not yet submitted' }, { status: 400 })
  }

  // ============================================================================
  // SKATTEVERKETS API STUB
  // ============================================================================
  // I produktion skulle detta vara ett riktigt API-anrop till Skatteverket
  // För nu simulerar vi statusuppdatering baserat på tid sedan inskick
  // ============================================================================

  // Simulera API-anrop
  await new Promise(resolve => setTimeout(resolve, 1000))

  // Simulera status baserat på tid sedan inskick
  const submissionDate = application.submission_date 
   ? new Date(application.submission_date)
   : new Date()
  const daysSinceSubmission = Math.floor(
   (Date.now() - submissionDate.getTime()) / (1000 * 60 * 60 * 24)
  )

  let newStatus = application.status
  let statusMessage = ''
  let rejectionReason = null
  let decisionDate = null

  // Simulerad statusflöde (för demo)
  if (application.status === 'submitted' && daysSinceSubmission > 7) {
   // Efter 7 dagar: 70% chans att vara godkänd, 30% avslagen
   const random = Math.random()
   if (random > 0.3) {
    newStatus = 'approved'
    statusMessage = 'Ansökan har godkänts av Skatteverket.'
    decisionDate = new Date().toISOString()
   } else {
    newStatus = 'rejected'
    statusMessage = 'Ansökan har avslagits av Skatteverket.'
    rejectionReason = 'Simulerat avslag för demo. Kontrollera med Skatteverket för riktig orsak.'
    decisionDate = new Date().toISOString()
   }
  } else if (application.status === 'submitted' && daysSinceSubmission > 3) {
   newStatus = 'under_review'
   statusMessage = 'Ansökan är under handläggning hos Skatteverket.'
  }

  // Logga API-anropet
  await supabase.from('rot_api_logs').insert({
   rot_application_id: id,
   tenant_id: tenantId,
   api_endpoint: `https://api.skatteverket.se/rot/status/${application.case_number}`,
   http_method: 'GET',
   request_body: {
    case_number: application.case_number,
    reference_id: application.reference_id,
   },
   response_body: {
    status: newStatus,
    status_message: statusMessage,
    rejection_reason: rejectionReason,
    decision_date: decisionDate,
   },
   response_status: 200,
  })

  // Uppdatera ansökan om status ändrats
  if (newStatus !== application.status) {
   const updateData: any = {
    status: newStatus,
    last_status_check: new Date().toISOString(),
   }

   if (decisionDate) {
    updateData.last_status_check = decisionDate
   }

   const { error: updateError } = await supabase
    .from('rot_applications')
    .update(updateData)
    .eq('id', id)

   if (updateError) {
    console.error('Error updating ROT application status:', updateError)
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
   }

   // Uppdatera status history
   if (statusMessage) {
    await supabase.from('rot_status_history').insert({
     rot_application_id: id,
     status: newStatus,
     status_message: statusMessage,
     rejection_reason: rejectionReason,
     decision_date: decisionDate,
    })

    // Skicka push-notifikation om status ändrats till approved eller rejected
    if (newStatus === 'approved' || newStatus === 'rejected') {
     try {
      await fetch(`${req.url.replace('/status', '/notify')}`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
        type: newStatus === 'approved' ? 'approved' : 'rejected',
        message: statusMessage,
       }),
      })
     } catch (notifErr) {
      console.error('Error sending notification:', notifErr)
      // Continue even if notification fails
     }
    }
   }
  } else {
   // Uppdatera bara last_status_check
   await supabase
    .from('rot_applications')
    .update({ last_status_check: new Date().toISOString() })
    .eq('id', id)
  }

  return NextResponse.json({
   success: true,
   status: newStatus,
   status_message: statusMessage,
   rejection_reason: rejectionReason,
   decision_date: decisionDate,
  })
 } catch (err: any) {
  console.error('Error checking ROT application status:', err)
  return NextResponse.json(
   { error: err.message || 'Internal server error' },
   { status: 500 }
  )
 }
}

