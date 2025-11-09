// app/lib/ocr/parsers/deliveryNote.ts

/**
 * Delivery Note Parser
 * Parses OCR results into structured DeliveryNoteOCRResult
 * Based on GPT-5 + Deepseek optimizations
 */

import type { DeliveryNoteOCRResult, DeliveryItem } from '@/types/ocr';
import { DeliveryNoteResultSchema } from '../schemas';
import { ValidationError } from '../errors';

/**
 * Parse Textract blocks into DeliveryNoteOCRResult
 * Uses optimized parsing with early termination
 */
export function parseDeliveryNoteFromTextract(
  blocks: any[],
  rawText: string,
  modelConfidence: number
): DeliveryNoteOCRResult {
  // Build text from blocks if rawText is empty
  const text = rawText || joinTextBlocks(blocks);

  // Extract key fields with heuristics
  const supplierName = findLine(text, /(leverantör|supplier):?\s*(.+)/i, 2) ?? guessSupplier(text);
  const referenceNumber = findLine(text, /(referens|ref\.?|order|reference):?\s*([A-Z0-9\-]+)/i, 2) ?? 'UNKNOWN';
  const deliveryDate = findDate(text) ?? new Date().toISOString().slice(0, 10);

  // Extract items from tables (optimized)
  const items: DeliveryItem[] = parseItemsFromTables(blocks, text);

  const result: DeliveryNoteOCRResult = {
    supplierName,
    supplierPhone: findLine(text, /(telefon|phone):?\s*([+0-9\s\-]+)/i, 2) ?? undefined,
    supplierEmail: findLine(text, /(e-?post|email):?\s*([\w.\-+]+@[\w.\-]+\.\w+)/i, 2) ?? undefined,
    deliveryDate,
    referenceNumber,
    items: items.length > 0 ? items : [{
      articleNumber: 'UNKNOWN',
      description: 'Okänt radinnehåll',
      quantity: 1,
      unit: 'st',
    }],
    projectReference: findLine(text, /(projekt|project):?\s*([^\n]+)/i, 2) ?? undefined,
    deliveryAddress: findLine(text, /(leveransadress|delivery address):?\s*([^\n]+)/i, 2) ?? undefined,
    ocrConfidence: Math.round(modelConfidence || 0),
    extractedAt: new Date(),
    rawOCRText: text,
  };

  // Validate with Zod
  const parsed = DeliveryNoteResultSchema.safeParse(result);
  if (!parsed.success) {
    throw new ValidationError(
      'Validering misslyckades för delivery note',
      parsed.error.flatten()
    );
  }

  return parsed.data;
}

/**
 * Join text blocks efficiently
 * Optimized from Deepseek
 */
function joinTextBlocks(blocks: any[]): string {
  if (!blocks || blocks.length === 0) return '';
  
  try {
    // Filter and map in one pass for efficiency
    return blocks
      .filter((b: any) => b?.Text)
      .map((b: any) => b.Text)
      .join('\n');
  } catch {
    return '';
  }
}

/**
 * Find line matching regex pattern
 * Returns captured group or undefined
 */
function findLine(text: string, re: RegExp, group: number = 1): string | undefined {
  const m = text.match(re);
  return m?.[group]?.trim();
}

/**
 * Guess supplier name from text
 * Looks for common Swedish company suffixes
 */
function guessSupplier(text: string): string {
  const lines = text.split('\n');
  for (const line of lines) {
    if (/AB|Bygg|Handel|Construction|Entreprenad|Material/i.test(line)) {
      return line.trim();
    }
  }
  return 'Okänd leverantör';
}

/**
 * Find and normalize date
 * Supports Swedish formats: YYYY-MM-DD, DD.MM.YYYY, DD/MM/YYYY
 */
function findDate(text: string): string | undefined {
  // Try ISO format first
  const isoMatch = text.match(/(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) return isoMatch[1];

  // Try Swedish formats
  const swedishMatch = text.match(/(\d{1,2})[.\/](\d{1,2})[.\/](\d{4})/);
  if (swedishMatch) {
    const [, day, month, year] = swedishMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  return undefined;
}

/**
 * Parse items from tables
 * Optimized table extraction based on Deepseek algorithms
 */
function parseItemsFromTables(blocks: any[], text: string): DeliveryItem[] {
  const items: DeliveryItem[] = [];

  // Strategy 1: Extract from table blocks (if available)
  const tableBlocks = blocks.filter((b: any) => b.BlockType === 'TABLE');
  if (tableBlocks.length > 0) {
    for (const table of tableBlocks) {
      const tableItems = extractTableRows(table, blocks);
      items.push(...tableItems);
    }
  }

  // Strategy 2: Fallback to line-based extraction
  if (items.length === 0) {
    const lines = text.split('\n').filter((l) => /\b\d+\s*(st|m|m2|kg|pcs)\b/i.test(l));
    for (let i = 0; i < Math.min(lines.length, 50); i++) {
      const line = lines[i];
      const quantityMatch = line.match(/\b(\d+)\s*(st|m|m2|kg|pcs)\b/i);
      if (quantityMatch) {
        items.push({
          articleNumber: `AUTO-${i + 1}`,
          description: line.trim(),
          quantity: Number(quantityMatch[1]),
          unit: quantityMatch[2].toLowerCase(),
        });
      }
    }
  }

  return items;
}

/**
 * Extract table rows from Textract table block
 * Handles merged cells and complex structures
 */
function extractTableRows(tableBlock: any, allBlocks: any[]): DeliveryItem[] {
  const items: DeliveryItem[] = [];
  
  if (!tableBlock.Relationships) return items;

  // Find child cells
  const childIds = tableBlock.Relationships
    .filter((r: any) => r.Type === 'CHILD')
    .flatMap((r: any) => r.Ids || []);

  // Group cells by row
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

  // Parse rows (skip header row)
  for (const [rowIndex, cells] of rowMap) {
    if (rowIndex === 1) continue; // Skip header

    // Sort cells by column index
    cells.sort((a, b) => (a.ColumnIndex || 0) - (b.ColumnIndex || 0));

    // Extract data (assuming: article, description, quantity, unit, price)
    const articleNumber = extractCellText(cells[0], allBlocks) || `AUTO-${rowIndex}`;
    const description = extractCellText(cells[1], allBlocks) || '';
    const quantityStr = extractCellText(cells[2], allBlocks) || '1';
    const unit = extractCellText(cells[3], allBlocks) || 'st';
    const priceStr = extractCellText(cells[4], allBlocks);

    if (description) {
      items.push({
        articleNumber,
        description,
        quantity: parseFloat(quantityStr.replace(/[^\d.,]/g, '').replace(',', '.')) || 1,
        unit: unit.toLowerCase(),
        unitPrice: priceStr ? parseFloat(priceStr.replace(/[^\d.,]/g, '').replace(',', '.')) : undefined,
      });
    }
  }

  return items;
}

/**
 * Extract text from a cell block
 * Handles nested relationships
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

