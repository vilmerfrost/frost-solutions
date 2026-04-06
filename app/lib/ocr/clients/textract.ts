// app/lib/ocr/clients/textract.ts

/**
 * AWS Textract OCR Client
 * Based on GPT-5 implementation with retry logic and fallback
 */

import {
 TextractClient,
 StartExpenseAnalysisCommand,
 GetExpenseAnalysisCommand,
 AnalyzeExpenseCommand,
 type ExpenseDocument,
} from '@aws-sdk/client-textract';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { OCRProcessingError } from '../errors';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function cleanupS3File(bucket: string, key: string): Promise<void> {
 const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
   accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
 });
 await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

function getTextractClient(): TextractClient {
 const region = process.env.AWS_REGION;
 const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
 const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

 if (!region || !accessKeyId || !secretAccessKey) {
  throw new OCRProcessingError(
   'AWS credentials missing. Set AWS_REGION, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY environment variables.',
   'TEXTRACT_CONFIG_MISSING'
  );
 }

 return new TextractClient({
  region,
  credentials: { accessKeyId, secretAccessKey },
 });
}

export interface TextractBlock {
 BlockType: string;
 Text: string;
 Confidence: number;
 FieldType?: string;
 FieldValue?: string;
 IsLineItem?: boolean;
}

export interface TextractResult {
 blocks: TextractBlock[];
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

 // Mock defaults to true in development, but throws in production to prevent silent fake data
 const useMock = process.env.OCR_USE_MOCK === 'true' ||
  (process.env.OCR_USE_MOCK === undefined && process.env.NODE_ENV !== 'production');

 const hasAwsConfig =
  Boolean(process.env.AWS_ACCESS_KEY_ID) &&
  Boolean(process.env.AWS_SECRET_ACCESS_KEY) &&
  Boolean(process.env.AWS_REGION);

 if (useMock) {
  console.warn('[OCR] AWS Textract running in MOCK mode. Set OCR_USE_MOCK=false to use real OCR.');
  return mockResult;
 }

 if (!hasAwsConfig) {
  throw new OCRProcessingError(
   'AWS Textract is not configured. Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_REGION, or set OCR_USE_MOCK=true to use mock data.',
   'TEXTRACT_NOT_CONFIGURED',
  );
 }

 const isPdf = mimeType === 'application/pdf';
 const maxAttempts = 3;

 for (let attempt = 1; attempt <= maxAttempts; attempt++) {
  try {
   // AWS Textract implementation - requires AWS credentials configuration
   if (isPdf) {
    // StartDocumentAnalysis + poll for PDF
    const { jobId, s3Key, s3Bucket } = await startTextractPdfJob(fileBytes);
    const result = await pollTextractJob(jobId);
    // Clean up the staging file from S3
    cleanupS3File(s3Bucket, s3Key).catch(() => {});
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
 * Start async expense analysis job for PDFs.
 * Uses StartExpenseAnalysisCommand which is optimized for invoices/receipts.
 * The document bytes are sent inline (no S3 bucket required).
 */
async function startTextractPdfJob(fileBytes: Uint8Array): Promise<{ jobId: string; s3Key: string; s3Bucket: string }> {
 const client = getTextractClient();

 // StartExpenseAnalysis requires an S3 document location (no inline bytes).
 // We upload to a staging bucket, then start the async job.
 const bucket = process.env.AWS_TEXTRACT_S3_BUCKET;
 if (!bucket) {
  throw new OCRProcessingError(
   'AWS_TEXTRACT_S3_BUCKET is required for async PDF processing. ' +
   'Set this environment variable to an S3 bucket name where Textract can read documents.',
   'TEXTRACT_S3_MISSING'
  );
 }

 // Upload bytes to S3 first, then start the async job
 const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
   accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
 });

 const key = `textract-input/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.pdf`;

 await s3.send(
  new PutObjectCommand({
   Bucket: bucket,
   Key: key,
   Body: fileBytes,
   ContentType: 'application/pdf',
  })
 );

 const startCommand = new StartExpenseAnalysisCommand({
  DocumentLocation: {
   S3Object: { Bucket: bucket, Name: key },
  },
 });

 try {
  const response = await client.send(startCommand);

  if (!response.JobId) {
   throw new OCRProcessingError(
    'Textract StartExpenseAnalysis returned no JobId',
    'TEXTRACT_NO_JOB_ID'
   );
  }

  return { jobId: response.JobId, s3Key: key, s3Bucket: bucket };
 } catch (err: any) {
  if (err instanceof OCRProcessingError) throw err;

  const code = err.name || err.Code || '';
  if (code === 'ThrottlingException' || code === 'ProvisionedThroughputExceededException') {
   throw new OCRProcessingError(
    'AWS Textract rate limit exceeded. Try again later.',
    'TEXTRACT_THROTTLED',
    { originalError: String(err) }
   );
  }
  if (code === 'InvalidS3ObjectException' || code === 'UnsupportedDocumentException') {
   throw new OCRProcessingError(
    `Invalid document format: ${err.message}`,
    'TEXTRACT_INVALID_DOCUMENT',
    { originalError: String(err) }
   );
  }

  throw new OCRProcessingError(
   `Textract StartExpenseAnalysis failed: ${err.message}`,
   'TEXTRACT_START_FAILED',
   { originalError: String(err) }
  );
 }
}

/**
 * Poll for expense analysis completion.
 * Polls every 2 seconds, up to 90 seconds max (45 attempts).
 * Paginates through all result pages on success.
 */
async function pollTextractJob(jobId: string): Promise<TextractResult> {
 const client = getTextractClient();
 const maxAttempts = 45;
 const pollInterval = 2000;

 for (let attempt = 0; attempt < maxAttempts; attempt++) {
  const command = new GetExpenseAnalysisCommand({ JobId: jobId });

  try {
   const response = await client.send(command);
   const status = response.JobStatus;

   if (status === 'SUCCEEDED') {
    // Collect expense documents from all pages
    let allExpenseDocuments: ExpenseDocument[] = response.ExpenseDocuments ?? [];
    let nextToken = response.NextToken;

    while (nextToken) {
     const nextCommand = new GetExpenseAnalysisCommand({
      JobId: jobId,
      NextToken: nextToken,
     });
     const nextResponse = await client.send(nextCommand);
     allExpenseDocuments = allExpenseDocuments.concat(nextResponse.ExpenseDocuments ?? []);
     nextToken = nextResponse.NextToken;
    }

    return parseExpenseDocuments(allExpenseDocuments);
   }

   if (status === 'FAILED') {
    throw new OCRProcessingError(
     `Textract job failed: ${response.StatusMessage ?? 'Unknown error'}`,
     'TEXTRACT_JOB_FAILED',
     { jobId, statusMessage: response.StatusMessage }
    );
   }

   // IN_PROGRESS or PARTIAL_SUCCESS — keep polling
   await sleep(pollInterval);
  } catch (err: any) {
   if (err instanceof OCRProcessingError) throw err;

   throw new OCRProcessingError(
    `Textract polling error: ${err.message}`,
    'TEXTRACT_POLL_ERROR',
    { jobId, originalError: String(err) }
   );
  }
 }

 throw new OCRProcessingError(
  `Textract job timed out after ${(maxAttempts * pollInterval) / 1000}s`,
  'TEXTRACT_TIMEOUT',
  { jobId }
 );
}

/**
 * Synchronous expense analysis for single-page images.
 * Uses AnalyzeExpenseCommand with inline bytes (no S3 needed).
 * Extracts invoice fields: vendor, invoice number, date, line items, totals.
 */
async function analyzeImage(fileBytes: Uint8Array): Promise<TextractResult> {
 const client = getTextractClient();

 const command = new AnalyzeExpenseCommand({
  Document: { Bytes: fileBytes },
 });

 try {
  const response = await client.send(command);
  return parseExpenseDocuments(response.ExpenseDocuments ?? []);
 } catch (err: any) {
  const code = err.name || err.Code || '';

  if (code === 'ThrottlingException' || code === 'ProvisionedThroughputExceededException') {
   throw new OCRProcessingError(
    'AWS Textract rate limit exceeded. Try again later.',
    'TEXTRACT_THROTTLED',
    { originalError: String(err) }
   );
  }
  if (code === 'UnsupportedDocumentException') {
   throw new OCRProcessingError(
    `Unsupported image format: ${err.message}`,
    'TEXTRACT_INVALID_DOCUMENT',
    { originalError: String(err) }
   );
  }
  if (code === 'InvalidParameterException') {
   throw new OCRProcessingError(
    `Invalid document: ${err.message}`,
    'TEXTRACT_INVALID_DOCUMENT',
    { originalError: String(err) }
   );
  }

  throw new OCRProcessingError(
   `Textract AnalyzeExpense failed: ${err.message}`,
   'TEXTRACT_ANALYZE_FAILED',
   { originalError: String(err) }
  );
 }
}

/**
 * Parse Textract ExpenseDocuments into the standard TextractResult format.
 * Extracts summary fields and line items from the expense analysis response,
 * mapping them into Block-like structures compatible with the rest of the pipeline.
 */
function parseExpenseDocuments(expenseDocuments: ExpenseDocument[]): TextractResult {
 const blocks: TextractBlock[] = [];
 const textLines: string[] = [];
 const confidences: number[] = [];

 for (const doc of expenseDocuments) {
  // Process summary fields (vendor, invoice number, date, totals, etc.)
  for (const group of doc.SummaryFields ?? []) {
   const fieldType = group.Type?.Text ?? '';
   const fieldValue = group.ValueDetection?.Text ?? '';
   const confidence = group.ValueDetection?.Confidence ?? 0;

   if (fieldValue) {
    const line = fieldType ? `${fieldType}: ${fieldValue}` : fieldValue;
    blocks.push({
     BlockType: 'LINE',
     Text: line,
     Confidence: confidence,
     FieldType: fieldType,
     FieldValue: fieldValue,
    });
    textLines.push(line);
    confidences.push(confidence);
   }
  }

  // Process line item groups (individual invoice rows)
  for (const lineItemGroup of doc.LineItemGroups ?? []) {
   for (const lineItem of lineItemGroup.LineItems ?? []) {
    const parts: string[] = [];
    for (const field of lineItem.LineItemExpenseFields ?? []) {
     const fieldType = field.Type?.Text ?? '';
     const fieldValue = field.ValueDetection?.Text ?? '';
     const confidence = field.ValueDetection?.Confidence ?? 0;

     if (fieldValue) {
      parts.push(fieldValue);
      confidences.push(confidence);
     }
    }

    if (parts.length > 0) {
     const lineText = parts.join(' ');
     blocks.push({
      BlockType: 'LINE',
      Text: lineText,
      Confidence: confidences.length > 0
       ? confidences[confidences.length - 1]
       : 0,
      IsLineItem: true,
     });
     textLines.push(lineText);
    }
   }
  }
 }

 const modelConfidence = confidences.length > 0
  ? confidences.reduce((a, b) => a + b, 0) / confidences.length
  : 0;

 return {
  blocks,
  rawText: textLines.join('\n'),
  modelConfidence: Math.round(modelConfidence),
 };
}

