/**
 * Skatteverket ROT XML generator — Begaran.xsd v6
 *
 * Produces valid XML for manual upload to Skatteverket's portal.
 * Root: <Begaran xmlns="http://xmls.skatteverket.se/se/skatteverket/ht/begaran/6.0">
 */

export type RotWorkType =
  | 'bygg'
  | 'el'
  | 'glasPlatarbete'
  | 'markDraneringarbete'
  | 'murning'
  | 'malningTapetsering'
  | 'vvs'

export interface RotCase {
  personnummer: string        // 12 digits YYYYMMDDXXXX
  paymentDate: string         // YYYY-MM-DD
  laborCost: number           // PrisForArbete (integer SEK)
  amountPaid: number          // BetaltBelopp (integer SEK)
  requestedAmount: number     // BegartBelopp (integer SEK)
  invoiceNumber?: string      // max 20 chars
  otherCost?: number          // Ovrigkostnad
  propertyDesignation?: string // Fastighetsbeteckning
  apartmentNumber?: string    // LagenhetsNr
  brfOrgNumber?: string       // BrfOrgNr
  workTypes: Partial<Record<RotWorkType, { hours: number; materialCost: number }>>
}

export interface RotBatch {
  batchName: string  // max 16 chars (NamnPaBegaran)
  cases: RotCase[]
}

const WORK_TYPE_ELEMENTS: Record<RotWorkType, string> = {
  bygg: 'Bygg',
  el: 'El',
  glasPlatarbete: 'GlasPlatarbete',
  markDraneringarbete: 'MarkDraneringarbete',
  murning: 'Murning',
  malningTapetsering: 'MalningTapetsering',
  vvs: 'Vvs',
}

export function generateRotXml(batch: RotBatch): string {
  // Validation
  if (batch.batchName.length > 16) {
    throw new Error('Batch name max 16 characters')
  }
  if (batch.cases.length === 0) {
    throw new Error('At least one case required')
  }
  if (batch.cases.length > 100) {
    throw new Error('Max 100 cases per file')
  }

  for (const c of batch.cases) {
    if (!/^\d{12}$/.test(c.personnummer)) {
      throw new Error(`Invalid personnummer: must be 12 digits`)
    }
    if (c.invoiceNumber && c.invoiceNumber.length > 20) {
      throw new Error('Invoice number max 20 characters')
    }
  }

  const casesXml = batch.cases.map(c => {
    const workXml = Object.entries(c.workTypes)
      .filter(([, v]) => v)
      .map(([type, data]) => {
        const element = WORK_TYPE_ELEMENTS[type as RotWorkType]
        return `        <${element}><AntalTimmar>${data!.hours}</AntalTimmar><Materialkostnad>${data!.materialCost}</Materialkostnad></${element}>`
      }).join('\n')

    const optionalFields = [
      c.invoiceNumber ? `        <FakturaNr>${escapeXml(c.invoiceNumber)}</FakturaNr>` : '',
      c.otherCost ? `        <Ovrigkostnad>${Math.round(c.otherCost)}</Ovrigkostnad>` : '',
      c.propertyDesignation ? `        <Fastighetsbeteckning>${escapeXml(c.propertyDesignation)}</Fastighetsbeteckning>` : '',
      c.apartmentNumber ? `        <LagenhetsNr>${escapeXml(c.apartmentNumber)}</LagenhetsNr>` : '',
      c.brfOrgNumber ? `        <BrfOrgNr>${escapeXml(c.brfOrgNumber)}</BrfOrgNr>` : '',
    ].filter(Boolean).join('\n')

    return `      <Arende>
        <Kopare>${c.personnummer}</Kopare>
        <BetalningsDatum>${c.paymentDate}</BetalningsDatum>
        <PrisForArbete>${Math.round(c.laborCost)}</PrisForArbete>
        <BetaltBelopp>${Math.round(c.amountPaid)}</BetaltBelopp>
        <BegartBelopp>${Math.round(c.requestedAmount)}</BegartBelopp>
${optionalFields ? optionalFields + '\n' : ''}${workXml ? `        <UtfortArbete>\n${workXml}\n        </UtfortArbete>\n` : ''}      </Arende>`
  }).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<Begaran xmlns="http://xmls.skatteverket.se/se/skatteverket/ht/begaran/6.0">
  <NamnPaBegaran>${escapeXml(batch.batchName)}</NamnPaBegaran>
  <RotBegaran>
    <Arenden>
${casesXml}
    </Arenden>
  </RotBegaran>
</Begaran>`
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Backward-compatible wrapper for rot.service.ts.
 * Maps the old RotApplication interface to the new RotBatch format.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function generateSkatteverketXml(application: any): string {
  const batch: RotBatch = {
    batchName: `ROT-${String(application.id).substring(0, 8)}`,
    cases: [{
      personnummer: application.customer_personnummer,
      paymentDate: application.invoice_date instanceof Date
        ? application.invoice_date.toISOString().split('T')[0]
        : String(application.invoice_date),
      laborCost: application.labor_cost,
      amountPaid: application.total_amount,
      requestedAmount: application.deductible_amount,
      invoiceNumber: application.invoice_id,
      propertyDesignation: application.property_designation,
      apartmentNumber: application.apartment_number,
      workTypes: {
        bygg: { hours: 0, materialCost: application.material_cost || 0 },
      },
    }],
  }
  return generateRotXml(batch)
}
