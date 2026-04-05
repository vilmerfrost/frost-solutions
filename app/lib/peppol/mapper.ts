export interface PeppolInvoiceInput {
  invoiceNumber: string
  issueDate: string
  dueDate: string
  currency: string
  supplier: {
    name: string
    orgNumber: string
    vatNumber: string
    address: { street: string; city: string; zip: string; country: string }
  }
  customer: {
    name: string
    orgNumber: string
    vatNumber?: string
    address: { street: string; city: string; zip: string; country: string }
  }
  lines: Array<{
    description: string
    quantity: number
    unitPrice: number
    vatPercent: number
    unitCode?: string
  }>
}

export interface PeppolInvoice {
  invoiceNumber: string
  issueDate: string
  dueDate: string
  currency: string
  supplier: {
    endpointId: string
    endpointScheme: string
    name: string
    vatNumber: string
    address: { street: string; city: string; zip: string; country: string }
  }
  customer: {
    endpointId: string
    endpointScheme: string
    name: string
    vatNumber?: string
    address: { street: string; city: string; zip: string; country: string }
  }
  lines: Array<{
    id: string
    description: string
    quantity: number
    unitCode: string
    unitPrice: number
    taxCategory: string
    taxPercent: number
    lineAmount: number
  }>
  totals: {
    lineExtensionAmount: number
    taxExclusiveAmount: number
    taxInclusiveAmount: number
    payableAmount: number
    taxAmount: number
  }
}

export function mapToPeppolInvoice(input: PeppolInvoiceInput): PeppolInvoice {
  // Validate Swedish org numbers (10 digits)
  if (!/^\d{10}$/.test(input.supplier.orgNumber)) {
    throw new Error('Supplier org number must be 10 digits')
  }
  if (!/^\d{10}$/.test(input.customer.orgNumber)) {
    throw new Error('Customer org number must be 10 digits')
  }

  const lines = input.lines.map((line, i) => ({
    id: String(i + 1),
    description: line.description,
    quantity: line.quantity,
    unitCode: line.unitCode ?? 'EA',
    unitPrice: line.unitPrice,
    taxCategory: line.vatPercent === 0 ? 'Z' : 'S',
    taxPercent: line.vatPercent,
    lineAmount: Math.round(line.quantity * line.unitPrice * 100) / 100,
  }))

  const subtotal = lines.reduce((sum, l) => sum + l.lineAmount, 0)
  const taxAmount = Math.round(
    lines.reduce((sum, l) => sum + l.lineAmount * (l.taxPercent / 100), 0) * 100
  ) / 100

  return {
    invoiceNumber: input.invoiceNumber,
    issueDate: input.issueDate,
    dueDate: input.dueDate,
    currency: input.currency,
    supplier: {
      endpointId: input.supplier.orgNumber,
      endpointScheme: '0007',
      name: input.supplier.name,
      vatNumber: input.supplier.vatNumber,
      address: input.supplier.address,
    },
    customer: {
      endpointId: input.customer.orgNumber,
      endpointScheme: '0007',
      name: input.customer.name,
      vatNumber: input.customer.vatNumber,
      address: input.customer.address,
    },
    lines,
    totals: {
      lineExtensionAmount: subtotal,
      taxExclusiveAmount: subtotal,
      taxInclusiveAmount: subtotal + taxAmount,
      payableAmount: subtotal + taxAmount,
      taxAmount,
    },
  }
}
