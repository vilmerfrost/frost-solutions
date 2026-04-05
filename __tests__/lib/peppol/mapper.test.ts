import { mapToPeppolInvoice, PeppolInvoiceInput } from '@/lib/peppol/mapper'

describe('mapToPeppolInvoice', () => {
  const validInput: PeppolInvoiceInput = {
    invoiceNumber: 'F-2026-001',
    issueDate: '2026-04-01',
    dueDate: '2026-04-30',
    currency: 'SEK',
    supplier: {
      name: 'Frost Solutions AB',
      orgNumber: '5591234567',
      vatNumber: 'SE559123456701',
      address: { street: 'Storgatan 1', city: 'Stockholm', zip: '11122', country: 'SE' },
    },
    customer: {
      name: 'Kund AB',
      orgNumber: '5567891234',
      vatNumber: 'SE556789123401',
      address: { street: 'Kundgatan 5', city: 'Gothenburg', zip: '41101', country: 'SE' },
    },
    lines: [
      { description: 'Bygg - renovering', quantity: 10, unitPrice: 500, vatPercent: 25, unitCode: 'HUR' },
      { description: 'Material', quantity: 1, unitPrice: 2000, vatPercent: 25 },
    ],
  }

  it('maps a valid invoice with correct totals', () => {
    const result = mapToPeppolInvoice(validInput)

    expect(result.invoiceNumber).toBe('F-2026-001')
    expect(result.currency).toBe('SEK')
    expect(result.supplier.endpointScheme).toBe('0007')
    expect(result.supplier.endpointId).toBe('5591234567')
    expect(result.customer.endpointScheme).toBe('0007')

    // Line amounts: 10*500=5000 + 1*2000=2000 = 7000
    expect(result.totals.lineExtensionAmount).toBe(7000)
    expect(result.totals.taxExclusiveAmount).toBe(7000)
    // Tax: 5000*0.25 + 2000*0.25 = 1750
    expect(result.totals.taxAmount).toBe(1750)
    expect(result.totals.taxInclusiveAmount).toBe(8750)
    expect(result.totals.payableAmount).toBe(8750)
  })

  it('rejects invalid supplier org number', () => {
    expect(() => mapToPeppolInvoice({
      ...validInput,
      supplier: { ...validInput.supplier, orgNumber: '12345' },
    })).toThrow('Supplier org number must be 10 digits')
  })

  it('rejects invalid customer org number', () => {
    expect(() => mapToPeppolInvoice({
      ...validInput,
      customer: { ...validInput.customer, orgNumber: 'ABC1234567' },
    })).toThrow('Customer org number must be 10 digits')
  })

  it('handles multiple tax rates', () => {
    const multiTaxInput: PeppolInvoiceInput = {
      ...validInput,
      lines: [
        { description: 'Service 25%', quantity: 1, unitPrice: 1000, vatPercent: 25 },
        { description: 'Food 12%', quantity: 1, unitPrice: 500, vatPercent: 12 },
        { description: 'Books 6%', quantity: 1, unitPrice: 200, vatPercent: 6 },
        { description: 'Export 0%', quantity: 1, unitPrice: 300, vatPercent: 0 },
      ],
    }

    const result = mapToPeppolInvoice(multiTaxInput)

    expect(result.lines).toHaveLength(4)
    expect(result.lines[0].taxCategory).toBe('S')
    expect(result.lines[3].taxCategory).toBe('Z')

    // subtotal = 1000 + 500 + 200 + 300 = 2000
    expect(result.totals.lineExtensionAmount).toBe(2000)
    // tax = 250 + 60 + 12 + 0 = 322
    expect(result.totals.taxAmount).toBe(322)
    expect(result.totals.payableAmount).toBe(2322)
  })

  it('calculates line amounts correctly', () => {
    const result = mapToPeppolInvoice(validInput)

    expect(result.lines[0].lineAmount).toBe(5000)
    expect(result.lines[0].unitCode).toBe('HUR')
    expect(result.lines[1].lineAmount).toBe(2000)
    expect(result.lines[1].unitCode).toBe('EA')
  })

  it('sets correct line IDs', () => {
    const result = mapToPeppolInvoice(validInput)
    expect(result.lines[0].id).toBe('1')
    expect(result.lines[1].id).toBe('2')
  })
})
