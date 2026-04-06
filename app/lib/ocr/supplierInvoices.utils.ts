import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { ocrLogger as logger } from '@/lib/logger'

type TesseractModule = typeof import('tesseract.js')

let tesseractPromise: Promise<TesseractModule | null> | null = null

export async function loadTesseract(): Promise<TesseractModule | null> {
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

export function resolveTesseractPaths() {
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
      langPath: 'https://tessdata.projectnaptha.com/4.0.0_fast/',
    }
  } catch (err) {
    logger.warn({ error: err }, 'Unable to resolve tesseract.js paths, falling back to defaults')
    return undefined
  }
}

export async function uploadSupplierInvoiceToStorage(
  tenantId: string,
  fileName: string,
  buf: Buffer
): Promise<string> {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }

  const srv = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  const storagePath = `${tenantId}/${Date.now()}_${fileName}`
  const { error } = await srv.storage.from('supplier_invoices').upload(storagePath, buf, {
    upsert: false,
    contentType: 'application/pdf',
  })

  if (error) throw error

  return storagePath
}

export function extractInvoiceFields(text: string): Record<string, string> {
  const fields: Record<string, string> = {}

  const invoiceMatch = text.match(/(?:faktura|inv|invoice)[\s:]*([A-Z0-9\-]{4,20})/i)
  if (invoiceMatch?.[1]) {
    fields.invoiceNumber = invoiceMatch[1]
  }

  const dateMatch = text.match(
    /(?:fakturadatum|invoice date|datum)[\s:]*(\d{1,2}[.\s\-\/]\s?(?:jan|januari|feb|februari|mar|mars|apr|april|maj|juni|juli|aug|augusti|sep|september|okt|oktober|nov|november|dec|december|\d{1,2})[.\s\-\/]\s?\d{4})/i
  )
  if (dateMatch?.[1]) {
    fields.invoiceDate = dateMatch[1]
  }

  const amountMatch = text.match(/(?:total|sum|belopp|amount)[\s:]*([0-9\s\,\.]+)\s*(?:SEK|kr)?/i)
  if (amountMatch?.[1]) {
    const cleaned = amountMatch[1].replace(/\s/g, '').replace(',', '.')
    fields.amount = cleaned
  }

  const lines = text.split('\n')
  if (lines[0]?.trim()) {
    fields.supplier = lines[0].trim()
  }

  const projectMatch = text.match(/(?:projekt|project|ref|referens|objekt|object)[\s:]*([A-Z0-9\-]{4,20})/i)
  if (projectMatch?.[1]) {
    fields.projectReference = projectMatch[1]
  }

  return fields
}
