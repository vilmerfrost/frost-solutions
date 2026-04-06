import { NextRequest } from 'next/server'
import { resolveAuthAdmin, apiSuccess, apiError, handleRouteError } from '@/lib/api'
import { validateTransition } from '@/lib/ata/workflow'
import { logAtaEvent } from '@/lib/ata/audit'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { id } = await params

    // Fetch ÄTA
    const { data: ata } = await auth.admin
      .from('rot_applications')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', auth.tenantId)
      .single()

    if (!ata) return apiError('ÄTA not found', 404)

    const currentStatus = ata.status_timeline?.[ata.status_timeline.length - 1]?.status ?? 'created'
    const statusesToAppend =
      currentStatus === 'customer_approved'
        ? ['work_completed', 'invoice_generated']
        : ['invoice_generated']

    if (currentStatus === 'customer_approved') {
      const completionValidation = validateTransition(currentStatus, 'work_completed')
      if (!completionValidation.valid) return apiError(completionValidation.error!, 400)
    }

    const validation = validateTransition(
      statusesToAppend[statusesToAppend.length - 1] === 'invoice_generated' && currentStatus === 'customer_approved'
        ? 'work_completed'
        : currentStatus,
      'invoice_generated'
    )
    if (!validation.valid) return apiError(validation.error!, 400)

    // Fetch project + client for invoice
    const { data: project } = await auth.admin
      .from('projects')
      .select('id, name, client_id')
      .eq('id', ata.project_id)
      .eq('tenant_id', auth.tenantId)
      .single()

    if (!project) return apiError('Project not found', 404)

    // Calculate totals
    const laborTotal = (ata.labor_hours ?? 0) * (ata.labor_rate_sek ?? 0)
    const materialTotal = ata.cost_frame ? Number(ata.cost_frame) - laborTotal : 0
    const totalAmount = laborTotal + Math.max(materialTotal, 0)

    // Create invoice
    const invoiceNumber = `ATA-${Date.now().toString(36).toUpperCase()}`

    const { data: invoice, error: invoiceError } = await auth.admin
      .from('invoices')
      .insert({
        tenant_id: auth.tenantId,
        project_id: ata.project_id,
        client_id: project.client_id,
        invoice_number: invoiceNumber,
        amount: totalAmount,
        total_amount: totalAmount,
        status: 'draft',
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        items: [
          {
            description: `ÄTA: ${ata.description}`,
            quantity: ata.labor_hours ?? 1,
            unit_price: ata.labor_rate_sek ?? totalAmount,
            total: laborTotal,
            type: 'labor',
          },
          ...(materialTotal > 0
            ? [
                {
                  description: 'Materialkostnad',
                  quantity: 1,
                  unit_price: materialTotal,
                  total: materialTotal,
                  type: 'material',
                },
              ]
            : []),
        ],
      })
      .select()
      .single()

    if (invoiceError || !invoice) {
      return apiError('Failed to create invoice', 500)
    }

    // Update ÄTA with invoice reference
    const eventTimestamp = new Date().toISOString()
    const timeline = [
      ...(ata.status_timeline ?? []),
      ...statusesToAppend.map((status) => ({
        status,
        timestamp: eventTimestamp,
        user_id: auth.user.id,
      })),
    ]

    await auth.admin
      .from('rot_applications')
      .update({
        invoice_mode: 'separate',
        status_timeline: timeline,
      })
      .eq('id', id)
      .eq('tenant_id', auth.tenantId)

    // Fetch audit trail for documentation
    const { data: auditTrail } = await auth.admin
      .from('ata_audit_trail')
      .select('*')
      .eq('ata_id', id)
      .order('created_at', { ascending: true })

    const { data: employee } = await auth.admin
      .from('employees')
      .select('id')
      .eq('auth_user_id', auth.user.id)
      .eq('tenant_id', auth.tenantId)
      .single()

    await logAtaEvent({
      tenantId: auth.tenantId,
      ataId: id,
      eventType: 'invoice_generated',
      actorId: employee?.id ?? auth.user.id,
      actorType: 'employee',
      data: {
        invoice_id: invoice.id,
        invoice_number: invoiceNumber,
        total_amount: totalAmount,
        audit_trail_entries: auditTrail?.length ?? 0,
      },
      ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
      userAgent: req.headers.get('user-agent') ?? undefined,
    })

    return apiSuccess({
      invoice_id: invoice.id,
      invoice_number: invoiceNumber,
      total_amount: totalAmount,
      audit_trail: auditTrail,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
