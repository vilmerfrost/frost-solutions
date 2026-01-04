// app/lib/projects/updateProjectCostsFromInvoices.ts
import { createAdminClient } from '@/utils/supabase/admin'

export async function updateProjectCostsFromInvoices(
 projectId: string,
 tenantId: string
): Promise<void> {
 const admin = createAdminClient()

 // Get all approved/booked/paid invoices for project
 const { data: invoices, error } = await admin
  .from('supplier_invoices')
  .select('amount_total, status')
  .eq('tenant_id', tenantId)
  .eq('project_id', projectId)
  .in('status', ['approved', 'booked', 'paid'])

 if (error) {
  console.error('Error fetching supplier invoices for project:', error)
  return
 }

 const actualCost = (invoices ?? []).reduce((sum, inv) => sum + Number(inv.amount_total || 0), 0)

 // Get project budget
 const { data: project } = await admin
  .from('projects')
  .select('budget')
  .eq('id', projectId)
  .eq('tenant_id', tenantId)
  .maybeSingle()

 if (!project) {
  console.warn(`Project ${projectId} not found`)
  return
 }

 const budget = Number(project.budget || 0)
 const percentUsed = budget > 0 ? (actualCost / budget) * 100 : 0

 // Alert if over 80% of budget
 if (percentUsed > 80) {
  console.warn(`⚠️ Project ${projectId} is ${percentUsed.toFixed(0)}% of budget`)
  // TODO: Send notification to project manager
 }

 // Update project metadata
 const { error: updateError } = await admin
  .from('projects')
  .update({
   actual_cost: actualCost,
   budget_percent_used: percentUsed
  })
  .eq('id', projectId)
  .eq('tenant_id', tenantId)

 if (updateError) {
  console.error('Error updating project costs:', updateError)
 }
}

