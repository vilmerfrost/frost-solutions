// app/lib/integrations/sync/mappers.ts

// Faktura
export function mapFrostInvoiceToFortnox(inv: any) {
 return {
  Invoice: {
   CustomerNumber: inv.customer?.external_id || inv.customerNumber || inv.client_id,
   InvoiceDate: inv.date || inv.created_at?.split('T')[0],
   DueDate: inv.due_date || inv.date || inv.created_at?.split('T')[0],
   YourOrderNumber: inv.reference || inv.number,
   Comments: inv.notes || '',
   InvoiceRows: (inv.lines || inv.invoice_lines || []).map((l: any, idx: number) => ({
    LineNumber: idx + 1,
    Description: l.description,
    Quantity: l.quantity,
    Price: l.unit_price || l.rate_sek,
    VAT: Math.round((l.vat_percent || 25) * 100) / 100 // Fortnox expects 25 for 25%
   }))
  }
 };
}

export function mapFortnoxInvoiceToFrost(apiInv: any) {
 const invoice = apiInv.Invoice || apiInv;
 return {
  external_id: String(invoice.DocumentNumber || invoice.InvoiceNumber || invoice.id),
  customerNumber: invoice.CustomerNumber,
  date: invoice.InvoiceDate,
  due_date: invoice.DueDate,
  reference: invoice.YourOrderNumber,
  notes: invoice.Comments,
  lines: (invoice.Rows || invoice.InvoiceRows || []).map((r: any) => ({
   article_number: r.ArticleNumber,
   description: r.Description,
   quantity: r.Quantity,
   unit_price: r.Price || r.UnitPrice,
   vat_percent: r.VAT || 25
  })),
  updated_at: invoice.LastModified || new Date().toISOString()
 };
}

// Kund (clients)
export function mapFrostClientToFortnox(c: any) {
 return {
  Customer: {
   Name: c.name,
   CustomerNumber: c.customer_number || c.external_id || c.id.substring(0, 8).toUpperCase(),
   Email: c.email,
   Address1: c.address,
   City: c.city || '',
   ZipCode: c.zip || c.postal_code || '',
   CountryCode: c.country || 'SE'
  }
 };
}

export function mapFortnoxCustomerToFrost(apiC: any) {
 const customer = apiC.Customer || apiC;
 return {
  external_id: customer.CustomerNumber,
  name: customer.Name,
  email: customer.Email,
  address: customer.Address1,
  city: customer.City,
  zip: customer.ZipCode,
  country: customer.CountryCode || 'SE',
  updated_at: customer.LastModified || new Date().toISOString()
 };
}

