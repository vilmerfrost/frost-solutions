import { PDFDocument, StandardFonts, rgb, PDFPage, PDFFont } from 'pdf-lib'

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const COLORS = {
  primary: rgb(0.118, 0.251, 0.686),   // #1e40af
  black: rgb(0.067, 0.067, 0.067),      // #111111
  darkGray: rgb(0.267, 0.267, 0.267),   // #444444
  gray: rgb(0.467, 0.467, 0.467),       // #777777
  lightGray: rgb(0.867, 0.867, 0.867),  // #dddddd
  white: rgb(1, 1, 1),
  tableHeader: rgb(0.941, 0.945, 0.961), // #f0f1f5
}

const PAGE_MARGIN = 50
const PAGE_WIDTH = 595.28  // A4
const PAGE_HEIGHT = 841.89 // A4
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2
const FOOTER_RESERVE = 60  // Space reserved for footer at bottom of page
const CONTENT_TOP = PAGE_HEIGHT - PAGE_MARGIN - 20 // Starting y for continuation pages

/** Tracks the current page and handles automatic page breaks. */
interface PageContext {
  doc: PDFDocument
  page: PDFPage
  fonts: { bold: PDFFont; regular: PDFFont }
  companyName: string
  orgNumber: string | null
  pageNumber: number
}

/**
 * Checks if there is enough room on the current page for `needed` points.
 * If not, draws the footer on the current page, adds a new page, and returns
 * the new y position at the top of the fresh page.
 */
function ensureSpace(ctx: PageContext, y: number, needed: number): { y: number; page: PDFPage } {
  if (y - needed >= FOOTER_RESERVE) {
    return { y, page: ctx.page }
  }
  // Draw footer with page number on the current page
  drawPageFooter(ctx.page, ctx.fonts.regular, ctx.companyName, ctx.orgNumber, ctx.pageNumber)
  // Add a new page
  ctx.pageNumber += 1
  const newPage = ctx.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  ctx.page = newPage
  return { y: CONTENT_TOP, page: newPage }
}

/** Footer variant that includes page number. */
function drawPageFooter(
  page: PDFPage,
  font: PDFFont,
  companyName: string,
  orgNumber: string | null,
  pageNumber: number,
) {
  const footerY = 30
  drawLine(page, footerY + 12)
  const parts = [companyName, orgNumber ? `Org.nr: ${orgNumber}` : null].filter(Boolean).join('  |  ')
  page.drawText(parts, {
    x: PAGE_MARGIN,
    y: footerY,
    size: 7,
    font,
    color: COLORS.gray,
  })
  const rightText = `Sida ${pageNumber}  |  Genererat av Frost Solutions`
  page.drawText(rightText, {
    x: PAGE_WIDTH - PAGE_MARGIN - font.widthOfTextAtSize(rightText, 7),
    y: footerY,
    size: 7,
    font,
    color: COLORS.gray,
  })
}

function formatSEK(amount: number): string {
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: 'SEK',
    minimumFractionDigits: 2,
  }).format(amount)
}

function formatDate(date: string | null | undefined): string {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('sv-SE')
}

/** Draws a horizontal line across the content area. */
function drawLine(page: PDFPage, y: number, thickness = 0.5) {
  page.drawLine({
    start: { x: PAGE_MARGIN, y },
    end: { x: PAGE_WIDTH - PAGE_MARGIN, y },
    thickness,
    color: COLORS.lightGray,
  })
}

/** Draw the standard footer with org number. */
function drawFooter(
  page: PDFPage,
  font: PDFFont,
  companyName: string,
  orgNumber: string | null,
) {
  const footerY = 30
  drawLine(page, footerY + 12)
  const parts = [companyName, orgNumber ? `Org.nr: ${orgNumber}` : null].filter(Boolean).join('  |  ')
  page.drawText(parts, {
    x: PAGE_MARGIN,
    y: footerY,
    size: 7,
    font,
    color: COLORS.gray,
  })
  page.drawText('Genererat av Frost Solutions', {
    x: PAGE_WIDTH - PAGE_MARGIN - font.widthOfTextAtSize('Genererat av Frost Solutions', 7),
    y: footerY,
    size: 7,
    font,
    color: COLORS.gray,
  })
}

/** Draw company header block (top-left: company name, top-right: document title). */
function drawHeader(
  page: PDFPage,
  fonts: { bold: PDFFont; regular: PDFFont },
  companyName: string,
  documentTitle: string,
  subtitle?: string,
): number {
  let y = PAGE_HEIGHT - PAGE_MARGIN

  // Company name
  page.drawText(companyName, {
    x: PAGE_MARGIN,
    y,
    size: 18,
    font: fonts.bold,
    color: COLORS.primary,
  })

  // Document title (right-aligned)
  const titleWidth = fonts.bold.widthOfTextAtSize(documentTitle, 24)
  page.drawText(documentTitle, {
    x: PAGE_WIDTH - PAGE_MARGIN - titleWidth,
    y,
    size: 24,
    font: fonts.bold,
    color: COLORS.black,
  })

  y -= 16

  if (subtitle) {
    const subWidth = fonts.regular.widthOfTextAtSize(subtitle, 10)
    page.drawText(subtitle, {
      x: PAGE_WIDTH - PAGE_MARGIN - subWidth,
      y,
      size: 10,
      font: fonts.regular,
      color: COLORS.gray,
    })
    y -= 10
  }

  // Decorative line under header
  y -= 8
  page.drawLine({
    start: { x: PAGE_MARGIN, y },
    end: { x: PAGE_WIDTH - PAGE_MARGIN, y },
    thickness: 2,
    color: COLORS.primary,
  })

  return y - 20
}

/** Draw a label-value pair, returns updated y. */
function drawField(
  page: PDFPage,
  fonts: { bold: PDFFont; regular: PDFFont },
  x: number,
  y: number,
  label: string,
  value: string,
  labelSize = 8,
  valueSize = 10,
): number {
  page.drawText(label, { x, y, size: labelSize, font: fonts.regular, color: COLORS.gray })
  page.drawText(value, { x, y: y - 13, size: valueSize, font: fonts.bold, color: COLORS.black })
  return y - 30
}

/** Wraps text to fit within maxWidth, returns array of lines. */
function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    if (font.widthOfTextAtSize(testLine, size) > maxWidth && currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = testLine
    }
  }
  if (currentLine) lines.push(currentLine)
  return lines
}

// ---------------------------------------------------------------------------
// Tenant info type used across generators
// ---------------------------------------------------------------------------

export interface TenantInfo {
  name: string
  org_number: string | null
}

// ---------------------------------------------------------------------------
// 1. ATA (ÄTA) Document PDF
// ---------------------------------------------------------------------------

export interface AtaDocumentData {
  id: string
  title: string | null
  description: string
  change_type: string | null
  status: string | null
  hours: number | null
  custom_hourly_rate: number | null
  estimated_material_cost: number | null
  ordered_by_name: string | null
  customer_email: string | null
  photos: string[] | null
  created_at: string | null
  project_name?: string
  customer_name?: string
}

export async function generateAtaPdf(
  ata: AtaDocumentData,
  tenant: TenantInfo,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const regular = await doc.embedFont(StandardFonts.Helvetica)
  const fonts = { bold, regular }

  let page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  const ctx: PageContext = {
    doc, page, fonts,
    companyName: tenant.name,
    orgNumber: tenant.org_number,
    pageNumber: 1,
  }

  // Header
  let y = drawHeader(page, fonts, tenant.name, 'ÄTA', ata.id.slice(0, 8).toUpperCase())

  // Project & meta info
  const leftX = PAGE_MARGIN
  const rightX = PAGE_MARGIN + CONTENT_WIDTH / 2

  if (ata.project_name) {
    ;({ y, page } = ensureSpace(ctx, y, 30))
    y = drawField(page, fonts, leftX, y, 'Projekt', ata.project_name)
  }
  if (ata.customer_name) {
    drawField(page, fonts, rightX, y + 30, 'Kund', ata.customer_name)
  }

  const typeLabels: Record<string, string> = {
    addition: 'Tillägg',
    deduction: 'Avdrag',
    change: 'Ändring',
  }
  if (ata.change_type) {
    ;({ y, page } = ensureSpace(ctx, y, 30))
    y = drawField(page, fonts, leftX, y, 'Typ', typeLabels[ata.change_type] ?? ata.change_type)
  }
  if (ata.ordered_by_name) {
    drawField(page, fonts, rightX, y + 30, 'Beställd av', ata.ordered_by_name)
  }

  ;({ y, page } = ensureSpace(ctx, y, 30))
  y = drawField(page, fonts, leftX, y, 'Datum', formatDate(ata.created_at))
  if (ata.status) {
    drawField(page, fonts, rightX, y + 30, 'Status', ata.status)
  }

  // Description
  y -= 10
  ;({ y, page } = ensureSpace(ctx, y, 30))
  page.drawText('Beskrivning', { x: leftX, y, size: 10, font: bold, color: COLORS.black })
  y -= 16

  const descLines = wrapText(ata.description, regular, 10, CONTENT_WIDTH)
  for (const line of descLines) {
    ;({ y, page } = ensureSpace(ctx, y, 14))
    page.drawText(line, { x: leftX, y, size: 10, font: regular, color: COLORS.darkGray })
    y -= 14
  }

  // Cost summary
  y -= 10
  ;({ y, page } = ensureSpace(ctx, y, 40))
  drawLine(page, y)
  y -= 20

  page.drawText('Kostnadssammanställning', { x: leftX, y, size: 12, font: bold, color: COLORS.black })
  y -= 20

  const workCost = (ata.hours ?? 0) * (ata.custom_hourly_rate ?? 0)
  const materialCost = ata.estimated_material_cost ?? 0
  const totalCost = workCost + materialCost

  if (ata.hours) {
    ;({ y, page } = ensureSpace(ctx, y, 30))
    y = drawField(page, fonts, leftX, y, 'Arbetstimmar', `${ata.hours} tim`)
  }
  if (ata.custom_hourly_rate) {
    drawField(page, fonts, rightX, y + 30, 'Timpris', formatSEK(ata.custom_hourly_rate))
  }
  if (workCost > 0) {
    ;({ y, page } = ensureSpace(ctx, y, 30))
    y = drawField(page, fonts, leftX, y, 'Arbetskostnad', formatSEK(workCost))
  }
  if (materialCost > 0) {
    ;({ y, page } = ensureSpace(ctx, y, 30))
    y = drawField(page, fonts, leftX, y, 'Materialkostnad', formatSEK(materialCost))
  }

  ;({ y, page } = ensureSpace(ctx, y, 30))
  drawLine(page, y + 5)
  y -= 10
  page.drawText('Totalt:', { x: leftX, y, size: 12, font: bold, color: COLORS.black })
  const totalStr = formatSEK(totalCost)
  page.drawText(totalStr, {
    x: PAGE_WIDTH - PAGE_MARGIN - bold.widthOfTextAtSize(totalStr, 14),
    y,
    size: 14,
    font: bold,
    color: COLORS.primary,
  })

  // Photos reference
  if (ata.photos && ata.photos.length > 0) {
    y -= 30
    ;({ y, page } = ensureSpace(ctx, y, 14))
    page.drawText(`Bifogade bilder: ${ata.photos.length} st`, {
      x: leftX, y, size: 9, font: regular, color: COLORS.gray,
    })
  }

  // Signature area
  ;({ y, page } = ensureSpace(ctx, y, 120))
  y -= 50
  drawLine(page, y)
  y -= 25
  page.drawText('Godkännande', { x: leftX, y, size: 10, font: bold, color: COLORS.black })
  y -= 30

  page.drawText('Beställare: ____________________________', {
    x: leftX, y, size: 10, font: regular, color: COLORS.darkGray,
  })
  page.drawText('Datum: ________________', {
    x: rightX, y, size: 10, font: regular, color: COLORS.darkGray,
  })

  y -= 25
  page.drawText('Entreprenör: ____________________________', {
    x: leftX, y, size: 10, font: regular, color: COLORS.darkGray,
  })
  page.drawText('Datum: ________________', {
    x: rightX, y, size: 10, font: regular, color: COLORS.darkGray,
  })

  drawPageFooter(page, regular, tenant.name, tenant.org_number, ctx.pageNumber)

  return doc.save()
}

// ---------------------------------------------------------------------------
// 2. Contract PDF
// ---------------------------------------------------------------------------

export interface ContractData {
  title: string
  quote_number?: string
  customer_name: string
  customer_org_number?: string | null
  project_name?: string
  site_address?: string | null
  scope_description?: string
  total_amount: number
  currency?: string
  valid_until?: string | null
  notes?: string | null
  created_at: string
}

export async function generateContractPdf(
  contract: ContractData,
  tenant: TenantInfo,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const regular = await doc.embedFont(StandardFonts.Helvetica)
  const fonts = { bold, regular }

  let page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  const ctx: PageContext = {
    doc, page, fonts,
    companyName: tenant.name,
    orgNumber: tenant.org_number,
    pageNumber: 1,
  }

  let y = drawHeader(page, fonts, tenant.name, 'Avtal', contract.quote_number)

  const leftX = PAGE_MARGIN
  const rightX = PAGE_MARGIN + CONTENT_WIDTH / 2

  // Parties
  ;({ y, page } = ensureSpace(ctx, y, 20))
  page.drawText('Parter', { x: leftX, y, size: 12, font: bold, color: COLORS.black })
  y -= 20

  ;({ y, page } = ensureSpace(ctx, y, 30))
  y = drawField(page, fonts, leftX, y, 'Entreprenör', tenant.name)
  if (tenant.org_number) {
    ;({ y, page } = ensureSpace(ctx, y, 30))
    y = drawField(page, fonts, leftX, y, 'Org.nr', tenant.org_number)
  }

  y -= 5
  ;({ y, page } = ensureSpace(ctx, y, 30))
  y = drawField(page, fonts, leftX, y, 'Beställare', contract.customer_name)
  if (contract.customer_org_number) {
    ;({ y, page } = ensureSpace(ctx, y, 30))
    y = drawField(page, fonts, leftX, y, 'Org.nr', contract.customer_org_number)
  }

  // Project details
  y -= 10
  ;({ y, page } = ensureSpace(ctx, y, 40))
  drawLine(page, y)
  y -= 20
  page.drawText('Uppdragsbeskrivning', { x: leftX, y, size: 12, font: bold, color: COLORS.black })
  y -= 20

  if (contract.project_name) {
    ;({ y, page } = ensureSpace(ctx, y, 30))
    y = drawField(page, fonts, leftX, y, 'Projekt', contract.project_name)
  }
  if (contract.site_address) {
    ;({ y, page } = ensureSpace(ctx, y, 30))
    y = drawField(page, fonts, leftX, y, 'Arbetsplats', contract.site_address)
  }

  ;({ y, page } = ensureSpace(ctx, y, 30))
  y = drawField(page, fonts, leftX, y, 'Avtalstitel', contract.title)
  ;({ y, page } = ensureSpace(ctx, y, 30))
  y = drawField(page, fonts, leftX, y, 'Datum', formatDate(contract.created_at))

  if (contract.valid_until) {
    ;({ y, page } = ensureSpace(ctx, y, 30))
    y = drawField(page, fonts, leftX, y, 'Giltigt till', formatDate(contract.valid_until))
  }

  // Scope
  if (contract.scope_description) {
    y -= 5
    ;({ y, page } = ensureSpace(ctx, y, 30))
    page.drawText('Omfattning', { x: leftX, y, size: 10, font: bold, color: COLORS.black })
    y -= 16
    const scopeLines = wrapText(contract.scope_description, regular, 10, CONTENT_WIDTH)
    for (const line of scopeLines) {
      ;({ y, page } = ensureSpace(ctx, y, 14))
      page.drawText(line, { x: leftX, y, size: 10, font: regular, color: COLORS.darkGray })
      y -= 14
    }
  }

  // Notes
  if (contract.notes) {
    y -= 10
    ;({ y, page } = ensureSpace(ctx, y, 30))
    page.drawText('Villkor & anmärkningar', { x: leftX, y, size: 10, font: bold, color: COLORS.black })
    y -= 16
    const noteLines = wrapText(contract.notes, regular, 9, CONTENT_WIDTH)
    for (const line of noteLines) {
      ;({ y, page } = ensureSpace(ctx, y, 13))
      page.drawText(line, { x: leftX, y, size: 9, font: regular, color: COLORS.darkGray })
      y -= 13
    }
  }

  // Total
  y -= 10
  ;({ y, page } = ensureSpace(ctx, y, 50))
  drawLine(page, y)
  y -= 20

  page.drawText('Avtalat pris', { x: leftX, y, size: 12, font: bold, color: COLORS.black })
  const totalStr = formatSEK(contract.total_amount)
  page.drawText(totalStr, {
    x: PAGE_WIDTH - PAGE_MARGIN - bold.widthOfTextAtSize(totalStr, 16),
    y,
    size: 16,
    font: bold,
    color: COLORS.primary,
  })
  y -= 14
  page.drawText('(inkl. moms)', {
    x: PAGE_WIDTH - PAGE_MARGIN - regular.widthOfTextAtSize('(inkl. moms)', 8),
    y,
    size: 8,
    font: regular,
    color: COLORS.gray,
  })

  // Signatures
  ;({ y, page } = ensureSpace(ctx, y, 120))
  y -= 40
  drawLine(page, y)
  y -= 25
  page.drawText('Underskrifter', { x: leftX, y, size: 10, font: bold, color: COLORS.black })
  y -= 30

  page.drawText('Entreprenör: ____________________________', {
    x: leftX, y, size: 10, font: regular, color: COLORS.darkGray,
  })
  page.drawText('Datum: ________________', {
    x: rightX, y, size: 10, font: regular, color: COLORS.darkGray,
  })

  y -= 25
  page.drawText('Beställare: ____________________________', {
    x: leftX, y, size: 10, font: regular, color: COLORS.darkGray,
  })
  page.drawText('Datum: ________________', {
    x: rightX, y, size: 10, font: regular, color: COLORS.darkGray,
  })

  drawPageFooter(page, regular, tenant.name, tenant.org_number, ctx.pageNumber)

  return doc.save()
}

// ---------------------------------------------------------------------------
// 3. Invoice PDF
// ---------------------------------------------------------------------------

export interface InvoiceLineItem {
  description: string | null
  quantity: number | null
  unit: string | null
  rate: number | null
  amount: number | null
}

export interface InvoiceData {
  id: string
  invoice_date: string | null
  due_date: string | null
  ocr_number: string | null
  customer_name: string | null
  payment_terms: string | null
  bank_account_iban: string | null
  subtotal: number | null
  vat_rate: number | null
  vat_amount: number | null
  total_including_vat: number | null
  notes_to_customer: string | null
  lines: InvoiceLineItem[]
  // ROT/RUT
  is_rot_rut?: boolean
  labor_total?: number | null
}

export async function generateInvoicePdf(
  invoice: InvoiceData,
  tenant: TenantInfo,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const regular = await doc.embedFont(StandardFonts.Helvetica)
  const fonts = { bold, regular }

  let page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  const ctx: PageContext = {
    doc, page, fonts,
    companyName: tenant.name,
    orgNumber: tenant.org_number,
    pageNumber: 1,
  }

  let y = drawHeader(page, fonts, tenant.name, 'Faktura', invoice.ocr_number ?? invoice.id.slice(0, 8).toUpperCase())

  const leftX = PAGE_MARGIN
  const rightX = PAGE_MARGIN + CONTENT_WIDTH / 2

  // Invoice meta
  ;({ y, page } = ensureSpace(ctx, y, 30))
  y = drawField(page, fonts, leftX, y, 'Kund', invoice.customer_name ?? '-')
  drawField(page, fonts, rightX, y + 30, 'Fakturadatum', formatDate(invoice.invoice_date))

  ;({ y, page } = ensureSpace(ctx, y, 30))
  y = drawField(page, fonts, leftX, y, 'OCR-nummer', invoice.ocr_number ?? '-')
  drawField(page, fonts, rightX, y + 30, 'Förfallodatum', formatDate(invoice.due_date))

  if (invoice.payment_terms) {
    ;({ y, page } = ensureSpace(ctx, y, 30))
    y = drawField(page, fonts, leftX, y, 'Betalningsvillkor', invoice.payment_terms)
  }
  if (invoice.bank_account_iban) {
    ;({ y, page } = ensureSpace(ctx, y, 30))
    y = drawField(page, fonts, leftX, y, 'Bankgiro / IBAN', invoice.bank_account_iban)
  }

  // Line items table
  y -= 10
  ;({ y, page } = ensureSpace(ctx, y, 40))
  drawLine(page, y)
  y -= 15

  // Table header
  const colX = {
    desc: leftX,
    qty: leftX + 240,
    unit: leftX + 295,
    rate: leftX + 345,
    amount: PAGE_WIDTH - PAGE_MARGIN - 10,
  }

  /** Draws the table header row on the current page. */
  function drawTableHeader(p: PDFPage, atY: number) {
    p.drawRectangle({
      x: leftX - 5,
      y: atY - 4,
      width: CONTENT_WIDTH + 10,
      height: 18,
      color: COLORS.tableHeader,
    })
    const headerTexts = [
      { text: 'Beskrivning', x: colX.desc },
      { text: 'Antal', x: colX.qty },
      { text: 'Enhet', x: colX.unit },
      { text: 'À-pris', x: colX.rate },
    ]
    for (const h of headerTexts) {
      p.drawText(h.text, { x: h.x, y: atY, size: 8, font: bold, color: COLORS.darkGray })
    }
    const beloppW = bold.widthOfTextAtSize('Belopp', 8)
    p.drawText('Belopp', { x: colX.amount - beloppW, y: atY, size: 8, font: bold, color: COLORS.darkGray })
  }

  drawTableHeader(page, y)
  y -= 20

  // Rows
  for (const line of invoice.lines) {
    const desc = line.description ?? '-'
    const descLines = wrapText(desc, regular, 9, 230)

    for (let i = 0; i < descLines.length; i++) {
      ;({ y, page } = ensureSpace(ctx, y, 18))
      // If we just moved to a new page, re-draw the table header
      if (y === CONTENT_TOP) {
        drawTableHeader(page, y)
        y -= 20
      }
      page.drawText(descLines[i], { x: colX.desc, y, size: 9, font: regular, color: COLORS.black })
      if (i === 0) {
        // Only show numbers on first line
        if (line.quantity != null) {
          page.drawText(String(line.quantity), { x: colX.qty, y, size: 9, font: regular, color: COLORS.black })
        }
        if (line.unit) {
          page.drawText(line.unit, { x: colX.unit, y, size: 9, font: regular, color: COLORS.black })
        }
        if (line.rate != null) {
          page.drawText(formatSEK(line.rate), { x: colX.rate, y, size: 9, font: regular, color: COLORS.black })
        }
        if (line.amount != null) {
          const amtStr = formatSEK(line.amount)
          const amtW = regular.widthOfTextAtSize(amtStr, 9)
          page.drawText(amtStr, { x: colX.amount - amtW, y, size: 9, font: regular, color: COLORS.black })
        }
      }
      y -= 14
    }

    // Light separator between rows
    page.drawLine({
      start: { x: leftX, y: y + 6 },
      end: { x: PAGE_WIDTH - PAGE_MARGIN, y: y + 6 },
      thickness: 0.3,
      color: COLORS.lightGray,
    })

    y -= 4
  }

  // Totals section
  y -= 10
  const totalsX = PAGE_WIDTH - PAGE_MARGIN - 180

  // Subtotal
  ;({ y, page } = ensureSpace(ctx, y, 16))
  const subtotal = invoice.subtotal ?? 0
  page.drawText('Netto:', { x: totalsX, y, size: 10, font: regular, color: COLORS.darkGray })
  const subStr = formatSEK(subtotal)
  page.drawText(subStr, {
    x: PAGE_WIDTH - PAGE_MARGIN - regular.widthOfTextAtSize(subStr, 10),
    y, size: 10, font: regular, color: COLORS.black,
  })
  y -= 16

  // VAT
  ;({ y, page } = ensureSpace(ctx, y, 18))
  const vatRate = invoice.vat_rate ?? 25
  const vatAmount = invoice.vat_amount ?? 0
  page.drawText(`Moms (${vatRate}%):`, { x: totalsX, y, size: 10, font: regular, color: COLORS.darkGray })
  const vatStr = formatSEK(vatAmount)
  page.drawText(vatStr, {
    x: PAGE_WIDTH - PAGE_MARGIN - regular.widthOfTextAtSize(vatStr, 10),
    y, size: 10, font: regular, color: COLORS.black,
  })
  y -= 18

  // ROT/RUT deduction
  if (invoice.is_rot_rut && invoice.labor_total && invoice.labor_total > 0) {
    ;({ y, page } = ensureSpace(ctx, y, 18))
    const ROT_RATE = 0.3 // 30% ROT deduction on labor
    const ROT_MAX_PER_PERSON = 50000 // Max 50,000 SEK/person/year
    const rotDeduction = Math.min(invoice.labor_total * ROT_RATE, ROT_MAX_PER_PERSON)
    page.drawText('ROT-avdrag (30% arbete):', { x: totalsX, y, size: 10, font: regular, color: COLORS.darkGray })
    const rotStr = `- ${formatSEK(rotDeduction)}`
    page.drawText(rotStr, {
      x: PAGE_WIDTH - PAGE_MARGIN - regular.widthOfTextAtSize(rotStr, 10),
      y, size: 10, font: regular, color: rgb(0.2, 0.6, 0.2),
    })
    y -= 18
  }

  // Total
  ;({ y, page } = ensureSpace(ctx, y, 30))
  drawLine(page, y + 5, 1.5)
  y -= 10
  const totalAmount = invoice.total_including_vat ?? 0
  page.drawText('Att betala:', { x: totalsX, y, size: 13, font: bold, color: COLORS.black })
  const totalStr = formatSEK(totalAmount)
  page.drawText(totalStr, {
    x: PAGE_WIDTH - PAGE_MARGIN - bold.widthOfTextAtSize(totalStr, 14),
    y, size: 14, font: bold, color: COLORS.primary,
  })

  // Customer notes
  if (invoice.notes_to_customer) {
    y -= 35
    ;({ y, page } = ensureSpace(ctx, y, 25))
    page.drawText('Meddelande', { x: leftX, y, size: 9, font: bold, color: COLORS.gray })
    y -= 13
    const noteLines = wrapText(invoice.notes_to_customer, regular, 9, CONTENT_WIDTH)
    for (const line of noteLines) {
      ;({ y, page } = ensureSpace(ctx, y, 12))
      page.drawText(line, { x: leftX, y, size: 9, font: regular, color: COLORS.darkGray })
      y -= 12
    }
  }

  drawPageFooter(page, regular, tenant.name, tenant.org_number, ctx.pageNumber)

  return doc.save()
}
