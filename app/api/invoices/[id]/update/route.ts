import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuthAdmin, parseBody, apiSuccess, apiError, handleRouteError } from '@/lib/api'

const UpdateInvoiceSchema = z.object({
  tenant_id: z.string().uuid('tenant_id must be a valid UUID'),
  amount: z.union([z.number(), z.string()]).optional().nullable(),
  customer_name: z.string().optional().nullable(),
  desc: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
  issue_date: z.string().optional().nullable(),
  due_date: z.string().optional().nullable(),
})

/**
 * API route for updating invoices with service role
 * Verifies tenant_id, admin access, and handles missing columns progressively
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: invoiceId } = await params

    if (!invoiceId) {
      return apiError('Missing invoice id', 400)
    }

    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const body = await parseBody(req, UpdateInvoiceSchema)
    if (body.error) return body.error

    const {
      tenant_id,
      amount,
      customer_name,
      desc,
      description,
      status,
      issue_date,
      due_date,
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
      return apiError('Admin access required to update invoices', 403)
    }

    // Build update payload
    const updatePayload: Record<string, unknown> = {}

    if (amount !== undefined && amount !== null) updatePayload.amount = Number(amount) || 0
    if (customer_name !== undefined) updatePayload.customer_name = customer_name
    if (status !== undefined) updatePayload.status = status
    if (issue_date !== undefined) updatePayload.issue_date = issue_date
    if (due_date !== undefined) updatePayload.due_date = due_date

    // Add description (try both 'desc' and 'description' columns)
    if (desc || description) {
      const descValue = desc || description
      updatePayload.desc = descValue
      updatePayload.description = descValue
    }

    // Try progressively: start with all columns, then fallback
    let updateResult = await adminSupabase
      .from('invoices')
      .update(updatePayload)
      .eq('id', invoiceId)
      .eq('tenant_id', verifiedTenantId)
      .select()
      .single()

    // Attempt 2: If desc fails, try without desc (keep description)
    if (updateResult.error && (updateResult.error.code === '42703' || updateResult.error.message?.includes('desc'))) {
      const { desc: _, ...payloadWithoutDesc } = updatePayload
      updateResult = await adminSupabase
        .from('invoices')
        .update(payloadWithoutDesc)
        .eq('id', invoiceId)
        .eq('tenant_id', verifiedTenantId)
        .select()
        .single()
    }

    // Attempt 3: If description also fails, try without both
    if (updateResult.error && (updateResult.error.code === '42703' || updateResult.error.message?.includes('description'))) {
      const { desc: _, description: __, ...payloadWithoutBoth } = updatePayload
      updateResult = await adminSupabase
        .from('invoices')
        .update(payloadWithoutBoth)
        .eq('id', invoiceId)
        .eq('tenant_id', verifiedTenantId)
        .select()
        .single()
    }

    // Attempt 4: If customer_name fails, try without it
    if (updateResult.error && (updateResult.error.code === '42703' || updateResult.error.message?.includes('customer_name'))) {
      const { customer_name: _, ...payloadWithoutCustomerName } = updatePayload
      updateResult = await adminSupabase
        .from('invoices')
        .update(payloadWithoutCustomerName)
        .eq('id', invoiceId)
        .eq('tenant_id', verifiedTenantId)
        .select()
        .single()
    }

    if (updateResult.error) {
      console.error('Error updating invoice (all fallbacks failed):', updateResult.error)
      return apiError(updateResult.error.message || 'Failed to update invoice', 500)
    }

    if (!updateResult.data) {
      return apiError('Invoice not found or you do not have access', 404)
    }

    return apiSuccess({ data: updateResult.data })
  } catch (err) {
    return handleRouteError(err)
  }
}
