import { generateRotXml } from '@/lib/domain/rot/xml-generator'

describe('generateRotXml', () => {
  const validApplication = {
    batchName: 'FROST-2026-04',
    cases: [{
      personnummer: '199001011234',
      paymentDate: '2026-03-15',
      laborCost: 50000,
      amountPaid: 50000,
      requestedAmount: 15000,
      invoiceNumber: 'F-001',
      propertyDesignation: 'Stockholm Vasastan 1:2',
      workTypes: {
        bygg: { hours: 40, materialCost: 5000 },
        el: { hours: 8, materialCost: 2000 },
      },
    }],
  }

  it('generates valid XML with correct root element', () => {
    const xml = generateRotXml(validApplication)
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>')
    expect(xml).toContain('<Begaran')
    expect(xml).toContain('xmlns="http://xmls.skatteverket.se/se/skatteverket/ht/begaran/6.0"')
  })

  it('includes NamnPaBegaran', () => {
    const xml = generateRotXml(validApplication)
    expect(xml).toContain('<NamnPaBegaran>FROST-2026-04</NamnPaBegaran>')
  })

  it('uses RotBegaran wrapper', () => {
    const xml = generateRotXml(validApplication)
    expect(xml).toContain('<RotBegaran>')
    expect(xml).toContain('<Arenden>')
  })

  it('maps personnummer to Kopare element', () => {
    const xml = generateRotXml(validApplication)
    expect(xml).toContain('<Kopare>199001011234</Kopare>')
  })

  it('maps work types correctly', () => {
    const xml = generateRotXml(validApplication)
    expect(xml).toContain('<Bygg>')
    expect(xml).toContain('<AntalTimmar>40</AntalTimmar>')
    expect(xml).toContain('<Materialkostnad>5000</Materialkostnad>')
    expect(xml).toContain('<El>')
    expect(xml).toContain('<AntalTimmar>8</AntalTimmar>')
    expect(xml).toContain('<Materialkostnad>2000</Materialkostnad>')
  })

  it('includes optional fields when provided', () => {
    const xml = generateRotXml(validApplication)
    expect(xml).toContain('<FakturaNr>F-001</FakturaNr>')
    expect(xml).toContain('<Fastighetsbeteckning>Stockholm Vasastan 1:2</Fastighetsbeteckning>')
  })

  it('includes financial fields as integers', () => {
    const xml = generateRotXml(validApplication)
    expect(xml).toContain('<PrisForArbete>50000</PrisForArbete>')
    expect(xml).toContain('<BetaltBelopp>50000</BetaltBelopp>')
    expect(xml).toContain('<BegartBelopp>15000</BegartBelopp>')
  })

  it('validates batch name length (max 16 chars)', () => {
    expect(() => generateRotXml({
      ...validApplication,
      batchName: 'THIS-IS-TOO-LONG-BATCH-NAME'
    })).toThrow('Batch name max 16 characters')
  })

  it('validates personnummer is 12 digits', () => {
    expect(() => generateRotXml({
      ...validApplication,
      cases: [{ ...validApplication.cases[0], personnummer: '12345' }]
    })).toThrow('Invalid personnummer: must be 12 digits')
  })

  it('rejects empty cases', () => {
    expect(() => generateRotXml({
      batchName: 'TEST',
      cases: [],
    })).toThrow('At least one case required')
  })

  it('rejects more than 100 cases', () => {
    const cases = Array.from({ length: 101 }, () => ({
      ...validApplication.cases[0],
    }))
    expect(() => generateRotXml({ batchName: 'TEST', cases })).toThrow('Max 100 cases per file')
  })

  it('escapes XML special characters in string fields', () => {
    const xml = generateRotXml({
      ...validApplication,
      cases: [{
        ...validApplication.cases[0],
        propertyDesignation: 'Test & <Property>',
      }],
    })
    expect(xml).toContain('Test &amp; &lt;Property&gt;')
  })
})
