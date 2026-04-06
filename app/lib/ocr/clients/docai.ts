// app/lib/ocr/clients/docai.ts

/**
 * Google Document AI OCR Client
 * Real implementation with mock fallback for development
 */

import { OCRProcessingError } from '../errors';

// ---------------------------------------------------------------------------
// Entity extraction helpers
// ---------------------------------------------------------------------------

export interface ExtractedEntity {
 type: string;
 mentionText: string;
 confidence: number;
}

export interface DocAIResult {
 entities: ExtractedEntity[];
 text: string;
 confidence: number; // 0-100
}

// ---------------------------------------------------------------------------
// Mock data — used when OCR_USE_MOCK=true or when credentials are missing
// ---------------------------------------------------------------------------

const MOCK_RESULT: DocAIResult = {
 entities: [],
 text: [
  'Leverantör: Demo Bygg AB',
  'Fakturanummer: DOC-98765',
  'Datum: 2025-11-05',
  'Förfallodatum: 2025-12-05',
  'Total: 8 750,00 SEK',
  'Moms: 25%',
  'Projekt: PROJ-2025-002',
  'Material 20 st 250,00 SEK 5 000,00 SEK',
  'Arbete 15 h 150,00 SEK 2 250,00 SEK',
  'Frakt 1 st 1 500,00 SEK 1 500,00 SEK',
 ].join('\n'),
 confidence: 78,
};

/**
 * Map Document AI entity types to a flat list of { type, mentionText, confidence }.
 * Handles nested properties (line_item sub-fields) by flattening them.
 */
function mapEntities(rawEntities: Array<{ type?: string; mentionText?: string; confidence?: number; properties?: Array<{ type?: string; mentionText?: string; confidence?: number }> }>): ExtractedEntity[] {
 const result: ExtractedEntity[] = [];

 for (const entity of rawEntities) {
  result.push({
   type: entity.type ?? 'unknown',
   mentionText: entity.mentionText ?? '',
   confidence: entity.confidence ?? 0,
  });

  // Flatten nested properties (e.g. line_item/description, line_item/amount)
  if (Array.isArray(entity.properties)) {
   for (const prop of entity.properties) {
    result.push({
     type: `${entity.type}/${prop.type ?? 'unknown'}`,
     mentionText: prop.mentionText ?? '',
     confidence: prop.confidence ?? 0,
    });
   }
  }
 }

 return result;
}

/**
 * Calculate an overall confidence score (0-100) from Document AI entities.
 * Falls back to document-level confidence when available, otherwise averages
 * individual entity confidences.
 */
function calculateConfidence(
 documentConfidence: number | null | undefined,
 entities: ExtractedEntity[],
): number {
 // Document-level confidence from the API (0-1 range)
 if (typeof documentConfidence === 'number' && documentConfidence > 0) {
  return Math.round(documentConfidence * 100);
 }

 // Average entity confidences
 if (entities.length === 0) return 0;
 const sum = entities.reduce((acc, e) => acc + e.confidence, 0);
 return Math.round((sum / entities.length) * 100);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Run Google Document AI OCR.
 * Used as fallback when AWS Textract fails.
 *
 * Environment variables:
 *  - OCR_USE_MOCK          : "true" (default) to skip real API calls
 *  - GOOGLE_DOC_AI_PROCESSOR_NAME : e.g. "abc123def456" (processor ID)
 *  - GOOGLE_PROJECT_ID     : GCP project ID
 *  - GOOGLE_LOCATION       : processor region, default "eu"
 *  - GOOGLE_APPLICATION_CREDENTIALS : path to service account JSON (standard GCP auth)
 */
export async function runGoogleDocAI(
 fileBytes: Uint8Array,
 mimeType: string,
): Promise<DocAIResult> {
 // ── Check for explicit mock mode ──────────────────────────────────────
 // Mock defaults to true in development, but throws in production to prevent silent fake data
 const useMock = process.env.OCR_USE_MOCK === 'true' ||
  (process.env.OCR_USE_MOCK === undefined && process.env.NODE_ENV !== 'production');

 if (useMock) {
  console.warn(
   '[OCR] Google Document AI is running in MOCK mode. ' +
   'Set OCR_USE_MOCK=false and configure GOOGLE_DOC_AI_PROCESSOR_NAME, ' +
   'GOOGLE_PROJECT_ID to use real OCR.',
  );
  return MOCK_RESULT;
 }

 // ── Validate required env vars ────────────────────────────────────────
 const processorId = process.env.GOOGLE_DOC_AI_PROCESSOR_NAME;
 const projectId = process.env.GOOGLE_PROJECT_ID;
 const location = process.env.GOOGLE_LOCATION || 'eu';

 if (!processorId || !projectId) {
  throw new OCRProcessingError(
   'Google Document AI is not configured. Set GOOGLE_DOC_AI_PROCESSOR_NAME and GOOGLE_PROJECT_ID, or set OCR_USE_MOCK=true to use mock data.',
   'DOCAI_NOT_CONFIGURED',
  );
 }

 // ── Call Document AI ──────────────────────────────────────────────────
 try {
  const { DocumentProcessorServiceClient } = await import(
   '@google-cloud/documentai'
  );

  // On Vercel (serverless), GOOGLE_APPLICATION_CREDENTIALS file path won't work.
  // Use GOOGLE_CREDENTIALS_BASE64 to pass credentials inline.
  const credentialsBase64 = process.env.GOOGLE_CREDENTIALS_BASE64;
  const clientOptions = credentialsBase64
   ? { credentials: JSON.parse(Buffer.from(credentialsBase64, 'base64').toString('utf-8')) }
   : {}; // Falls back to GOOGLE_APPLICATION_CREDENTIALS file path

  const client = new DocumentProcessorServiceClient(clientOptions);

  const processorName = `projects/${projectId}/locations/${location}/processors/${processorId}`;

  // Encode bytes to base64 string (the API expects a string | Uint8Array)
  const encodedContent = Buffer.from(fileBytes).toString('base64');

  const [response] = await client.processDocument({
   name: processorName,
   rawDocument: {
    content: encodedContent,
    mimeType,
   },
  });

  const document = response.document;

  if (!document) {
   throw new Error('Document AI returned no document in response');
  }

  const fullText = document.text ?? '';
  const rawEntities = (document.entities ?? []) as Array<{ type?: string; mentionText?: string; confidence?: number; properties?: Array<{ type?: string; mentionText?: string; confidence?: number }> }>;
  const entities = mapEntities(rawEntities);
  // Document AI doesn't expose a top-level confidence directly;
  // we derive it from entity-level confidences instead.
  const confidence = calculateConfidence(null, entities);

  return {
   entities,
   text: fullText,
   confidence,
  };
 } catch (err: unknown) {
  if (err instanceof OCRProcessingError) {
   throw err;
  }

  throw new OCRProcessingError(
   'Google Document AI failed',
   'DOCAI_FAILED',
   { err: String(err) },
  );
 }
}
