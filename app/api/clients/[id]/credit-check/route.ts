import { NextRequest } from 'next/server'
import { apiSuccess, apiError, handleRouteError } from '@/lib/api'
import { resolveAuthAdmin } from '@/lib/api/auth'
import { performCreditCheck } from '@/lib/credit/check'

/**
 * POST /api/clients/[id]/credit-check
 * Performs a credit check on a client by org number.
 * Stores the result in the client record.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { admin, tenantId } = auth

    // Fetch client
    const { data: client, error: clientError } = await admin
      .from('clients')
      .select('id, name, org_number')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single()

    if (clientError || !client) {
      return apiError('Client not found', 404)
    }

    if (!client.org_number) {
      return apiError('Client has no org number — credit check requires an org number', 400)
    }

    // Perform credit check
    const result = await performCreditCheck(client.org_number)

    // Store result in client record
    await admin
      .from('clients')
      .update({
        credit_score: result.riskScore,
        credit_level: result.riskLevel,
        credit_checked_at: result.checkedAt,
      })
      .eq('id', id)
      .eq('tenant_id', tenantId)

    return apiSuccess(result)
  } catch (error) {
    return handleRouteError(error)
  }
}
