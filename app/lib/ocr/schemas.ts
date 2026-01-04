// app/lib/ocr/schemas.ts

/**
 * Zod schemas for OCR data validation
 * Based on GPT-5 implementation
 */

import { z } from 'zod';

export const DeliveryItemSchema = z.object({
 articleNumber: z.string().min(1),
 description: z.string().min(1),
 quantity: z.number().finite().nonnegative(),
 unit: z.string().min(1),
 unitPrice: z.number().finite().nonnegative().optional(),
 totalPrice: z.number().finite().nonnegative().optional(),
});

export const DeliveryNoteResultSchema = z.object({
 supplierName: z.string().min(1),
 supplierPhone: z.string().optional(),
 supplierEmail: z.string().email().optional(),
 deliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
 referenceNumber: z.string().min(1),
 items: z.array(DeliveryItemSchema).min(1),
 projectReference: z.string().optional(),
 deliveryAddress: z.string().optional(),
 ocrConfidence: z.number().min(0).max(100),
 extractedAt: z.date(),
 rawOCRText: z.string().min(1),
});

export const InvoiceLineItemSchema = z.object({
 description: z.string().min(1),
 quantity: z.number().finite().nonnegative(),
 unit: z.string().min(1),
 unitPrice: z.number().finite().nonnegative(),
 total: z.number().finite().nonnegative(),
 taxRate: z.number().min(0).max(100).optional(),
});

export const InvoiceResultSchema = z.object({
 supplierName: z.string().min(1),
 supplierEmail: z.string().email().optional(),
 supplierPhone: z.string().optional(),
 supplierOrgNumber: z.string().optional(),
 invoiceNumber: z.string().min(1),
 invoiceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
 dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
 subtotal: z.number().finite().nonnegative(),
 vatRate: z.number().min(0).max(100),
 vatAmount: z.number().finite().nonnegative(),
 totalAmount: z.number().finite().nonnegative(),
 currency: z.string().default('SEK'),
 lineItems: z.array(InvoiceLineItemSchema).min(0),
 projectReference: z.string().optional(),
 projectNumber: z.string().optional(),
 ocrConfidence: z.number().min(0).max(100),
 extractedAt: z.date(),
 rawText: z.string().min(1),
});

export type DeliveryNoteZ = z.infer<typeof DeliveryNoteResultSchema>;
export type InvoiceZ = z.infer<typeof InvoiceResultSchema>;

