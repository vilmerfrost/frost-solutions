// app/lib/ocr/supplierInvoices.ts
import { createAdminClient } from '@/utils/supabase/admin'
import { createClient } from '@supabase/supabase-js'
import Tesseract from 'tesseract.js'
import type { OCRResult } from '@/types/supplierInvoices'

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
    const { data } = await Tesseract.recognize(buffer, 'eng+swe', {
      logger: () => {} // Suppress logs
    })

    const text = data?.text ?? ''
    const conf = data?.confidence ?? 0

    return {
      text,
      confidence: conf,
      fields: extractInvoiceFields(text)
    }
  } catch (error) {
    console.error('Tesseract OCR error:', error)
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
    console.error('Google Vision OCR error:', error)
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
  options?: { useVision?: boolean }
): Promise<{ invoiceId: string; ocrResult: OCRResult }> {
  const admin = createAdminClient()

  // 1) OCR
  let ocr: OCRResult
  try {
    if (options?.useVision && process.env.GOOGLE_VISION_API_KEY) {
      ocr = await scanInvoiceWithGoogleVision(fileBuffer, process.env.GOOGLE_VISION_API_KEY)
    } else {
      ocr = await scanInvoiceWithTesseract(fileBuffer)
    }

    // If confidence too low, try Google Vision as fallback
    if ((ocr.confidence ?? 0) < 75 && process.env.GOOGLE_VISION_API_KEY && !options?.useVision) {
      try {
        ocr = await scanInvoiceWithGoogleVision(fileBuffer, process.env.GOOGLE_VISION_API_KEY)
      } catch (visionError) {
        console.warn('Google Vision fallback failed, using Tesseract result:', visionError)
      }
    }
  } catch (e) {
    console.error('OCR failed:', e)
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
  const { data: { user } } = await admin.auth.getUser()

  // 5) Create invoice (status depends on confidence)
  const { data: created, error } = await admin
    .from('supplier_invoices')
    .insert({
      tenant_id: tenantId,
      supplier_id: supplierId,
      project_id: projectId,
      invoice_number: invoiceNumber,
      invoice_date: ocr.fields?.invoiceDate || today,
      status: conf >= 70 ? 'pending_approval' : 'draft',
      ocr_confidence: conf,
      file_path: storagePath,
      created_by: user?.id || null
    })
    .select('id')
    .single()

  if (error) throw error

  // 6) Log to history
  await admin.from('supplier_invoice_history').insert({
    tenant_id: tenantId,
    supplier_invoice_id: created.id,
    action: 'ocr_scanned',
    data: { fileName, storagePath, confidence: conf, fields: ocr.fields },
    changed_by: user?.id || null
  })

  return { invoiceId: created.id, ocrResult: ocr }
}

