import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getTenantId } from '@/lib/serverTenant'

/**
 * Anonymisera/radera ROT-ansökan för GDPR
 * 
 * Anonymiserar personnummer och andra känsliga uppgifter
 * men behåller data för bokföring (7 år enligt lag)
 */
export async function DELETE(
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

  // Hämta ansökan
  const { data: application } = await supabase
   .from('rot_applications')
   .select('created_at, tenant_id')
   .eq('id', id)
   .eq('tenant_id', tenantId)
   .single()

  if (!application) {
   return NextResponse.json({ error: 'Application not found' }, { status: 404 })
  }

  // Kontrollera om 7 år har gått (enligt bokföringslagen)
  const createdDate = new Date(application.created_at)
  const sevenYearsAgo = new Date()
  sevenYearsAgo.setFullYear(sevenYearsAgo.getFullYear() - 7)

  if (createdDate > sevenYearsAgo) {
   // Inte 7 år ännu - anonymisera istället för att radera
   const { error: anonymizeError } = await supabase
    .from('rot_applications')
    .update({
     customer_person_number: '[ANONYMIZERAD]',
     property_designation: '[ANONYMIZERAD]',
     status: 'closed',
     // Behåll resten för bokföring
    })
    .eq('id', id)

   if (anonymizeError) {
    return NextResponse.json({ error: anonymizeError.message }, { status: 500 })
   }

   return NextResponse.json({
    success: true,
    message: 'Ansökan anonymiserad. Data behålls för bokföring i 7 år.',
    action: 'anonymized',
   })
  } else {
   // 7 år har gått - kan raderas helt
   const { error: deleteError } = await supabase
    .from('rot_applications')
    .delete()
    .eq('id', id)

   if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
   }

   return NextResponse.json({
    success: true,
    message: 'Ansökan raderad.',
    action: 'deleted',
   })
  }
 } catch (err: any) {
  console.error('Error anonymizing ROT application:', err)
  return NextResponse.json(
   { error: err.message || 'Internal server error' },
   { status: 500 }
  )
 }
}

