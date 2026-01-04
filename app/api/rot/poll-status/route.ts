import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

/**
 * Background job för att kontrollera status på alla ROT-ansökningar var 6:e timme
 * 
 * Anropa denna endpoint via cron job (t.ex. Vercel Cron, Supabase Edge Functions)
 * 
 * Exempel Vercel Cron (vercel.json):
 * crons: path: /api/rot/poll-status, schedule: var 6:e timme
 */
export async function GET(req: Request) {
 try {
  const supabase = createClient()
  const authHeader = req.headers.get('authorization')
  
  // Skydd mot obehörig åtkomst - använd API-nyckel eller Vercel Cron secret
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Hämta alla ROT-ansökningar som är submitted eller under_review
  // och inte kontrollerats på 6+ timmar
  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
  
  const { data: applications, error: fetchError } = await supabase
   .from('rot_applications')
   .select('id, tenant_id, case_number, status, last_status_check, submission_date')
   .in('status', ['submitted', 'under_review'])
   .or(`last_status_check.is.null,last_status_check.lt.${sixHoursAgo}`)
   .limit(100) // Batch-process max 100 åt gången

  if (fetchError) {
   console.error('Error fetching ROT applications:', fetchError)
   return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  if (!applications || applications.length === 0) {
   return NextResponse.json({ 
    success: true, 
    message: 'No applications to check',
    checked: 0 
   })
  }

  let checked = 0
  let updated = 0
  const errors: string[] = []

  // Kontrollera status för varje ansökan
  for (const app of applications) {
   try {
    checked++
    
    // Simulera statuscheck (i produktion: riktigt API-anrop)
    const submissionDate = app.submission_date 
     ? new Date(app.submission_date)
     : new Date()
    const daysSinceSubmission = Math.floor(
     (Date.now() - submissionDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    let newStatus = app.status
    let statusMessage = ''
    let rejectionReason = null
    let decisionDate = null

    // Simulerad statusflöde
    if (app.status === 'submitted' && daysSinceSubmission > 7) {
     const random = Math.random()
     if (random > 0.3) {
      newStatus = 'approved'
      statusMessage = 'Ansökan har godkänts av Skatteverket.'
      decisionDate = new Date().toISOString()
     } else {
      newStatus = 'rejected'
      statusMessage = 'Ansökan har avslagits av Skatteverket.'
      rejectionReason = 'Simulerat avslag för demo.'
      decisionDate = new Date().toISOString()
     }
    } else if (app.status === 'submitted' && daysSinceSubmission > 3) {
     newStatus = 'under_review'
     statusMessage = 'Ansökan är under handläggning hos Skatteverket.'
    }

    // Uppdatera om status ändrats
    if (newStatus !== app.status) {
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
      .eq('id', app.id)

     if (!updateError) {
      updated++
      
      // Logga status history
      if (statusMessage) {
       await supabase.from('rot_status_history').insert({
        rot_application_id: app.id,
        status: newStatus,
        status_message: statusMessage,
        rejection_reason: rejectionReason,
        decision_date: decisionDate,
       })
      }

      // Logga API-anrop
      await supabase.from('rot_api_logs').insert({
       rot_application_id: app.id,
       tenant_id: app.tenant_id,
       api_endpoint: `https://api.skatteverket.se/rot/status/${app.case_number}`,
       http_method: 'GET',
       response_body: {
        status: newStatus,
        status_message: statusMessage,
       },
       response_status: 200,
      })
     } else {
      errors.push(`Failed to update ${app.id}: ${updateError.message}`)
     }
    } else {
     // Uppdatera bara last_status_check
     await supabase
      .from('rot_applications')
      .update({ last_status_check: new Date().toISOString() })
      .eq('id', app.id)
    }
   } catch (err: any) {
    errors.push(`Error processing ${app.id}: ${err.message}`)
   }
  }

  return NextResponse.json({
   success: true,
   checked,
   updated,
   errors: errors.length > 0 ? errors : undefined,
   message: `Checked ${checked} applications, updated ${updated}`
  })
 } catch (err: any) {
  console.error('Error polling ROT status:', err)
  return NextResponse.json(
   { error: err.message || 'Internal server error' },
   { status: 500 }
  )
 }
}

