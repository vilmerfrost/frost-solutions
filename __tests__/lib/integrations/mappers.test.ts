/**
 * @jest-environment node
 */
import {
  mapFrostInvoiceToFortnox,
  mapFortnoxInvoiceToFrost,
  mapFrostClientToFortnox,
  mapFortnoxCustomerToFrost,
  mapFrostInvoiceToVisma,
  mapVismaInvoiceToFrost,
  mapFrostClientToVisma,
  mapVismaCustomerToFrost,
  MapperValidationError,
} from '@/lib/integrations/sync/mappers'

// --- Fortnox Invoice ---

describe('mapFrostInvoiceToFortnox', () => {
  const validInvoice = {
    customer: { external_id: 'C100' },
    date: '2026-01-15',
    due_date: '2026-02-15',
    reference: 'REF-001',
    notes: 'Test invoice',
    lines: [
      { description: 'Consulting', quantity: 10, unit_price: 1500, vat_percent: 25 },
      { description: 'Travel', quantity: 1, unit_price: 500, vat_percent: 12 },
    ],
  }

  it('maps a complete invoice with line items', () => {
    const result = mapFrostInvoiceToFortnox(validInvoice)
    expect(result.Invoice.CustomerNumber).toBe('C100')
    expect(result.Invoice.InvoiceDate).toBe('2026-01-15')
    expect(result.Invoice.DueDate).toBe('2026-02-15')
    expect(result.Invoice.YourOrderNumber).toBe('REF-001')
    expect(result.Invoice.Comments).toBe('Test invoice')
    expect(result.Invoice.InvoiceRows).toHaveLength(2)
    expect(result.Invoice.InvoiceRows[0]).toEqual({
      LineNumber: 1,
      Description: 'Consulting',
      Quantity: 10,
      Price: 1500,
      VAT: 25,
    })
    expect(result.Invoice.InvoiceRows[1].VAT).toBe(12)
  })

  it('throws on missing customer external_id', () => {
    expect(() => mapFrostInvoiceToFortnox({ ...validInvoice, customer: {} }))
      .toThrow(MapperValidationError)
  })

  it('throws on missing date', () => {
    expect(() => mapFrostInvoiceToFortnox({ ...validInvoice, date: null, created_at: null }))
      .toThrow(MapperValidationError)
  })
})

describe('mapFortnoxInvoiceToFrost', () => {
  const fortnoxInvoice = {
    Invoice: {
      DocumentNumber: 12345,
      CustomerNumber: 'C100',
      InvoiceDate: '2026-01-15',
      DueDate: '2026-02-15',
      YourOrderNumber: 'REF-001',
      Comments: 'Notes',
      InvoiceRows: [
        { ArticleNumber: 'A1', Description: 'Consulting', Quantity: 10, Price: 1500, VAT: 25 },
      ],
      LastModified: '2026-01-15T12:00:00Z',
    },
  }

  it('maps Fortnox invoice to Frost format', () => {
    const result = mapFortnoxInvoiceToFrost(fortnoxInvoice)
    expect(result.external_id).toBe('12345')
    expect(result.customerNumber).toBe('C100')
    expect(result.date).toBe('2026-01-15')
    expect(result.lines).toHaveLength(1)
    expect(result.lines[0].unit_price).toBe(1500)
    expect(result.updated_at).toBe('2026-01-15T12:00:00Z')
  })

  it('throws on missing DocumentNumber', () => {
    expect(() => mapFortnoxInvoiceToFrost({ Invoice: {} }))
      .toThrow(MapperValidationError)
  })

  it('throws on null input', () => {
    expect(() => mapFortnoxInvoiceToFrost(null))
      .toThrow(MapperValidationError)
  })
})

// --- Fortnox Customer ---

describe('mapFrostClientToFortnox', () => {
  const validClient = {
    id: 'abcdefgh-1234',
    name: 'Acme AB',
    email: 'info@acme.se',
    organisation_number: '5501011234',
    address: 'Storgatan 1',
    city: 'Stockholm',
    zip: '11122',
    country: 'SE',
  }

  it('maps all fields including OrganisationNumber and City', () => {
    const result = mapFrostClientToFortnox(validClient)
    expect(result.Customer.Name).toBe('Acme AB')
    expect(result.Customer.OrganisationNumber).toBe('5501011234')
    expect(result.Customer.City).toBe('Stockholm')
    expect(result.Customer.Email).toBe('info@acme.se')
    expect(result.Customer.CountryCode).toBe('SE')
  })

  it('throws on missing name', () => {
    expect(() => mapFrostClientToFortnox({ ...validClient, name: '' }))
      .toThrow(MapperValidationError)
  })
})

describe('mapFortnoxCustomerToFrost', () => {
  it('maps Fortnox customer to Frost format', () => {
    const result = mapFortnoxCustomerToFrost({
      Customer: {
        CustomerNumber: 'C100',
        Name: 'Acme AB',
        Email: 'info@acme.se',
        OrganisationNumber: '5501011234',
        Address1: 'Storgatan 1',
        City: 'Stockholm',
        ZipCode: '11122',
        CountryCode: 'SE',
      },
    })
    expect(result.external_id).toBe('C100')
    expect(result.name).toBe('Acme AB')
    expect(result.organisation_number).toBe('5501011234')
    expect(result.city).toBe('Stockholm')
  })

  it('throws on missing CustomerNumber', () => {
    expect(() => mapFortnoxCustomerToFrost({ Customer: { Name: 'Test' } }))
      .toThrow(MapperValidationError)
  })
})

// --- Visma Invoice ---

describe('mapFrostInvoiceToVisma', () => {
  it('maps valid invoice', () => {
    const result = mapFrostInvoiceToVisma({
      customer: { external_id: 'guid-123' },
      date: '2026-01-15',
      due_date: '2026-02-15',
      lines: [{ description: 'Work', quantity: 5, unit_price: 1000 }],
    })
    expect(result.CustomerId).toBe('guid-123')
    expect(result.Rows).toHaveLength(1)
  })

  it('throws on missing customer id', () => {
    expect(() => mapFrostInvoiceToVisma({ date: '2026-01-15' }))
      .toThrow(MapperValidationError)
  })
})

describe('mapVismaInvoiceToFrost', () => {
  it('maps Visma invoice to Frost', () => {
    const result = mapVismaInvoiceToFrost({
      Id: 'guid-456',
      CustomerId: 'guid-123',
      InvoiceDate: '2026-01-15',
      Rows: [{ Text: 'Work', Quantity: 5, UnitPrice: 1000 }],
    })
    expect(result.external_id).toBe('guid-456')
    expect(result.lines[0].description).toBe('Work')
  })

  it('throws on null input', () => {
    expect(() => mapVismaInvoiceToFrost(null))
      .toThrow(MapperValidationError)
  })
})

// --- Visma Customer ---

describe('mapFrostClientToVisma', () => {
  it('throws on missing name', () => {
    expect(() => mapFrostClientToVisma({ email: 'test@test.com' }))
      .toThrow(MapperValidationError)
  })

  it('maps valid client', () => {
    const result = mapFrostClientToVisma({ name: 'Test AB', city: 'Gothenburg' })
    expect(result.Name).toBe('Test AB')
    expect(result.City).toBe('Gothenburg')
  })
})

describe('mapVismaCustomerToFrost', () => {
  it('maps Visma customer to Frost', () => {
    const result = mapVismaCustomerToFrost({
      Id: 'guid-789',
      Name: 'Test AB',
      EmailAddress: 'test@test.com',
      City: 'Malmo',
    })
    expect(result.external_id).toBe('guid-789')
    expect(result.name).toBe('Test AB')
    expect(result.city).toBe('Malmo')
  })

  it('throws on null input', () => {
    expect(() => mapVismaCustomerToFrost(null))
      .toThrow(MapperValidationError)
  })
})
