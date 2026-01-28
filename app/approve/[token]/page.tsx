import { createAdminClient } from '@/utils/supabase/admin'
import { notFound } from 'next/navigation'
import ApprovalClient from './ApprovalClient'

interface PageProps {
 params: Promise<{ token: string }>
}

export const dynamic = 'force-dynamic'

export default async function CustomerApprovalPage({ params }: PageProps) {
 const { token } = await params
 
 // Validate token format (UUID)
 const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
 if (!token || !uuidRegex.test(token)) {
  notFound()
 }

 // Fetch the ÄTA request using the approval token
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
  notFound()
 }

 // Fetch project name
 const { data: project } = await admin
  .from('projects')
  .select('name')
  .eq('id', ata.project_id)
  .single()

 // Check if already processed
 const alreadyProcessed = ['APPROVED_DIGITAL', 'REJECTED'].includes(ata.customer_approval_status)

 return (
  <ApprovalClient 
   ata={{
    ...ata,
    project_name: project?.name || 'Okänt projekt',
   }}
   token={token}
   alreadyProcessed={alreadyProcessed}
  />
 )
}
