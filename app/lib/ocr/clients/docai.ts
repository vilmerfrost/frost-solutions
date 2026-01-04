// app/lib/ocr/clients/docai.ts

/**
 * Google Document AI OCR Client
 * Based on GPT-5 implementation as fallback
 */

import { OCRProcessingError } from '../errors';

export interface DocAIResult {
 entities: any[];
 text: string;
 confidence: number; // 0-100
}

/**
 * Run Google Document AI OCR
 * Used as fallback when AWS Textract fails
 */
export async function runGoogleDocAI(
 fileBytes: Uint8Array,
 mimeType: string
): Promise<DocAIResult> {
 const useMock = (process.env.OCR_USE_MOCK ?? 'true').toLowerCase() !== 'false';

 const mockResult: DocAIResult = {
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

 if (useMock) {
  return mockResult;
 }

 try {
  const processorName = process.env.GOOGLE_DOC_AI_PROCESSOR_NAME;
  const projectId = process.env.GOOGLE_PROJECT_ID;
  const location = process.env.GOOGLE_LOCATION || 'eu';
  
  if (!processorName || !projectId) {
   return mockResult;
  }

  // Placeholder implementation
  // const client = new DocumentProcessorServiceClient();
  // const name = `projects/${projectId}/locations/${location}/processors/${processorName}`;
  // const [result] = await client.processDocument({
  //  name,
  //  rawDocument: {
  //   content: fileBytes,
  //   mimeType,
  //  },
  // });
  
  // return {
  //  entities: result.document?.entities || [],
  //  text: result.document?.text || '',
  //  confidence: (result.document?.confidence || 0) * 100,
  // };

  throw new Error('Google Document AI not implemented. Configure GOOGLE_DOC_AI_PROCESSOR_NAME and GOOGLE_PROJECT_ID');
 } catch (err: any) {
  throw new OCRProcessingError(
   'Google Document AI failed',
   'DOCAI_FAILED',
   { err: String(err) }
  );
 }
}

