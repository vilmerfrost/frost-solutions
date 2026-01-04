// app/api/supplier-invoices/_schemas.ts
import { z } from 'zod'

export const listQuerySchema = z.object({
 status: z.string().optional(),
 projectId: z.string().uuid().optional(),
 supplierId: z.string().uuid().optional(),
 search: z.string().optional(),
 from: z.string().optional(), // YYYY-MM-DD
 to: z.string().optional(),
 page: z.coerce.number().min(1).default(1),
 limit: z.coerce.number().min(1).max(100).default(20)
})

export const createInvoiceSchema = z.object({
 supplier_id: z.string().uuid(),
 project_id: z.string().uuid().nullable().optional(),
 invoice_number: z.string(),
 invoice_date: z.string(),
 due_date: z.string().optional(),
 currency: z.string().default('SEK'),
 exchange_rate: z.number().optional(),
 items: z
  .array(
   z.object({
    item_type: z.enum(['material', 'labor', 'transport', 'other']).default('material'),
    name: z.string(),
    description: z.string().optional(),
    quantity: z.number().positive(),
    unit: z.string().default('st'),
    unit_price: z.number().nonnegative(),
    vat_rate: z.number().nonnegative().max(100).default(25),
    order_index: z.number().int().optional()
   })
  )
  .default([]),
 notes: z.string().optional()
})

export const patchInvoiceSchema = z.object({
 status: z
  .enum(['draft', 'pending_approval', 'approved', 'booked', 'paid', 'archived', 'rejected'])
  .optional(),
 invoice_date: z.string().optional(),
 due_date: z.string().optional(),
 currency: z.string().optional(),
 exchange_rate: z.number().optional(),
 markup_override: z.number().optional(),
 notes: z.string().optional()
})

export const paymentSchema = z.object({
 amount: z.number().positive(),
 paymentDate: z.string(),
 method: z.string().default('bankgiro'),
 notes: z.string().optional()
})

