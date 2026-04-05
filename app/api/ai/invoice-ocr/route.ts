import { NextRequest, NextResponse } from 'next/server';
import { getTenantId } from '@/lib/serverTenant';
import { withPayment } from '@/lib/ai/payment-wrapper';
import { callOpenRouterVision, MODELS } from '@/lib/ai/openrouter';
import { InvoiceOCRResultSchema } from '@/lib/ai/frost-bygg-ai-schemas';
import { extractErrorMessage } from '@/lib/errorUtils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SYSTEM_PROMPT = `Du är en AI-specialist på dokumenttolkning för svenska bygg- och hantverksföretag. Din uppgift är att extrahera strukturerad data från leverantörsfakturor.

DOMÄNKUNSKAP:
- Svenska fakturor har ofta bankgiro/plusgiro, OCR-nummer, och organisationsnummer (XXXXXX-XXXX)
- Vanliga momssatser: 25% (standard), 12% (livsmedel), 6% (kultur/transport), 0% (omvänd skattskyldighet)
- Byggmaterialleverantörer: Beijer, Byggmax, Dahl, Ahlsell, Solar — känns igen på logotyp/rubrik
- "Att betala" / "Summa att betala" = totalAmount. "Netto" / "Exkl moms" = subtotal
- Förfallodatum kan stå som "Förfaller", "Sista betalningsdag", "Due date"
- Fakturanummer kan vara "Fakturanr", "Faktura nr", "Verifikationsnr", "Invoice no"

BILDHANTERING:
- Bilden kan vara fotograferad snett, skrynklig, eller ha dålig belysning
- Läs ALL synlig text, även stämplad, handskriven eller delvis dold
- Om text är svårläst, gör din bästa tolkning och sänk ocrConfidence

REGLER:
- Returnera ALLTID giltig JSON, ingen fritext utanför JSON-objektet
- Om ett fält inte syns eller inte kan tolkas, sätt null
- Datum i YYYY-MM-DD. Tolka svenska datumformat (15/3-2026, 15 mars 2026, 2026-03-15)
- Belopp som numeriska värden utan tusentalsavgränsare. Tolka "1 234,50" som 1234.50
- Inkludera ALLA rader du kan läsa, även om de är delvis synliga
- ocrConfidence: 90-100 = tydlig bild, allt läsbart. 60-89 = hyfsat men osäkert. Under 60 = gissning
- extractedAt: sätt alltid till aktuellt ISO 8601-timestamp

JSON-SCHEMA:
{
 "supplierName": "string",
 "supplierEmail": "string | null",
 "supplierPhone": "string | null",
 "supplierOrgNumber": "string | null",
 "invoiceNumber": "string",
 "invoiceDate": "YYYY-MM-DD",
 "dueDate": "YYYY-MM-DD | null",
 "subtotal": number,
 "vatRate": number,
 "vatAmount": number,
 "totalAmount": number,
 "currency": "SEK",
 "lineItems": [{"description": "string", "quantity": number, "unit": "string", "unitPrice": number, "total": number, "taxRate": number | null}],
 "projectReference": "string | null",
 "projectNumber": "string | null",
 "ocrConfidence": number,
 "extractedAt": "ISO 8601",
 "rawText": "all synlig text i dokumentet, rad för rad"
}`;

function getMimeType(filename?: string): string {
  if (!filename) return 'image/jpeg';
  const ext = filename.split('.').pop()?.toLowerCase();
  const map: Record<string, string> = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
    gif: 'image/gif', webp: 'image/webp', pdf: 'application/pdf',
  };
  return map[ext || ''] || 'image/jpeg';
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Ej inloggad' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'Ingen fil uppladdad' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString('base64');
    const mimeType = getMimeType(file.name);

    const result = await withPayment(
      tenantId,
      'supplier_invoice_ocr',
      async () => {
        const raw = await callOpenRouterVision(
          SYSTEM_PROMPT,
          'Läs och extrahera all information från denna faktura.',
          base64,
          { jsonMode: true, model: MODELS.OCR, mimeType }
        );
        return InvoiceOCRResultSchema.parse(raw);
      },
      {
        description: `OCR-scanning av faktura: ${file.name}`,
        metadata: { filename: file.name, fileSize: buffer.length, mimeType },
      }
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error, balanceAfter: result.balanceAfter },
        { status: result.error?.includes('saldo') ? 402 : 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      transactionId: result.transactionId,
      balanceAfter: result.balanceAfter,
    });
  } catch (error: any) {
    console.error('[AI Invoice OCR] Error:', error);
    return NextResponse.json(
      { success: false, error: extractErrorMessage(error) },
      { status: 500 }
    );
  }
}
