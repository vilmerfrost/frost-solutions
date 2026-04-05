import { NextRequest } from 'next/server'
import { resolveAuthAdmin, apiError, handleRouteError } from '@/lib/api'
import { generateRotXml, RotBatch } from '@/lib/domain/rot/xml-generator'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { id } = await params

    // Fetch the ROT application from the database
    const { data: application, error } = await auth.admin
      .from('rot_applications')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', auth.tenantId)
      .single()

    if (error || !application) {
      return apiError('ROT application not found', 404)
    }

    // Build the batch from the application data
    const batch: RotBatch = {
      batchName: `ROT-${String(application.id).substring(0, 8)}`,
      cases: [{
        personnummer: application.customer_personnummer,
        paymentDate: application.invoice_date
          ? String(application.invoice_date).split('T')[0]
          : new Date().toISOString().split('T')[0],
        laborCost: application.labor_cost || 0,
        amountPaid: application.total_amount || 0,
        requestedAmount: application.deductible_amount || 0,
        invoiceNumber: application.invoice_id,
        propertyDesignation: application.property_designation,
        apartmentNumber: application.apartment_number,
        workTypes: {
          bygg: {
            hours: 0,
            materialCost: application.material_cost || 0,
          },
        },
      }],
    }

    const xml = generateRotXml(batch)

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=UTF-8',
        'Content-Disposition': `attachment; filename="rot-begaran-${application.id}.xml"`,
      },
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
