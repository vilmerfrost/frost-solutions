import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuthAdmin, apiError, apiSuccess, handleRouteError } from '@/lib/api'
import { createSigningOrder } from '@/lib/signing/idura-client'
import {
  generateAtaPdf,
  generateContractPdf,
  generateInvoicePdf,
  type TenantInfo,
  type AtaDocumentData,
  type ContractData,
  type InvoiceData,
  type InvoiceLineItem,
} from '@/lib/pdf/generate'

const CreateSigningSchema = z.object({
  documentType: z.enum(['quote', 'invoice', 'ata']),
  documentId: z.string().uuid(),
  signatories: z
    .array(z.object({ reference: z.string().min(1) }))
    .min(1)
    .optional(),
})

const TABLE_MAP: Record<string, string> = {
  quote: 'quotes',
  invoice: 'invoices',
  ata: 'aeta_requests',
}

export async function POST(req: NextRequest) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const body = await req.json()
    const parsed = CreateSigningSchema.safeParse(body)
    if (!parsed.success) {
      return apiError(
        `Validation error: ${parsed.error.issues.map(i => i.message).join(', ')}`,
        400,
      )
    }

    const { documentType, documentId, signatories: requestSignatories } = parsed.data

    // -----------------------------------------------------------------------
    // 1. Fetch the document
    // -----------------------------------------------------------------------
    const { data: document, error: docError } = await auth.admin
      .from(TABLE_MAP[documentType])
      .select('*')
      .eq('id', documentId)
      .eq('tenant_id', auth.tenantId)
      .single()

    if (docError || !document) {
      return apiError('Dokumentet hittades inte', 404)
    }

    // -----------------------------------------------------------------------
    // 2. Fetch tenant info for the PDF header
    // -----------------------------------------------------------------------
    const { data: tenant } = await auth.admin
      .from('tenants')
      .select('name, org_number, org_nr')
      .eq('id', auth.tenantId)
      .single()

    const tenantInfo: TenantInfo = {
      name: tenant?.name ?? 'Företag',
      org_number: tenant?.org_number ?? tenant?.org_nr ?? null,
    }

    // -----------------------------------------------------------------------
    // 3. Generate the PDF
    // -----------------------------------------------------------------------
    let pdfBytes: Uint8Array
    let documentTitle: string

    switch (documentType) {
      case 'ata': {
        // Fetch project name for context
        let projectName: string | undefined
        if (document.project_id) {
          const { data: project } = await auth.admin
            .from('projects')
            .select('name, customer_name')
            .eq('id', document.project_id)
            .single()
          projectName = project?.name ?? undefined
          // Attach customer name if available
          ;(document as Record<string, unknown>).customer_name_resolved =
            project?.customer_name ?? undefined
        }

        const ataData: AtaDocumentData = {
          id: document.id,
          title: document.title,
          description: document.description,
          change_type: document.change_type,
          status: document.status,
          hours: document.hours,
          custom_hourly_rate: document.custom_hourly_rate,
          estimated_material_cost: document.estimated_material_cost,
          ordered_by_name: document.ordered_by_name,
          customer_email: document.customer_email,
          photos: document.photos,
          created_at: document.created_at,
          project_name: projectName,
          customer_name: (document as Record<string, unknown>).customer_name_resolved as string | undefined,
        }
        documentTitle = `ÄTA ${ataData.title ?? ataData.id.slice(0, 8)}`
        pdfBytes = await generateAtaPdf(ataData, tenantInfo)
        break
      }

      case 'quote': {
        // Fetch project + customer info for the contract PDF
        let projectName: string | undefined
        let siteAddress: string | null = null
        let customerOrgNumber: string | null = null

        if (document.project_id) {
          const { data: project } = await auth.admin
            .from('projects')
            .select('name, site_address, customer_orgnr')
            .eq('id', document.project_id)
            .single()
          projectName = project?.name ?? undefined
          siteAddress = project?.site_address ?? null
          customerOrgNumber = project?.customer_orgnr ?? null
        }

        // Fetch customer name from clients table
        let customerName = 'Kund'
        if (document.customer_id) {
          const { data: client } = await auth.admin
            .from('clients')
            .select('name')
            .eq('id', document.customer_id)
            .single()
          customerName = client?.name ?? 'Kund'
        }

        const contractData: ContractData = {
          title: document.title,
          quote_number: document.quote_number,
          customer_name: customerName,
          customer_org_number: customerOrgNumber,
          project_name: projectName,
          site_address: siteAddress,
          scope_description: document.notes ?? undefined,
          total_amount: document.total_amount ?? 0,
          currency: document.currency,
          valid_until: document.valid_until,
          notes: document.kma_enabled ? document.kma_content : null,
          created_at: document.created_at,
        }
        documentTitle = `Avtal ${contractData.quote_number ?? contractData.title}`
        pdfBytes = await generateContractPdf(contractData, tenantInfo)
        break
      }

      case 'invoice': {
        // Fetch line items
        const { data: lines } = await auth.admin
          .from('invoice_lines')
          .select('description, quantity, unit, rate, amount')
          .eq('invoice_id', documentId)
          .order('sort_order', { ascending: true })

        // Check if project has ROT
        let isRotRut = false
        if (document.project_id) {
          const { data: project } = await auth.admin
            .from('projects')
            .select('is_rot_rut')
            .eq('id', document.project_id)
            .single()
          isRotRut = project?.is_rot_rut ?? false
        }

        const invoiceData: InvoiceData = {
          id: document.id,
          invoice_date: document.invoice_date,
          due_date: document.due_date,
          ocr_number: document.ocr_number,
          customer_name: document.customer_name,
          payment_terms: document.payment_terms,
          bank_account_iban: document.bank_account_iban,
          subtotal: document.subtotal,
          vat_rate: document.vat_rate,
          vat_amount: document.vat_amount,
          total_including_vat: document.total_including_vat,
          notes_to_customer: document.notes_to_customer,
          lines: (lines ?? []) as InvoiceLineItem[],
          is_rot_rut: isRotRut,
          labor_total: document.labor_total,
        }
        documentTitle = `Faktura ${invoiceData.ocr_number ?? invoiceData.id.slice(0, 8)}`
        pdfBytes = await generateInvoicePdf(invoiceData, tenantInfo)
        break
      }

      default:
        return apiError('Okänd dokumenttyp', 400)
    }

    // -----------------------------------------------------------------------
    // 4. Upload the unsigned PDF to Supabase Storage
    // -----------------------------------------------------------------------
    const storagePath = `${auth.tenantId}/${documentType}/${documentId}.pdf`

    const { error: uploadError } = await auth.admin.storage
      .from('documents')
      .upload(storagePath, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (uploadError) {
      console.error('PDF upload error:', uploadError)
      return apiError('Kunde inte ladda upp PDF', 500)
    }

    // -----------------------------------------------------------------------
    // 5. Initiate signing via Idura/Criipto
    // -----------------------------------------------------------------------
    const pdfBase64 = Buffer.from(pdfBytes).toString('base64')

    const appUrl = process.env.NEXT_PUBLIC_APP_URL
      ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
    const webhookUrl = `${appUrl}/api/signing/webhook`

    const signatories = requestSignatories ?? [{ reference: auth.user.email }]

    const order = await createSigningOrder({
      documentTitle,
      documentPdfBase64: pdfBase64,
      signatories,
      webhookUrl,
    })

    // -----------------------------------------------------------------------
    // 6. Save signing order to database
    // -----------------------------------------------------------------------
    const { error: insertError } = await auth.admin.from('signing_orders').insert({
      tenant_id: auth.tenantId,
      document_type: documentType,
      document_id: documentId,
      idura_order_id: order.id,
      status: 'pending',
      signatories: order.signatories.map(s => ({
        id: s.id,
        reference: s.reference,
        status: s.status,
        href: s.href,
      })),
    })

    if (insertError) {
      console.error('Signing order insert error:', insertError)
      return apiError('Kunde inte spara signeringsorder', 500)
    }

    // -----------------------------------------------------------------------
    // 7. Return signing URLs
    // -----------------------------------------------------------------------
    return apiSuccess({
      orderId: order.id,
      signatories: order.signatories.map(s => ({
        id: s.id,
        reference: s.reference,
        signingUrl: s.href,
      })),
      documentStoragePath: storagePath,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
