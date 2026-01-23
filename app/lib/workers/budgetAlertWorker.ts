// app/lib/workers/budgetAlertWorker.ts

import { createClient } from '@supabase/supabase-js'
import { createLogger } from '@/lib/logger'

const logger = createLogger('budget-alerts')

/**
 * Budget alert worker
 * Checks project budgets and creates alerts when thresholds are exceeded
 */

interface WorkerResult {
 success: boolean
 alertsCreated?: number
 projectsChecked?: number
 errors?: string[]
 error?: string
}

interface ProjectBudget {
 id: string
 project_id: string
 tenant_id: string
 budget_hours: number | null
 budget_material: number | null
 budget_total: number | null
 alert_thresholds: Array<{ percentage: number; notify: boolean }>
 last_alert_percentage: number | null
 project: {
  id: string
  name: string
  status: string
 }
}

interface TimeEntry {
 hours: number
}

interface SupplierInvoice {
 total_amount: number
}

export async function budgetAlertWorker(): Promise<WorkerResult> {
 const errors: string[] = []
 let alertsCreated = 0
 let projectsChecked = 0

 try {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
   throw new Error('Missing Supabase configuration')
  }

  const adminSupabase = createClient(supabaseUrl, serviceKey)

  // 1. Fetch all project budgets with active projects
  const { data: projectBudgets, error: budgetsError } = await adminSupabase
   .from('project_budgets')
   .select(`
    id,
    project_id,
    tenant_id,
    budget_hours,
    budget_material,
    budget_total,
    alert_thresholds,
    last_alert_percentage,
    project:projects!inner(id, name, status)
   `)
   .not('project.status', 'eq', 'completed')
   .not('project.status', 'eq', 'cancelled')

  if (budgetsError) {
   throw new Error(`Failed to fetch project budgets: ${budgetsError.message}`)
  }

  if (!projectBudgets || projectBudgets.length === 0) {
   logger.info('No project budgets found to check')
   return { success: true, alertsCreated: 0, projectsChecked: 0, errors: [] }
  }

  logger.info({ count: projectBudgets.length }, 'Checking project budgets')

  // 2. Process each project budget
  for (const budget of projectBudgets as unknown as ProjectBudget[]) {
   try {
    projectsChecked++

    // Get total hours for the project
    const { data: timeEntries, error: timeError } = await adminSupabase
     .from('time_entries')
     .select('hours')
     .eq('project_id', budget.project_id)
     .eq('tenant_id', budget.tenant_id)

    if (timeError) {
     errors.push(`Failed to fetch time entries for project ${budget.project_id}: ${timeError.message}`)
     continue
    }

    const totalHours = (timeEntries as TimeEntry[])?.reduce((sum, entry) => sum + (entry.hours || 0), 0) || 0

    // Get total material costs (from supplier invoices linked to project)
    const { data: invoices, error: invoicesError } = await adminSupabase
     .from('supplier_invoices')
     .select('total_amount')
     .eq('project_id', budget.project_id)
     .eq('tenant_id', budget.tenant_id)

    if (invoicesError) {
     errors.push(`Failed to fetch invoices for project ${budget.project_id}: ${invoicesError.message}`)
     continue
    }

    const totalMaterialCost = (invoices as SupplierInvoice[])?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0

    // Calculate usage percentages
    let hoursPercentage = 0
    let materialPercentage = 0
    let maxPercentage = 0

    if (budget.budget_hours && budget.budget_hours > 0) {
     hoursPercentage = Math.round((totalHours / budget.budget_hours) * 100)
    }

    if (budget.budget_material && budget.budget_material > 0) {
     materialPercentage = Math.round((totalMaterialCost / budget.budget_material) * 100)
    }

    maxPercentage = Math.max(hoursPercentage, materialPercentage)

    // Check against thresholds
    const thresholds = budget.alert_thresholds || [
     { percentage: 70, notify: true },
     { percentage: 90, notify: true },
    ]

    // Sort thresholds descending to find highest exceeded threshold
    const sortedThresholds = [...thresholds].sort((a, b) => b.percentage - a.percentage)
    const lastAlertPercentage = budget.last_alert_percentage || 0

    for (const threshold of sortedThresholds) {
     // Only create alert if:
     // 1. Usage exceeds threshold
     // 2. Notification is enabled for this threshold
     // 3. We haven't already sent an alert for this threshold level
     if (
      maxPercentage >= threshold.percentage &&
      threshold.notify &&
      lastAlertPercentage < threshold.percentage
     ) {
      // Create budget alert notification
      const alertType = threshold.percentage >= 90 ? 'warning' : 'info'
      const alertTitle = threshold.percentage >= 90
       ? `Budget varning: ${budget.project?.name || 'Projekt'}`
       : `Budget uppmärksamhet: ${budget.project?.name || 'Projekt'}`

      let alertMessage = `Projektet har nått ${maxPercentage}% av budget.`
      if (hoursPercentage > 0) {
       alertMessage += ` Timmar: ${totalHours}/${budget.budget_hours}h (${hoursPercentage}%).`
      }
      if (materialPercentage > 0) {
       alertMessage += ` Material: ${totalMaterialCost}/${budget.budget_material} kr (${materialPercentage}%).`
      }

      // Fetch admin users for this tenant to notify
      const { data: admins, error: adminsError } = await adminSupabase
       .from('employees')
       .select('auth_user_id')
       .eq('tenant_id', budget.tenant_id)
       .eq('role', 'admin')
       .not('auth_user_id', 'is', null)

      if (adminsError) {
       errors.push(`Failed to fetch admins for tenant ${budget.tenant_id}: ${adminsError.message}`)
      } else if (admins && admins.length > 0) {
       // Create notification for each admin
       for (const admin of admins) {
        if (!admin.auth_user_id) continue

        const { error: notifError } = await adminSupabase
         .from('notifications')
         .insert({
          tenant_id: budget.tenant_id,
          recipient_id: admin.auth_user_id,
          type: alertType,
          title: alertTitle,
          message: alertMessage,
          link: `/projects/${budget.project_id}`,
         })

        if (notifError) {
         errors.push(`Failed to create notification: ${notifError.message}`)
        } else {
         alertsCreated++
        }
       }

       // Update last_alert_percentage to prevent duplicate alerts
       await adminSupabase
        .from('project_budgets')
        .update({ last_alert_percentage: threshold.percentage })
        .eq('id', budget.id)
      }

      // Only create alert for highest exceeded threshold
      break
     }
    }

    logger.debug({
     projectId: budget.project_id,
     hoursUsage: `${totalHours}/${budget.budget_hours || 'N/A'}`,
     materialUsage: `${totalMaterialCost}/${budget.budget_material || 'N/A'}`,
     maxPercentage,
    }, 'Checked project budget')

   } catch (projectError: any) {
    errors.push(`Error processing project ${budget.project_id}: ${projectError.message}`)
    logger.error({ error: projectError, projectId: budget.project_id }, 'Error processing project budget')
   }
  }

  logger.info({ projectsChecked, alertsCreated, errorCount: errors.length }, 'Budget alert worker completed')

  return {
   success: true,
   alertsCreated,
   projectsChecked,
   errors: errors.length > 0 ? errors : undefined,
  }
 } catch (error: any) {
  logger.error({ error }, 'Error in budgetAlertWorker')
  return {
   success: false,
   error: error.message || 'Unknown error',
   projectsChecked,
   alertsCreated,
   errors: errors.length > 0 ? errors : undefined,
  }
 }
}

