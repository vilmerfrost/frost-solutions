// app/lib/ocr/parsers/invoice.ts

/**
 * Invoice Parser
 * Parses OCR results into structured InvoiceOCRResult
 * Based on GPT-5 + Deepseek optimizations
 */

import type { InvoiceOCRResult, InvoiceLineItem } from '@/types/ocr';
import { InvoiceResultSchema } from '../schemas';
import { ValidationError } from '../errors';

/**
 * Parse Textract blocks into InvoiceOCRResult
 * Uses query-based extraction for better accuracy
 */
export function parseInvoiceFromTextract(
 blocks: any[],
 rawText: string,
 modelConfidence: number,
 queryAnswers?: Record<string, string>
): InvoiceOCRResult {
 const text = rawText || joinTextBlocks(blocks);

 // Extract using query answers if available (more reliable)
 const supplierName = queryAnswers?.['supplier_name'] || extractSupplierName(text);
 const invoiceNumber = queryAnswers?.['invoice_number'] || extractInvoiceNumber(text);
 const invoiceDate = queryAnswers?.['invoice_date'] || extractDate(text);
 const dueDate = queryAnswers?.['due_date'] || calculateDueDate(invoiceDate) || invoiceDate; // Fallback to invoiceDate if calculation fails
 const totalAmount = parseFloat(queryAnswers?.['total_amount'] || '0') || extractTotalAmount(text);

 // Extract line items from tables
 const lineItems = extractInvoiceLineItems(blocks, text);

 // Calculate amounts
 const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0) || extractSubtotal(text);
 const vatRate = extractVatRate(text);
 const vatAmount = extractVatAmount(text) || (subtotal * vatRate / 100);

 const result: InvoiceOCRResult = {
  supplierName,
  supplierEmail: extractEmail(text),
  supplierPhone: extractPhone(text),
  supplierOrgNumber: extractOrgNumber(text),
  invoiceNumber,
  invoiceDate,
  dueDate,
  subtotal,
  vatRate,
  vatAmount,
  totalAmount: totalAmount || (subtotal + vatAmount),
  currency: extractCurrency(text) || 'SEK',
  lineItems,
  projectReference: queryAnswers?.['project_reference'] || extractProjectReference(text),
  projectNumber: extractProjectNumber(text),
  ocrConfidence: Math.round(modelConfidence || 0),
  extractedAt: new Date(),
  rawText: text,
 };

 // Validate with Zod
 const parsed = InvoiceResultSchema.safeParse(result);
 if (!parsed.success) {
  throw new ValidationError(
   'Validering misslyckades för invoice',
   parsed.error.flatten()
  );
 }

 return parsed.data;
}

/**
 * Join text blocks efficiently
 */
function joinTextBlocks(blocks: any[]): string {
 if (!blocks || blocks.length === 0) return '';
 
 return blocks
  .filter((b: any) => b?.Text)
  .map((b: any) => b.Text)
  .join('\n');
}

/**
 * Extract supplier name (usually at top of invoice)
 */
function extractSupplierName(text: string): string {
 const lines = text.split('\n');
 
 // Look for company name patterns in first 5 lines
 for (let i = 0; i < Math.min(5, lines.length); i++) {
  const line = lines[i].trim();
  if (line.length > 3 && /AB|Bygg|Handel|Material|Entreprenad/i.test(line)) {
   return line;
  }
 }
 
 return 'Okänd leverantör';
}

/**
 * Extract invoice number
 */
function extractInvoiceNumber(text: string): string {
 const patterns = [
  /(?:faktura|invoice|fakturanummer|inv)[\s:]*([A-Z0-9\-]{4,20})/i,
  /(?:nr|number|nummer)[\s:]*([A-Z0-9\-]{4,20})/i,
 ];

 for (const pattern of patterns) {
  const match = text.match(pattern);
  if (match?.[1]) {
   return match[1];
  }
 }

 return `INV-${Date.now()}`;
}

/**
 * Extract date (Swedish formats)
 */
function extractDate(text: string): string {
 // ISO format
 const isoMatch = text.match(/(\d{4}-\d{2}-\d{2})/);
 if (isoMatch) return isoMatch[1];

 // Swedish format DD.MM.YYYY or DD/MM/YYYY
 const swedishMatch = text.match(/(\d{1,2})[.\/](\d{1,2})[.\/](\d{4})/);
 if (swedishMatch) {
  const [, day, month, year] = swedishMatch;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
 }

 return new Date().toISOString().slice(0, 10);
}

/**
 * Calculate due date (typically 30 days after invoice date)
 */
function calculateDueDate(invoiceDate: string): string {
 const date = new Date(invoiceDate);
 date.setDate(date.getDate() + 30);
 return date.toISOString().slice(0, 10);
}

/**
 * Extract total amount (Swedish format: 1 234,56 SEK)
 */
function extractTotalAmount(text: string): number {
 const patterns = [
  /(?:total|summa|belopp|amount|totalt)[\s:]*([0-9\s,\.]+)\s*(?:SEK|kr)?/i,
  /(?:att betala|to pay)[\s:]*([0-9\s,\.]+)\s*(?:SEK|kr)?/i,
 ];

 for (const pattern of patterns) {
  const match = text.match(pattern);
  if (match?.[1]) {
   const cleaned = match[1].replace(/\s/g, '').replace(',', '.');
   return parseFloat(cleaned) || 0;
  }
 }

 return 0;
}

/**
 * Extract subtotal
 */
function extractSubtotal(text: string): number {
 const match = text.match(/(?:subtotal|momsfri|exkl\.? moms)[\s:]*([0-9\s,\.]+)/i);
 if (match?.[1]) {
  const cleaned = match[1].replace(/\s/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
 }
 return 0;
}

/**
 * Extract VAT rate (typically 25% in Sweden)
 */
function extractVatRate(text: string): number {
 const match = text.match(/(?:moms|vat|mervärdesskatt)[\s:]*(\d+)\s*%/i);
 if (match?.[1]) {
  return parseFloat(match[1]);
 }
 return 25; // Default Swedish VAT
}

/**
 * Extract VAT amount
 */
function extractVatAmount(text: string): number {
 const match = text.match(/(?:moms|vat|mervärdesskatt)[\s:]*([0-9\s,\.]+)\s*(?:SEK|kr)?/i);
 if (match?.[1]) {
  const cleaned = match[1].replace(/\s/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
 }
 return 0;
}

/**
 * Extract currency
 */
function extractCurrency(text: string): string | undefined {
 const match = text.match(/(SEK|EUR|USD|NOK|DKK)/i);
 return match?.[1]?.toUpperCase();
}

/**
 * Extract email
 */
function extractEmail(text: string): string | undefined {
 const match = text.match(/([\w.\-+]+@[\w.\-]+\.\w+)/);
 return match?.[1];
}

/**
 * Extract phone number
 */
function extractPhone(text: string): string | undefined {
 const match = text.match(/(?:tel|telefon|phone)[\s:]*([+0-9\s\-()]+)/i);
 return match?.[1]?.trim();
}

/**
 * Extract Swedish organization number
 */
function extractOrgNumber(text: string): string | undefined {
 const match = text.match(/(?:org\.?nr|organisationsnummer)[\s:]*(\d{6}[- ]?\d{4})/i);
 return match?.[1]?.replace(/\s/g, '');
}

/**
 * Extract project reference
 */
function extractProjectReference(text: string): string | undefined {
 const match = text.match(/(?:projekt|project|ref|referens|objekt)[\s:]*([A-Z0-9\-]{4,20})/i);
 return match?.[1];
}

/**
 * Extract project number
 */
function extractProjectNumber(text: string): string | undefined {
 const match = text.match(/(?:projektnummer|project number)[\s:]*([A-Z0-9\-]{4,20})/i);
 return match?.[1];
}

/**
 * Extract invoice line items from tables
 * Optimized table extraction
 */
function extractInvoiceLineItems(blocks: any[], text: string): InvoiceLineItem[] {
 const items: InvoiceLineItem[] = [];

 // Strategy 1: Extract from table blocks
 const tableBlocks = blocks.filter((b: any) => b.BlockType === 'TABLE');
 if (tableBlocks.length > 0) {
  for (const table of tableBlocks) {
   const tableItems = extractTableLineItems(table, blocks);
   items.push(...tableItems);
  }
 }

 // Strategy 2: Fallback to line-based extraction
 if (items.length === 0) {
  const lines = text.split('\n');
  for (const line of lines) {
   // Look for lines with quantity and price
   const quantityMatch = line.match(/(\d+)\s*(st|m|m2|kg)/i);
   const priceMatch = line.match(/(\d+[\s,\.]\d+)\s*(?:SEK|kr)/i);
   
   if (quantityMatch && priceMatch) {
    items.push({
     description: line.trim(),
     quantity: parseFloat(quantityMatch[1]),
     unit: quantityMatch[2].toLowerCase(),
     unitPrice: parseFloat(priceMatch[1].replace(/\s/g, '').replace(',', '.')) / parseFloat(quantityMatch[1]),
     total: parseFloat(priceMatch[1].replace(/\s/g, '').replace(',', '.')),
    });
   }
  }
 }

 return items;
}

/**
 * Extract line items from table block
 */
function extractTableLineItems(tableBlock: any, allBlocks: any[]): InvoiceLineItem[] {
 const items: InvoiceLineItem[] = [];
 
 if (!tableBlock.Relationships) return items;

 const childIds = tableBlock.Relationships
  .filter((r: any) => r.Type === 'CHILD')
  .flatMap((r: any) => r.Ids || []);

 const rowMap = new Map<number, any[]>();
 
 for (const cellId of childIds) {
  const cellBlock = allBlocks.find((b: any) => b.Id === cellId);
  if (cellBlock && cellBlock.BlockType === 'CELL') {
   const rowIndex = cellBlock.RowIndex || 0;
   if (!rowMap.has(rowIndex)) {
    rowMap.set(rowIndex, []);
   }
   rowMap.get(rowIndex)!.push(cellBlock);
  }
 }

 // Parse rows (skip header)
 for (const [rowIndex, cells] of rowMap) {
  if (rowIndex === 1) continue;

  cells.sort((a, b) => (a.ColumnIndex || 0) - (b.ColumnIndex || 0));

  const description = extractCellText(cells[0], allBlocks) || '';
  const quantityStr = extractCellText(cells[1], allBlocks) || '1';
  const unit = extractCellText(cells[2], allBlocks) || 'st';
  const unitPriceStr = extractCellText(cells[3], allBlocks) || '0';
  const totalStr = extractCellText(cells[4], allBlocks) || unitPriceStr;

  if (description) {
   const quantity = parseFloat(quantityStr.replace(/[^\d.,]/g, '').replace(',', '.')) || 1;
   const unitPrice = parseFloat(unitPriceStr.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
   const total = parseFloat(totalStr.replace(/[^\d.,]/g, '').replace(',', '.')) || (quantity * unitPrice);

   items.push({
    description,
    quantity,
    unit: unit.toLowerCase(),
    unitPrice,
    total,
   });
  }
 }

 return items;
}

/**
 * Extract text from cell block
 */
function extractCellText(cellBlock: any, allBlocks: any[]): string {
 if (!cellBlock || !cellBlock.Relationships) return '';

 const textBlocks: string[] = [];
 const childIds = cellBlock.Relationships
  .filter((r: any) => r.Type === 'CHILD')
  .flatMap((r: any) => r.Ids || []);

 for (const childId of childIds) {
  const childBlock = allBlocks.find((b: any) => b.Id === childId);
  if (childBlock?.Text) {
   textBlocks.push(childBlock.Text);
  }
 }

 return textBlocks.join(' ').trim();
}

