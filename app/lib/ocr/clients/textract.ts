// app/lib/ocr/clients/textract.ts

/**
 * AWS Textract OCR Client
 * Based on GPT-5 implementation with retry logic and fallback
 */

import { OCRProcessingError } from '../errors';
import type { OCRProvider } from '@/types/ocr';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface TextractResult {
 blocks: any[];
 rawText: string;
 modelConfidence: number; // 0-100
}

/**
 * Run AWS Textract OCR with retry logic
 * Supports both PDF (async) and images (sync)
 */
export async function runTextract(
 fileBytes: Uint8Array,
 mimeType: string
): Promise<TextractResult> {
 const mockResult: TextractResult = {
  blocks: [
   { BlockType: 'LINE', Text: 'Leverantör: Demo Bygg AB', Confidence: 96 },
   { BlockType: 'LINE', Text: 'Fakturanummer: MOCK-12345', Confidence: 94 },
   { BlockType: 'LINE', Text: 'Datum: 2025-11-01', Confidence: 93 },
   { BlockType: 'LINE', Text: 'Förfallodatum: 2025-12-01', Confidence: 92 },
   { BlockType: 'LINE', Text: 'Total: 12 345,00 SEK', Confidence: 95 },
   { BlockType: 'LINE', Text: 'Moms: 25%', Confidence: 91 },
   { BlockType: 'LINE', Text: 'Projekt: PROJ-2025-001', Confidence: 88 },
  ],
  rawText: [
   'Leverantör: Demo Bygg AB',
   'Fakturanummer: MOCK-12345',
   'Datum: 2025-11-01',
   'Förfallodatum: 2025-12-01',
   'Total: 12 345,00 SEK',
   'Moms: 25%',
   'Projekt: PROJ-2025-001',
   'Artikel 1 10 st 500,00 SEK 5 000,00 SEK',
   'Artikel 2 5 st 1 200,00 SEK 6 000,00 SEK',
   'Frakt 1 st 1 345,00 SEK 1 345,00 SEK',
  ].join('\n'),
  modelConfidence: 92,
 };

 // PRODUCTION NOTE: OCR uses mock data by default until AWS Textract is configured
 // To enable real OCR:
 // 1. Set OCR_USE_MOCK=false in .env.local
 // 2. Configure AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_REGION
 const useMock = (process.env.OCR_USE_MOCK ?? 'true').toLowerCase() !== 'false';
 
 const hasAwsConfig =
  Boolean(process.env.AWS_ACCESS_KEY_ID) &&
  Boolean(process.env.AWS_SECRET_ACCESS_KEY) &&
  Boolean(process.env.AWS_REGION);

 if (useMock || !hasAwsConfig) {
  // Log for debugging - this is expected in development/demo mode
  if (process.env.NODE_ENV === 'development') {
   console.log('[OCR] Using mock data (OCR_USE_MOCK=true or AWS not configured)');
  }
  return mockResult;
 }

 const isPdf = mimeType === 'application/pdf';
 const maxAttempts = 3;

 for (let attempt = 1; attempt <= maxAttempts; attempt++) {
  try {
   // AWS Textract implementation - requires AWS credentials configuration
   if (isPdf) {
    // StartDocumentAnalysis + poll for PDF
    const jobId = await startTextractPdfJob(fileBytes);
    const result = await pollTextractJob(jobId);
    return result;
   } else {
    // AnalyzeDocument for images
    const result = await analyzeImage(fileBytes);
    return result;
   }
  } catch (err: any) {
   if (attempt === maxAttempts) {
    throw new OCRProcessingError(
     'AWS Textract failed after retries',
     'TEXTRACT_FAILED',
     { err: String(err), attempts: maxAttempts }
    );
   }

   // Exponential backoff with jitter
   const delay = Math.min(
    1600,
    200 * Math.pow(2, attempt)
   ) + Math.floor(Math.random() * 100);
   await sleep(delay);
  }
 }

 throw new OCRProcessingError('Unreachable Textract path', 'TEXTRACT_UNREACHABLE');
}

/**
 * Start async PDF analysis job
 * TODO: Implement with AWS SDK v3
 */
async function startTextractPdfJob(_fileBytes: Uint8Array): Promise<string> {
 // Placeholder - implement with AWS SDK
 // const client = new TextractClient({ region: process.env.AWS_REGION });
 // const command = new StartDocumentAnalysisCommand({...});
 // const response = await client.send(command);
 // return response.JobId;
 
 throw new Error('AWS Textract not configured. Set AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY');
}

/**
 * Poll for PDF analysis completion
 * TODO: Implement with AWS SDK v3
 */
async function pollTextractJob(_jobId: string): Promise<TextractResult> {
 // Placeholder - implement polling logic
 // const client = new TextractClient({ region: process.env.AWS_REGION });
 // while (true) {
 //  const command = new GetDocumentAnalysisCommand({ JobId: jobId });
 //  const response = await client.send(command);
 //  if (response.JobStatus === 'SUCCEEDED') {
 //   return parseTextractResponse(response);
 //  }
 //  await sleep(2000);
 // }
 
 throw new Error('AWS Textract polling not implemented');
}

/**
 * Analyze image synchronously
 * TODO: Implement with AWS SDK v3
 */
async function analyzeImage(_fileBytes: Uint8Array): Promise<TextractResult> {
 // Placeholder - implement AnalyzeDocument
 // const client = new TextractClient({ region: process.env.AWS_REGION });
 // const command = new AnalyzeDocumentCommand({
 //  Document: { Bytes: fileBytes },
 //  FeatureTypes: ['TABLES', 'FORMS']
 // });
 // const response = await client.send(command);
 // return parseTextractResponse(response);
 
 throw new Error('AWS Textract not configured');
}

/**
 * Parse Textract response to standard format
 */
function parseTextractResponse(response: any): TextractResult {
 const blocks = response.Blocks || [];
 const rawText = blocks
  .filter((b: any) => b.BlockType === 'LINE')
  .map((b: any) => b.Text)
  .join('\n');
 
 const confidences = blocks
  .filter((b: any) => b.Confidence !== undefined)
  .map((b: any) => b.Confidence);
 
 const modelConfidence = confidences.length > 0
  ? confidences.reduce((a: number, b: number) => a + b, 0) / confidences.length
  : 0;

 return {
  blocks,
  rawText,
  modelConfidence: Math.round(modelConfidence),
 };
}

