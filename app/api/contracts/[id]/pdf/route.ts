import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { resolveAuthAdmin, apiError, handleRouteError } from '@/lib/api'
import { ContractPDF } from '@/lib/pdf/contract-template'

export const runtime = 'nodejs'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { data: contract, error: cErr } = await auth.admin
      .from('contracts')
      .select('*, client:clients(id, name), project:projects(id, name)')
      .eq('id', id)
      .eq('tenant_id', auth.tenantId)
      .maybeSingle()

    if (cErr || !contract) return apiError('Contract not found', 404)

    const { data: items } = await auth.admin
      .from('contract_items')
      .select('*')
      .eq('contract_id', id)
      .order('sort_order', { ascending: true })

    const { data: tenant } = await auth.admin
      .from('tenants')
      .select('name')
      .eq('id', auth.tenantId)
      .single()

    const pdfBuffer = await renderToBuffer(
      <ContractPDF
        contract={contract}
        items={items ?? []}
        tenantName={tenant?.name ?? 'Foretag'}
      />
    )

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="avtal-${contract.contract_number}.pdf"`,
      },
    })
  } catch (e) {
    return handleRouteError(e)
  }
}
