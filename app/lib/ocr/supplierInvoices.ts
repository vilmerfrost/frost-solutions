// app/lib/ocr/supplierInvoices.ts
// Optimized OCR: Gemini 2.0 Flash (primary) > Google Vision (fallback) > Tesseract (free backup)
import fs from 'node:fs'
import path from 'node:path'
import { createAdminClient } from '@/utils/supabase/admin'
import { createClient } from '@supabase/supabase-js'
import type { OCRResult } from '@/types/supplierInvoices'
import { processInvoiceOCR as geminiInvoiceOCR } from '@/lib/ai/frost-bygg-ai-integration'
import { ocrLogger as logger } from '@/lib/logger'

type TesseractModule = typeof import('tesseract.js')

let tesseractPromise: Promise<TesseractModule | null> | null = null

async function loadTesseract(): Promise<TesseractModule | null> {
 if (!tesseractPromise) {
  tesseractPromise = import('tesseract.js')
   .then((mod) => (mod.default ? (mod.default as unknown as TesseractModule) : (mod as unknown as TesseractModule)))
   .catch((err) => {
    logger.error({ error: err }, 'Failed to load tesseract.js')
    return null
   })
 }
 return tesseractPromise
}

function resolveTesseractPaths() {
 try {
  const root = process.cwd()
  const workerPath = path.resolve(root, 'node_modules/tesseract.js/src/worker-script/node/index.js')
  const corePath = path.resolve(root, 'node_modules/tesseract.js-core/tesseract-core.wasm.js')

  if (!fs.existsSync(workerPath) || !fs.existsSync(corePath)) {
   throw new Error('Resolved tesseract assets not found on disk')
  }

  return {
   workerPath,
   corePath,
   langPath: 'https://tessdata.projectnaptha.com/4.0.0_fast/', // Remote tessdata
  }
 } catch (err) {
  logger.warn({ error: err }, 'Unable to resolve tesseract.js paths, falling back to defaults')
  return undefined
 }
}

async function uploadToStorage(tenantId: string, fileName: string, buf: Buffer): Promise<string> {
 const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
 const key = process.env.SUPABASE_SERVICE_ROLE_KEY

 if (!url || !key) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
 }

 const srv = createClient(url, key, {
  auth: {
   persistSession: false,
   autoRefreshToken: false
  }
 })

 const path = `${tenantId}/${Date.now()}_${fileName}`

 const { error } = await srv.storage.from('supplier_invoices').upload(path, buf, {
  upsert: false,
  contentType: 'application/pdf'
 })

 if (error) throw error

 return path
}

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
 const geminiKey = process.env.GEMINI_API_KEY
 if (!geminiKey) {
  throw new Error('GEMINI_API_KEY saknas')
 }

 try {
  const result = await geminiInvoiceOCR(buffer, filename)
  
  return {
   text: result.rawText,
   confidence: result.ocrConfidence,
   fields: {
    invoiceNumber: result.invoiceNumber,
    invoiceDate: result.invoiceDate,
    amount: String(result.totalAmount),
    supplier: result.supplierName,
    projectReference: result.projectReference || undefined,
   },
   // Full structured data from Gemini
   structuredData: result,
  }
 } catch (error) {
  logger.error({ error }, 'Gemini OCR error')
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

function extractInvoiceFields(text: string): Record<string, string> {
 const fields: Record<string, string> = {}

 // Invoice number (common patterns: "Faktura: 12345", "INV-12345", "Fakturanr: 12345")
 const invoiceMatch = text.match(/(?:faktura|inv|invoice)[\s:]*([A-Z0-9\-]{4,20})/i)
 if (invoiceMatch?.[1]) {
  fields.invoiceNumber = invoiceMatch[1]
 }

 // Invoice date (Swedish format: "15 november 2025" or "2025-11-15")
 const dateMatch = text.match(
  /(?:fakturadatum|invoice date|datum)[\s:]*(\d{1,2}[.\s\-\/]\s?(?:jan|januari|feb|februari|mar|mars|apr|april|maj|juni|juli|aug|augusti|sep|september|okt|oktober|nov|november|dec|december|\d{1,2})[.\s\-\/]\s?\d{4})/i
 )
 if (dateMatch?.[1]) {
  fields.invoiceDate = dateMatch[1]
 }

 // Amount (Swedish format: "1 234,56 SEK" or "1234.56")
 const amountMatch = text.match(/(?:total|sum|belopp|amount)[\s:]*([0-9\s\,\.]+)\s*(?:SEK|kr)?/i)
 if (amountMatch?.[1]) {
  const cleaned = amountMatch[1].replace(/\s/g, '').replace(',', '.')
  fields.amount = cleaned
 }

 // Supplier name (usually at top of invoice)
 const lines = text.split('\n')
 if (lines[0]?.trim()) {
  fields.supplier = lines[0].trim()
 }

 // Project reference (common patterns: "Projekt: 123", "Ref: 123", "Objekt: 123")
 const projectMatch = text.match(/(?:projekt|project|ref|referens|objekt|object)[\s:]*([A-Z0-9\-]{4,20})/i)
 if (projectMatch?.[1]) {
  fields.projectReference = projectMatch[1]
 }

 return fields
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
 const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY)
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
 const storagePath = await uploadToStorage(tenantId, fileName, fileBuffer)

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

