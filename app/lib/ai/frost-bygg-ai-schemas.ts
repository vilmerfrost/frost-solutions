import { z } from 'zod';

export const InvoiceOCRResultSchema = z.object({
  supplierName: z.string().min(1),
  supplierEmail: z.string().email().optional().nullable(),
  supplierPhone: z.string().optional().nullable(),
  supplierOrgNumber: z.string().optional().nullable(),
  invoiceNumber: z.string().min(1),
  invoiceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  subtotal: z.number().finite().nonnegative(),
  vatRate: z.number().min(0).max(100),
  vatAmount: z.number().finite().nonnegative(),
  totalAmount: z.number().finite().nonnegative(),
  currency: z.string().default('SEK'),
  lineItems: z.array(z.object({
    description: z.string().min(1),
    quantity: z.number().finite().nonnegative(),
    unit: z.string().min(1),
    unitPrice: z.number().finite().nonnegative(),
    total: z.number().finite().nonnegative(),
    taxRate: z.number().min(0).max(100).optional().nullable(),
  })).min(0),
  projectReference: z.string().optional().nullable(),
  projectNumber: z.string().optional().nullable(),
  ocrConfidence: z.number().min(0).max(100),
  extractedAt: z.string(),
  rawText: z.string().min(1),
});

export type InvoiceOCRResult = z.infer<typeof InvoiceOCRResultSchema>;

export const DeliveryNoteOCRResultSchema = z.object({
  supplierName: z.string().min(1),
  supplierPhone: z.string().optional().nullable(),
  supplierEmail: z.string().email().optional().nullable(),
  deliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  referenceNumber: z.string().min(1),
  items: z.array(z.object({
    articleNumber: z.string().min(1),
    description: z.string().min(1),
    quantity: z.number().finite().nonnegative(),
    unit: z.string().min(1),
    unitPrice: z.number().finite().nonnegative().optional().nullable(),
    totalPrice: z.number().finite().nonnegative().optional().nullable(),
  })).min(1),
  projectReference: z.string().optional().nullable(),
  deliveryAddress: z.string().optional().nullable(),
  ocrConfidence: z.number().min(0).max(100),
  extractedAt: z.string(),
  rawOCRText: z.string().min(1),
});

export type DeliveryNoteOCRResult = z.infer<typeof DeliveryNoteOCRResultSchema>;

export const ReceiptOCRResultSchema = z.object({
  merchantName: z.string().min(1),
  receiptDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  receiptNumber: z.string().optional().nullable(),
  totalAmount: z.number().finite().nonnegative(),
  currency: z.string().default('SEK'),
  items: z.array(z.object({
    description: z.string().min(1),
    quantity: z.number().finite().nonnegative().optional().nullable(),
    unitPrice: z.number().finite().nonnegative().optional().nullable(),
    total: z.number().finite().nonnegative(),
  })).min(0),
  vatAmount: z.number().finite().nonnegative().optional().nullable(),
  paymentMethod: z.string().optional().nullable(),
  ocrConfidence: z.number().min(0).max(100),
  extractedAt: z.string(),
  rawText: z.string().min(1),
});

export type ReceiptOCRResult = z.infer<typeof ReceiptOCRResultSchema>;

export const ROTRUTSummarySchema = z.object({
  summary: z.string().min(1),
  totalAmount: z.number().finite().nonnegative(),
  vatAmount: z.number().finite().nonnegative(),
  rotAmount: z.number().finite().nonnegative().optional().nullable(),
  rutAmount: z.number().finite().nonnegative().optional().nullable(),
  customerName: z.string().min(1),
  projectDescription: z.string().min(1),
  workPeriod: z.string().min(1),
  keyPoints: z.array(z.string()).min(1),
  generatedAt: z.string(),
});

export type ROTRUTSummary = z.infer<typeof ROTRUTSummarySchema>;

export const ProjectInsightsSchema = z.object({
  projectName: z.string().min(1),
  currentStatus: z.string().min(1),
  budgetStatus: z.object({
    totalBudget: z.number().finite().nonnegative(),
    spent: z.number().finite().nonnegative(),
    remaining: z.number().finite().nonnegative(),
    percentageUsed: z.number().min(0).max(100),
  }),
  timelineStatus: z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
    expectedCompletion: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
    isOnTrack: z.boolean(),
  }),
  risks: z.array(z.object({
    severity: z.enum(['low', 'medium', 'high']),
    description: z.string().min(1),
    recommendation: z.string().min(1),
  })).min(0),
  recommendations: z.array(z.string()).min(1),
  generatedAt: z.string(),
});

export type ProjectInsights = z.infer<typeof ProjectInsightsSchema>;

export const PayrollValidationResultSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(z.object({
    field: z.string().min(1),
    message: z.string().min(1),
    severity: z.enum(['error', 'warning', 'info']),
  })).min(0),
  warnings: z.array(z.string()).min(0),
  obCalculations: z.object({
    kvall: z.number().finite().nonnegative(),
    natt: z.number().finite().nonnegative(),
    helg: z.number().finite().nonnegative(),
    totalOB: z.number().finite().nonnegative(),
  }).optional().nullable(),
  taxCalculations: z.object({
    grossSalary: z.number().finite().nonnegative(),
    taxRate: z.number().min(0).max(100),
    taxAmount: z.number().finite().nonnegative(),
    netSalary: z.number().finite().nonnegative(),
  }).optional().nullable(),
  validatedAt: z.string(),
});

export type PayrollValidationResult = z.infer<typeof PayrollValidationResultSchema>;

export const MonthlyReportSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
  summary: z.string().min(1),
  totalRevenue: z.number().finite().nonnegative(),
  totalCosts: z.number().finite().nonnegative(),
  profit: z.number().finite(),
  projectsCompleted: z.number().int().nonnegative(),
  projectsActive: z.number().int().nonnegative(),
  topProjects: z.array(z.object({
    projectName: z.string().min(1),
    revenue: z.number().finite().nonnegative(),
    profit: z.number().finite(),
  })).min(0),
  keyMetrics: z.object({
    averageProjectProfit: z.number().finite(),
    employeeUtilization: z.number().min(0).max(100),
    customerSatisfaction: z.number().min(0).max(100).optional().nullable(),
  }),
  recommendations: z.array(z.string()).min(1),
  generatedAt: z.string(),
});

export type MonthlyReport = z.infer<typeof MonthlyReportSchema>;
