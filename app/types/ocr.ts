// app/types/ocr.ts

/**
 * OCR Types for Document Processing
 * Based on GPT-5, Claude 4.5, and Deepseek implementations
 */

export interface DeliveryItem {
  articleNumber: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice?: number;
  totalPrice?: number;
}

export interface DeliveryNoteOCRResult {
  supplierName: string;
  supplierPhone?: string;
  supplierEmail?: string;
  deliveryDate: string; // YYYY-MM-DD
  referenceNumber: string;
  items: DeliveryItem[];
  projectReference?: string;
  deliveryAddress?: string;
  ocrConfidence: number; // 0-100
  extractedAt: Date;
  rawOCRText: string;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
  taxRate?: number;
}

export interface InvoiceOCRResult {
  // Supplier Info
  supplierName: string;
  supplierEmail?: string;
  supplierPhone?: string;
  supplierOrgNumber?: string; // Swedish org number
  
  // Invoice Details
  invoiceNumber: string;
  invoiceDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  
  // Amounts
  subtotal: number;
  vatRate: number; // e.g., 25 for 25%
  vatAmount: number;
  totalAmount: number;
  currency: string; // Default: SEK
  
  // Line Items
  lineItems: InvoiceLineItem[];
  
  // Project Reference
  projectReference?: string;
  projectNumber?: string;
  
  // Metadata
  ocrConfidence: number;
  extractedAt: Date;
  rawText: string;
}

export type OCRProvider = 'aws_textract' | 'google_document_ai' | 'tesseract';

export type OCRStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface OCRProcessingLog {
  id: string;
  tenantId: string;
  correlationId: string;
  docType: 'delivery_note' | 'invoice' | 'form';
  stage: string;
  level: 'info' | 'warn' | 'error';
  message?: string;
  filePath?: string;
  meta?: Record<string, unknown>;
  createdAt: Date;
}

export interface ProjectMatchResult {
  projectId: string;
  projectName: string;
  projectNumber?: string;
  confidence: number; // 0-100
  matchReason: string;
  stage: number; // Which matching stage found it (1-5)
}

