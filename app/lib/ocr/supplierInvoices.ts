// app/lib/ocr/supplierInvoices.ts
// Optimized OCR: Gemini 2.0 Flash (primary) > Google Vision (fallback) > Tesseract (free backup)
import { createAdminClient } from '@/utils/supabase/admin'
import type { OCRResult } from '@/types/supplierInvoices'
import { callOpenRouterVision, MODELS } from '@/lib/ai/openrouter'
import { InvoiceOCRResultSchema } from '@/lib/ai/frost-bygg-ai-schemas'
import { ocrLogger as logger } from '@/lib/logger'
import {
 loadTesseract,
 resolveTesseractPaths,
 uploadSupplierInvoiceToStorage,
 extractInvoiceFields,
} from './supplierInvoices.utils'

export async function scanInvoiceWithTesseract(buffer: Buffer): Promise<OCRResult> {
 try {
  const tesseract = await loadTesseract()
  if (!tesseract) {
   throw new Error('tesseract.js could not be loaded')
  }

  const customPaths = resolveTesseractPaths()
  const { data } = await tesseract.recognize(buffer, 'eng+swe', {
   logger: () => {},
   ...(customPaths ?? {}),
  })

  const text = data?.text ?? ''
  const conf = data?.confidence ?? 0

  return {
   text,
   confidence: conf,
   fields: extractInvoiceFields(text)
  }
 } catch (error) {
  logger.error({ error }, 'Tesseract OCR error')
  throw error
 }
}

/**
 * Scan invoice using Gemini 2.0 Flash (RECOMMENDED - best quality + cheaper)
 */
export async function scanInvoiceWithGemini(
 buffer: Buffer,
 filename?: string
): Promise<OCRResult> {
 if (!process.env.OPENROUTER_API_KEY) {
  throw new Error('OPENROUTER_API_KEY saknas')
 }

 try {
  const base64 = buffer.toString('base64')
  const ext = filename?.split('.').pop()?.toLowerCase()
  const mimeMap: Record<string, string> = {
   jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
   gif: 'image/gif', webp: 'image/webp', pdf: 'application/pdf',
  }
  const mimeType = mimeMap[ext || ''] || 'image/jpeg'

  const INVOICE_OCR_PROMPT = `Du är en AI-specialist på dokumenttolkning för svenska bygg- och hantverksföretag. Extrahera strukturerad data från denna leverantörsfaktura.

DOMÄNKUNSKAP:
- Svenska fakturor har ofta bankgiro/plusgiro, OCR-nummer, organisationsnummer (XXXXXX-XXXX)
- Momssatser: 25% (standard), 12% (livsmedel), 6% (kultur), 0% (omvänd skattskyldighet)
- Byggmaterialleverantörer: Beijer, Byggmax, Dahl, Ahlsell, Solar
- "Att betala" / "Summa att betala" = totalAmount. "Netto" / "Exkl moms" = subtotal
- Förfallodatum: "Förfaller", "Sista betalningsdag", "Due date"

REGLER:
- Returnera ALLTID giltig JSON. Datum: YYYY-MM-DD. Belopp: nummer utan tusentalsavgränsare ("1 234,50" → 1234.50)
- Om ett fält saknas: null. Inkludera ALLA synliga rader.
- ocrConfidence: 90+ tydligt, 60-89 osäkert, under 60 gissning

JSON-SCHEMA:
{
 "supplierName": "string", "supplierEmail": "string|null", "supplierPhone": "string|null", "supplierOrgNumber": "string|null",
 "invoiceNumber": "string", "invoiceDate": "YYYY-MM-DD", "dueDate": "YYYY-MM-DD|null",
 "subtotal": number, "vatRate": number, "vatAmount": number, "totalAmount": number, "currency": "SEK",
 "lineItems": [{"description":"string","quantity":number,"unit":"string","unitPrice":number,"total":number,"taxRate":number|null}],
 "projectReference": "string|null", "projectNumber": "string|null",
 "ocrConfidence": number, "extractedAt": "ISO 8601", "rawText": "all synlig text"
}`

  const result = await callOpenRouterVision(
   INVOICE_OCR_PROMPT,
   'Läs och extrahera all information från denna faktura.',
   base64,
   { jsonMode: true, model: MODELS.OCR, mimeType }
  )

  const parsed = InvoiceOCRResultSchema.parse(result)

  return {
   text: parsed.rawText,
   confidence: parsed.ocrConfidence,
   fields: {
    invoiceNumber: parsed.invoiceNumber,
    invoiceDate: parsed.invoiceDate,
    amount: String(parsed.totalAmount),
    supplier: parsed.supplierName,
    projectReference: parsed.projectReference || undefined,
   },
   structuredData: parsed,
  }
 } catch (error) {
  logger.error({ error }, 'OpenRouter OCR error')
  throw error
 }
}

export async function scanInvoiceWithGoogleVision(
 buffer: Buffer,
 apiKey?: string
): Promise<OCRResult> {
 if (!apiKey) {
  throw new Error('Google Vision API key saknas')
 }

 // Convert buffer to base64
 const base64Image = buffer.toString('base64')

 try {
  const response = await fetch(
   `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
   {
    method: 'POST',
    headers: {
     'Content-Type': 'application/json'
    },
    body: JSON.stringify({
     requests: [
      {
       image: { content: base64Image },
       features: [{ type: 'TEXT_DETECTION' }]
      }
     ]
    })
   }
  )

  if (!response.ok) {
   throw new Error(`Google Vision API failed: ${response.statusText}`)
  }

  const result = await response.json()

  if (!result.responses?.[0]?.fullTextAnnotation) {
   throw new Error('Google Vision API returned no text')
  }

  const text = result.responses[0].fullTextAnnotation.text
  const confidence = 95 // Google typically ~95%

  return {
   text,
   confidence,
   fields: extractInvoiceFields(text)
  }
 } catch (error) {
  logger.error({ error }, 'Google Vision OCR error')
  throw error
 }
}

export async function processScannedInvoice(
 fileName: string,
 fileBuffer: Buffer,
 supplierId: string,
 projectId: string | null,
 tenantId: string,
 options?: { useVision?: boolean; createdBy?: string | null; mimeType?: string }
): Promise<{ invoiceId: string; ocrResult: OCRResult }> {
 const admin = createAdminClient() // Use default 'public' schema for RPC calls

 // 1) OCR - Priority: Gemini 2.0 Flash > Google Vision > Tesseract (free)
 const mimeType = options?.mimeType ?? ''
 const isImage = mimeType.startsWith('image/')
 const hasGeminiKey = Boolean(process.env.OPENROUTER_API_KEY)
 const hasVisionKey = Boolean(process.env.GOOGLE_VISION_API_KEY)

 let ocr: OCRResult | null = null

 // Try Gemini 2.0 Flash first (best quality + cheaper)
 if (hasGeminiKey) {
  try {
   logger.info({ fileName }, 'Attempting Gemini 2.0 Flash OCR')
   ocr = await scanInvoiceWithGemini(fileBuffer, fileName)
   logger.info({ confidence: ocr.confidence }, 'Gemini OCR successful')
  } catch (geminiError) {
   logger.warn({ error: geminiError }, 'Gemini OCR failed')
  }
 }

 // Fallback to Google Vision if Gemini failed or unavailable
 if (!ocr && hasVisionKey) {
  try {
   logger.info({ fileName }, 'Attempting Google Vision OCR')
   ocr = await scanInvoiceWithGoogleVision(fileBuffer, process.env.GOOGLE_VISION_API_KEY)
   logger.info({ confidence: ocr.confidence }, 'Google Vision OCR successful')
  } catch (visionError) {
   logger.warn({ error: visionError }, 'Google Vision OCR failed')
  }
 }

 // Final fallback to Tesseract (free, works offline)
 if (!ocr && isImage) {
  try {
   logger.info({ fileName }, 'Attempting Tesseract OCR (free fallback)')
   ocr = await scanInvoiceWithTesseract(fileBuffer)
   logger.info({ confidence: ocr.confidence }, 'Tesseract OCR successful')
  } catch (tesseractError) {
   logger.warn({ error: tesseractError }, 'Tesseract OCR failed')
  }
 }

 // If all OCR methods failed, log warning
 if (!ocr) {
  logger.warn({ mimeType: mimeType || 'unknown' }, 'All OCR methods failed or unavailable')
 }

 if (!ocr) {
  // Continue anyway, mark for manual review
  ocr = {
   text: '',
   confidence: 0,
   fields: {}
  }
 }

 // 2) Upload to storage
 const storagePath = await uploadSupplierInvoiceToStorage(tenantId, fileName, fileBuffer)

 // 3) Parse extracted fields
 const invoiceNumber = ocr.fields?.invoiceNumber || `OCR-${Date.now()}`
 const today = new Date().toISOString().slice(0, 10)
 const conf = Math.max(0, Math.min(100, Number(ocr.confidence ?? 0)))

 // 4) Get user ID
 const createdBy = options?.createdBy ?? null

 // 5) Create invoice using RPC function (handles both invoice and history in transaction)
 // Use JSONB wrapper (v2) for better schema cache compatibility
 logger.debug({ tenantId }, 'Calling RPC insert_supplier_invoice_v2 (JSONB wrapper)')
 
 // Build payload object (order doesn't matter with JSONB!)
 const payload = {
  p_tenant_id: tenantId,
  p_supplier_id: supplierId,
  p_project_id: projectId || undefined, // Omit if null to use DEFAULT
  p_file_path: storagePath,
  p_file_size: fileBuffer.length,
  p_mime_type: mimeType || 'application/pdf',
  p_original_filename: fileName,
  p_invoice_number: invoiceNumber || undefined,
  p_invoice_date: ocr.fields?.invoiceDate || today,
  p_status: conf >= 70 ? 'pending_approval' : 'draft',
  p_ocr_confidence: conf > 0 ? conf : undefined,
  p_ocr_data: ocr.text ? { text: ocr.text, confidence: conf } : undefined,
  p_extracted_data: ocr.fields && Object.keys(ocr.fields).length > 0 ? ocr.fields : undefined,
  p_created_by: createdBy || undefined
 }
 
 // Remove undefined values (let PostgreSQL use DEFAULTs)
 const cleanPayload = Object.fromEntries(
  Object.entries(payload).filter(([_, value]) => value !== undefined)
 )
 
 logger.debug({ payload: cleanPayload }, 'RPC payload')
 
 // Try v2 (JSONB wrapper) first, fallback to v1 if needed
 let invoiceData: any = null
 let rpcError: any = null
 
 try {
  const { data, error } = await admin.rpc('insert_supplier_invoice_v2', {
   p_payload: cleanPayload
  })
  invoiceData = data
  rpcError = error
 } catch (err: any) {
  // If v2 doesn't exist or fails, try v1 (backwards compatibility)
  logger.warn({ error: err.message }, 'RPC v2 failed, trying v1')
  try {
   const { data, error } = await admin.rpc('insert_supplier_invoice', cleanPayload)
   invoiceData = data
   rpcError = error
  } catch (v1Err: any) {
   rpcError = v1Err
  }
 }

 if (rpcError) {
  logger.error({
   code: rpcError.code,
   message: rpcError.message,
   details: rpcError.details,
   hint: rpcError.hint
  }, 'RPC call failed')
  
  // Provide helpful error message
  let errorMsg = `Failed to create invoice: ${rpcError.message}`
  if (rpcError.message?.includes('does not exist') || rpcError.message?.includes('schema cache')) {
   errorMsg += '. Schema cache may be stale. Run: NOTIFY pgrst, "reload schema"; in Supabase SQL Editor.'
  } else if (rpcError.message?.includes('function')) {
   errorMsg += '. Make sure RPC functions are created. Run supabase/rpc/supplier_invoices_v2.sql'
  }
  
  throw new Error(errorMsg)
 }

 logger.info({ invoiceData }, 'RPC call successful')

 const invoiceId = invoiceData?.id
 if (!invoiceId) {
  logger.error({ response: invoiceData }, 'No invoice ID in response')
  throw new Error('Invoice created but no ID returned from RPC function')
 }

 logger.info({ invoiceId }, 'Invoice created successfully')
 return { invoiceId, ocrResult: ocr }
}

