// app/lib/integrations/sync/mappers.ts

// --- Validation helpers ---

export class MapperValidationError extends Error {
 constructor(message: string) {
  super(message);
  this.name = 'MapperValidationError';
 }
}

function requireField(obj: any, field: string, label: string): void {
 const value = field.includes('.') ? field.split('.').reduce((o, k) => o?.[k], obj) : obj?.[field];
 if (value === undefined || value === null || value === '') {
  throw new MapperValidationError(`Missing required field: ${label}`);
 }
}

// Faktura
export function mapFrostInvoiceToFortnox(inv: any) {
 requireField(inv, 'customer.external_id', 'customer.external_id or customerNumber');
 // Allow fallback for customer number but at least one must exist
 const customerNumber = inv.customer?.external_id || inv.customerNumber || inv.client_id;
 if (!customerNumber) throw new MapperValidationError('Missing required field: customerNumber');

 const invoiceDate = inv.date || inv.created_at?.split('T')[0];
 if (!invoiceDate) throw new MapperValidationError('Missing required field: date');

 return {
  Invoice: {
   CustomerNumber: customerNumber,
   InvoiceDate: invoiceDate,
   DueDate: inv.due_date || invoiceDate,
   YourOrderNumber: inv.reference || inv.number || '',
   Comments: inv.notes || '',
   InvoiceRows: (inv.lines || inv.invoice_lines || []).map((l: any, idx: number) => ({
    LineNumber: idx + 1,
    Description: l.description || '',
    Quantity: l.quantity ?? 0,
    Price: l.unit_price ?? l.rate_sek ?? 0,
    VAT: Math.round((l.vat_percent || 25) * 100) / 100 // Fortnox expects 25 for 25%
   }))
  }
 };
}

export function mapFortnoxInvoiceToFrost(apiInv: any) {
 const invoice = apiInv?.Invoice || apiInv;
 if (!invoice) throw new MapperValidationError('Missing invoice data from Fortnox response');

 const docNum = invoice.DocumentNumber ?? invoice.InvoiceNumber ?? invoice.id;
 if (docNum === undefined || docNum === null) {
  throw new MapperValidationError('Missing DocumentNumber in Fortnox response');
 }

 return {
  external_id: String(docNum),
  customerNumber: invoice.CustomerNumber || '',
  date: invoice.InvoiceDate || '',
  due_date: invoice.DueDate || '',
  reference: invoice.YourOrderNumber || '',
  notes: invoice.Comments || '',
  lines: (invoice.Rows || invoice.InvoiceRows || []).map((r: any) => ({
   article_number: r.ArticleNumber || '',
   description: r.Description || '',
   quantity: r.Quantity ?? 0,
   unit_price: r.Price ?? r.UnitPrice ?? 0,
   vat_percent: r.VAT ?? 25
  })),
  updated_at: invoice.LastModified || new Date().toISOString()
 };
}

// Kund (clients)
export function mapFrostClientToFortnox(c: any) {
 requireField(c, 'name', 'name');

 return {
  Customer: {
   Name: c.name,
   CustomerNumber: c.customer_number || c.external_id || (c.id ? c.id.substring(0, 8).toUpperCase() : undefined),
   Email: c.email || '',
   OrganisationNumber: c.organisation_number || c.org_number || '',
   Address1: c.address || '',
   City: c.city || '',
   ZipCode: c.zip || c.postal_code || '',
   CountryCode: c.country || 'SE'
  }
 };
}

export function mapFortnoxCustomerToFrost(apiC: any) {
 const customer = apiC?.Customer || apiC;
 if (!customer) throw new MapperValidationError('Missing customer data from Fortnox response');

 const externalId = customer.CustomerNumber;
 if (!externalId) throw new MapperValidationError('Missing CustomerNumber in Fortnox response');

 return {
  external_id: String(externalId),
  name: customer.Name || '',
  email: customer.Email || '',
  organisation_number: customer.OrganisationNumber || '',
  address: customer.Address1 || '',
  city: customer.City || '',
  zip: customer.ZipCode || '',
  country: customer.CountryCode || 'SE',
  updated_at: customer.LastModified || new Date().toISOString()
 };
}

// ---- Visma eAccounting mappers ----

export function mapFrostInvoiceToVisma(inv: any) {
 const customerId = inv.customer?.external_id || inv.client_id;
 if (!customerId) throw new MapperValidationError('Missing required field: customer external_id or client_id');

 const invoiceDate = inv.date || inv.created_at?.split('T')[0];
 if (!invoiceDate) throw new MapperValidationError('Missing required field: date');

 return {
  CustomerId: customerId,
  InvoiceDate: invoiceDate,
  DueDate: inv.due_date || invoiceDate,
  YourReference: inv.reference || inv.number || '',
  Note: inv.notes || '',
  Rows: (inv.lines || inv.invoice_lines || []).map((l: any) => ({
   ArticleId: l.article_id || undefined,
   Text: l.description || '',
   Quantity: l.quantity ?? 0,
   UnitPrice: l.unit_price ?? l.rate_sek ?? 0,
   VatRatePercent: l.vat_percent || 25,
  })),
 };
}

export function mapVismaInvoiceToFrost(apiInv: any) {
 if (!apiInv) throw new MapperValidationError('Missing invoice data from Visma response');

 const id = apiInv.Id ?? apiInv.id;
 if (id === undefined || id === null) {
  throw new MapperValidationError('Missing Id in Visma invoice response');
 }

 return {
  external_id: String(id),
  customerNumber: apiInv.CustomerId || '',
  date: apiInv.InvoiceDate || '',
  due_date: apiInv.DueDate || '',
  reference: apiInv.YourReference || '',
  notes: apiInv.Note || '',
  lines: (apiInv.Rows || []).map((r: any) => ({
   description: r.Text || '',
   quantity: r.Quantity ?? 0,
   unit_price: r.UnitPrice ?? 0,
   vat_percent: r.VatRatePercent || 25,
  })),
  updated_at: apiInv.ModifiedUtc || new Date().toISOString(),
 };
}

export function mapFrostClientToVisma(c: any) {
 requireField(c, 'name', 'name');

 return {
  Name: c.name,
  EmailAddress: c.email || '',
  Address: c.address || '',
  City: c.city || '',
  ZipCode: c.zip || c.postal_code || '',
  CountryCode: c.country || 'SE',
 };
}

export function mapVismaCustomerToFrost(apiC: any) {
 if (!apiC) throw new MapperValidationError('Missing customer data from Visma response');

 const id = apiC.Id ?? apiC.id;
 if (id === undefined || id === null) {
  throw new MapperValidationError('Missing Id in Visma customer response');
 }

 return {
  external_id: String(id),
  name: apiC.Name || '',
  email: apiC.EmailAddress || '',
  address: apiC.Address || '',
  city: apiC.City || '',
  zip: apiC.ZipCode || '',
  country: apiC.CountryCode || 'SE',
  updated_at: apiC.ModifiedUtc || new Date().toISOString(),
 };
}

