// app/lib/integrations/mappers.ts

import { z } from 'zod';

// Frost types (simplified). Replace with your actual types.
export type Client = {
  id: string;
  name: string;
  org_number?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  zip_code?: string | null;
  city?: string | null;
  country?: string | null;
};

export type InvoiceRow = {
  description: string;
  quantity: number;
  unit_price: number;
  vat_percent?: number; // 0/6/12/25
};

export type Invoice = {
  id: string;
  client_id: string;
  issue_date: string; // ISO
  due_date?: string | null;
  currency?: string;  // 'SEK'
  rows: InvoiceRow[];
  notes?: string | null;
  reference?: string | null;
};

// Fortnox types (minimal required fields)
export type FortnoxCustomer = {
  Name: string;
  OrganisationNumber?: string;
  Email?: string;
  Phone?: string;
  Address1?: string;
  ZipCode?: string;
  City?: string;
  Country?: string;
};

export type FortnoxInvoiceRow = {
  Description: string;
  Quantity: number;
  UnitPrice: number;
  VAT?: number;
};

export type FortnoxInvoice = {
  CustomerNumber?: string; // If we set existing. Otherwise CustomerName.
  CustomerName?: string;
  InvoiceDate?: string; // YYYY-MM-DD
  DueDate?: string;
  Currency?: string;
  Comments?: string;
  YourReference?: string;
  Rows: FortnoxInvoiceRow[];
};

// Visma types (simplified)
export type VismaCustomer = {
  Name: string;
  OrganisationNumber?: string;
  Email?: string;
  Phone?: string;
  Address?: string;
  ZipCode?: string;
  City?: string;
  Country?: string;
};

export type VismaInvoiceRow = {
  Text: string;
  Quantity: number;
  UnitPrice: number;
  VATPercent?: number;
};

export type VismaInvoice = {
  CustomerId?: string;
  CustomerName?: string;
  InvoiceDate?: string; // ISO or YYYY-MM-DD according to guide
  DueDate?: string | null;
  Currency?: string;
  Notes?: string | null;
  Reference?: string | null;
  Rows: VismaInvoiceRow[];
};

// Zod validators (simple)
const fortnoxCustomerSchema = z.object({
  Name: z.string().min(1),
  OrganisationNumber: z.string().optional(),
  Email: z.string().email().optional(),
  Phone: z.string().optional(),
  Address1: z.string().optional(),
  ZipCode: z.string().optional(),
  City: z.string().optional(),
  Country: z.string().optional(),
});

const fortnoxInvoiceSchema = z.object({
  CustomerNumber: z.string().optional(),
  CustomerName: z.string().optional(),
  InvoiceDate: z.string().optional(),
  DueDate: z.string().optional(),
  Currency: z.string().optional(),
  Comments: z.string().optional(),
  YourReference: z.string().optional(),
  Rows: z
    .array(
      z.object({
        Description: z.string(),
        Quantity: z.number(),
        UnitPrice: z.number(),
        VAT: z.number().optional(),
      })
    )
    .min(1),
});

const vismaCustomerSchema = z.object({
  Name: z.string(),
  OrganisationNumber: z.string().optional(),
  Email: z.string().email().optional(),
  Phone: z.string().optional(),
  Address: z.string().optional(),
  ZipCode: z.string().optional(),
  City: z.string().optional(),
  Country: z.string().optional(),
});

const vismaInvoiceSchema = z.object({
  CustomerId: z.string().optional(),
  CustomerName: z.string().optional(),
  InvoiceDate: z.string().optional(),
  DueDate: z.string().optional().nullable(),
  Currency: z.string().optional(),
  Notes: z.string().optional().nullable(),
  Reference: z.string().optional().nullable(),
  Rows: z
    .array(
      z.object({
        Text: z.string(),
        Quantity: z.number(),
        UnitPrice: z.number(),
        VATPercent: z.number().optional(),
      })
    )
    .min(1),
});

// Mappers
export function mapFrostClientToFortnox(client: Client): FortnoxCustomer {
  const candidate: FortnoxCustomer = {
    Name: client.name,
    OrganisationNumber: client.org_number ?? undefined,
    Email: client.email ?? undefined,
    Phone: client.phone ?? undefined,
    Address1: client.address ?? undefined,
    ZipCode: client.zip_code ?? undefined,
    City: client.city ?? undefined,
    Country: client.country ?? undefined,
  };

  return fortnoxCustomerSchema.parse(candidate);
}

export function mapFrostClientToVisma(client: Client): VismaCustomer {
  const candidate: VismaCustomer = {
    Name: client.name,
    OrganisationNumber: client.org_number ?? undefined,
    Email: client.email ?? undefined,
    Phone: client.phone ?? undefined,
    Address: client.address ?? undefined,
    ZipCode: client.zip_code ?? undefined,
    City: client.city ?? undefined,
    Country: client.country ?? undefined,
  };

  return vismaCustomerSchema.parse(candidate);
}

export function mapFrostInvoiceToFortnox(
  invoice: Invoice,
  customer?: { number?: string; name?: string }
): FortnoxInvoice {
  const rows: FortnoxInvoiceRow[] = invoice.rows.map((r) => ({
    Description: r.description,
    Quantity: r.quantity,
    UnitPrice: r.unit_price,
    VAT: r.vat_percent ?? undefined,
  }));

  const candidate: FortnoxInvoice = {
    CustomerNumber: customer?.number,
    CustomerName: customer?.name,
    InvoiceDate: invoice.issue_date?.slice(0, 10),
    DueDate: invoice.due_date ?? undefined,
    Currency: invoice.currency ?? 'SEK',
    Comments: invoice.notes ?? undefined,
    YourReference: invoice.reference ?? undefined,
    Rows: rows,
  };

  return fortnoxInvoiceSchema.parse(candidate);
}

export function mapFrostInvoiceToVisma(
  invoice: Invoice,
  customer?: { id?: string; name?: string }
): VismaInvoice {
  const rows: VismaInvoiceRow[] = invoice.rows.map((r) => ({
    Text: r.description,
    Quantity: r.quantity,
    UnitPrice: r.unit_price,
    VATPercent: r.vat_percent ?? undefined,
  }));

  const candidate: VismaInvoice = {
    CustomerId: customer?.id,
    CustomerName: customer?.name,
    InvoiceDate: invoice.issue_date?.slice(0, 10),
    DueDate: invoice.due_date ?? null,
    Currency: invoice.currency ?? 'SEK',
    Notes: invoice.notes ?? null,
    Reference: invoice.reference ?? null,
    Rows: rows,
  };

  return vismaInvoiceSchema.parse(candidate);
}

