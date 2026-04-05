import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuthAdmin, parseBody, apiSuccess, apiError, handleRouteError } from '@/lib/api'

const CreateInvoiceSchema = z.object({
  tenant_id: z.string().uuid('tenant_id must be a valid UUID'),
  project_id: z.string().uuid().optional().nullable(),
  client_id: z.string().uuid().optional().nullable(),
  customer_name: z.string().optional().nullable(),
  amount: z.union([z.number(), z.string()]).optional().nullable(),
  desc: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
  issue_date: z.string().optional().nullable(),
  rot_application_id: z.string().uuid().optional().nullable(),
})

/**
 * API route for creating invoices with service role
 * Verifies tenant_id and handles missing columns progressively
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const body = await parseBody(req, CreateInvoiceSchema)
    if (body.error) return body.error

    const {
      tenant_id,
      project_id,
      client_id,
      customer_name,
      amount,
      desc,
      description,
      status,
      issue_date,
      rot_application_id,
    } = body.data

    const adminSupabase = auth.admin

    // Verify tenant exists
    const { data: tenantData, error: tenantError } = await adminSupabase
      .from('tenants')
      .select('id, name')
      .eq('id', tenant_id)
      .single()

    if (tenantError || !tenantData) {
      return apiError('Tenant validation failed. Please ensure you are properly authenticated and try again.', 400)
    }

    const verifiedTenantId = tenantData.id

    // Verify user has access to this tenant and is admin
    const { data: employeeData } = await adminSupabase
      .from('employees')
      .select('id, tenant_id, role')
      .eq('auth_user_id', auth.user.id)
      .eq('tenant_id', tenant_id)
      .limit(1)

    if (!employeeData || employeeData.length === 0) {
      return apiError('You do not have access to this tenant', 403)
    }

    const isAdmin = ['admin', 'Admin', 'ADMIN'].includes(employeeData[0]?.role ?? '')
    if (!isAdmin) {
      return apiError('Admin access required to create invoices', 403)
    }

    // Build payload progressively
    const basePayload: Record<string, unknown> = {
      tenant_id: verifiedTenantId,
    }

    // Add description (try both 'desc' and 'description' columns)
    if (desc) {
      basePayload.desc = desc
      basePayload.description = desc
    } else if (description) {
      basePayload.desc = description
      basePayload.description = description
    }

    // Add optional fields
    if (project_id) basePayload.project_id = project_id
    if (client_id) basePayload.client_id = client_id
    if (customer_name) basePayload.customer_name = customer_name
    if (amount !== undefined && amount !== null) basePayload.amount = Number(amount) || 0
    if (status) basePayload.status = status
    if (issue_date) basePayload.issue_date = issue_date
    if (rot_application_id) basePayload.rot_application_id = rot_application_id

    // Try progressively: start with all columns, then fallback
    let insertResult = await adminSupabase
      .from('invoices')
      .insert([basePayload])
      .select('*, project_id')
      .single()

    // Attempt 2: If desc fails, try without desc (keep description)
    if (insertResult.error && (insertResult.error.code === '42703' || insertResult.error.message?.includes('desc'))) {
      const { desc: _, ...payloadWithoutDesc } = basePayload
      insertResult = await adminSupabase
        .from('invoices')
        .insert([payloadWithoutDesc])
        .select('*, project_id')
        .single()
    }

    // Attempt 3: If description also fails, try without both
    if (insertResult.error && (insertResult.error.code === '42703' || insertResult.error.message?.includes('description'))) {
      const { desc: _, description: __, ...payloadWithoutBoth } = basePayload
      insertResult = await adminSupabase
        .from('invoices')
        .insert([payloadWithoutBoth])
        .select('*, project_id')
        .single()
    }

    // Attempt 4: If customer_name fails, try without it
    if (insertResult.error && (insertResult.error.code === '42703' || insertResult.error.message?.includes('customer_name'))) {
      const { customer_name: _, ...payloadWithoutCustomerName } = basePayload
      insertResult = await adminSupabase
        .from('invoices')
        .insert([payloadWithoutCustomerName])
        .select('*, project_id')
        .single()
    }

    if (insertResult.error) {
      console.error('Error creating invoice (all fallbacks failed):', insertResult.error)

      // Handle foreign key constraint violation
      if (insertResult.error.code === '23503') {
        const { data: tenantVerify } = await adminSupabase
          .from('tenants')
          .select('id')
          .eq('id', verifiedTenantId)
          .single()

        const projectVerifyResult = project_id ? await adminSupabase
          .from('projects')
          .select('id')
          .eq('id', project_id)
          .single() : null

        const clientVerifyResult = client_id ? await adminSupabase
          .from('clients')
          .select('id')
          .eq('id', client_id)
          .single() : null

        return apiError('Foreign key constraint violation', 400, {
          hint: 'The tenant_id, project_id, or client_id does not exist in the database',
          diagnostics: {
            tenantExists: !!tenantVerify,
            projectExists: project_id ? !!projectVerifyResult?.data : 'N/A',
            clientExists: client_id ? !!clientVerifyResult?.data : 'N/A',
          }
        })
      }

      return apiError(insertResult.error.message || 'Failed to create invoice', 500)
    }

    const invoice = insertResult.data as Record<string, unknown>

    // If project_id is provided, create invoice lines from time entries
    if (project_id && invoice?.id) {
      try {
        // Fetch project rate
        const { data: projectData } = await adminSupabase
          .from('projects')
          .select('base_rate_sek')
          .eq('id', project_id)
          .single()

        const rate = Number((projectData as Record<string, unknown>)?.base_rate_sek) || 360

        // Fetch unbilled time entries for this project
        const { data: timeEntries, error: entriesError } = await adminSupabase
          .from('time_entries')
          .select('id, hours_total, date, start_time, end_time, description, employee_id, ob_type')
          .eq('project_id', project_id)
          .eq('is_billed', false)
          .eq('tenant_id', verifiedTenantId)
          .order('date', { ascending: true })
          .order('start_time', { ascending: true })

        if (entriesError) {
          console.error('Error fetching time entries:', entriesError)
        }

        if (!entriesError && timeEntries && timeEntries.length > 0) {
          // Create invoice lines from time entries
          const invoiceLines = timeEntries.map((entry: Record<string, unknown>, index: number) => {
            const hours = Number(entry.hours_total) || 0
            const entryDate = entry.date ? new Date(entry.date as string).toLocaleDateString('sv-SE') : 'Okant datum'
            const timeInfo = entry.start_time ? ` (${(entry.start_time as string).substring(0, 5)}${entry.end_time ? `-${(entry.end_time as string).substring(0, 5)}` : ''})` : ''
            const obInfo = entry.ob_type && entry.ob_type !== 'work' ? ` [${entry.ob_type}]` : ''
            const descInfo = entry.description ? ` - ${entry.description}` : ''
            const lineDescription = `Timmar ${entryDate}${timeInfo}${obInfo}${descInfo}`

            return {
              invoice_id: invoice.id,
              tenant_id: verifiedTenantId,
              sort_order: index,
              description: lineDescription,
              quantity: hours,
              unit: 'tim',
              rate_sek: rate,
              amount_sek: hours * rate,
              time_entry_id: entry.id,
            }
          })

          // Remove time_entry_id to avoid potential column errors
          const linesToInsert = invoiceLines.map(({ time_entry_id, ...line }) => line)

          let linesInsertResult = await adminSupabase
            .from('invoice_lines')
            .insert(linesToInsert)
            .select()

          let linesError = linesInsertResult.error

          // If insert failed, try with minimal fields
          if (linesError && (linesError.code === '42703' || linesError.code === '400')) {
            const minimalLines = linesToInsert.map(line => ({
              invoice_id: line.invoice_id,
              tenant_id: line.tenant_id,
              sort_order: line.sort_order,
              description: line.description,
              quantity: line.quantity,
              amount_sek: line.amount_sek,
            }))

            linesInsertResult = await adminSupabase
              .from('invoice_lines')
              .insert(minimalLines)
              .select()

            if (!linesInsertResult.error) {
              linesError = null
            } else {
              linesError = linesInsertResult.error
            }
          }

          if (linesError) {
            console.error('Error creating invoice lines:', linesError)
            return apiSuccess({
              data: invoice,
              warning: 'Invoice created but failed to create invoice lines',
              error: linesError.message || 'Failed to create invoice lines',
            })
          } else {
            // Recalculate total amount from invoice lines
            const totalAmount = invoiceLines.reduce((sum, line) => sum + Number(line.amount_sek || 0), 0)

            // Update invoice amount if it differs
            if (totalAmount > 0 && totalAmount !== Number(amount || 0)) {
              await adminSupabase
                .from('invoices')
                .update({ amount: totalAmount })
                .eq('id', invoice.id)
                .eq('tenant_id', verifiedTenantId)

              invoice.amount = totalAmount
            }

            // Store time entry IDs for frontend
            invoice.time_entry_ids = timeEntries.map((e: Record<string, unknown>) => e.id)
          }
        }
      } catch (linesError) {
        console.error('Error creating invoice lines from time entries:', linesError)
        // Continue - invoice is created even if lines fail
      }
    }

    return apiSuccess({ data: invoice })
  } catch (err) {
    return handleRouteError(err)
  }
}
