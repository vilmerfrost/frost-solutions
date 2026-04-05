import { NextRequest, NextResponse } from 'next/server';
import { getTenantId } from '@/lib/serverTenant';
import { withPayment } from '@/lib/ai/payment-wrapper';
import { callOpenRouterVision, MODELS } from '@/lib/ai/openrouter';
import { DeliveryNoteOCRResultSchema } from '@/lib/ai/frost-bygg-ai-schemas';
import { extractErrorMessage } from '@/lib/errorUtils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SYSTEM_PROMPT = `Du är en AI-specialist på dokumenttolkning för svenska bygg- och hantverksföretag. Din uppgift är att extrahera strukturerad data från följesedlar (delivery notes).

DOMÄNKUNSKAP:
- Följesedlar från byggleverantörer (Beijer, Dahl, Ahlsell, Solar, Optimera) följer med varuleveranser
- De innehåller artikelnummer, beskrivning, antal, enhet — men SÄLLAN priser (priserna kommer på fakturan)
- Vanliga enheter i bygg: st, m, m², m³, kg, l, förp, rulle, kartong, pall, sats
- Referensnummer kan vara "Ordernr", "Er referens", "Leveransnr", "Följesedelsnr"
- Projektreferens kan stå som "Märkning", "Arbetsorder", "Projekt", "Objekt", "Er beställning"
- Mottagarens namn/adress = leveransadressen (ofta byggarbetsplatsen, inte kontoret)

BILDHANTERING:
- Följesedlar är ofta fotograferade på byggarbetsplatsen — smutsiga, skrynkliga, delvis synliga
- Tabeller med artiklar kan vara långa — extrahera ALLA synliga rader
- Om papper är vikt eller delvis dolt, extrahera det du ser

REGLER:
- Returnera ALLTID giltig JSON
- Om ett fält inte syns, sätt null
- Datum i YYYY-MM-DD
- Om unitPrice/totalPrice inte finns (vanligt på följesedlar), sätt null
- articleNumber: ta det exakta artikelnumret som står, inte beskrivningen
- ocrConfidence: 90+ tydligt, 60-89 hyfsat, under 60 gissning
- extractedAt: ISO 8601-timestamp

JSON-SCHEMA:
{
 "supplierName": "string",
 "supplierPhone": "string | null",
 "supplierEmail": "string | null",
 "deliveryDate": "YYYY-MM-DD",
 "referenceNumber": "string",
 "items": [{"articleNumber": "string", "description": "string", "quantity": number, "unit": "string", "unitPrice": number | null, "totalPrice": number | null}],
 "projectReference": "string | null",
 "deliveryAddress": "string | null",
 "ocrConfidence": number,
 "extractedAt": "ISO 8601",
 "rawOCRText": "all synlig text från följesedeln, rad för rad"
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
      'delivery_note_ocr',
      async () => {
        const raw = await callOpenRouterVision(
          SYSTEM_PROMPT,
          'Läs och extrahera all information från denna följesedel.',
          base64,
          { jsonMode: true, model: MODELS.OCR, mimeType }
        );
        return DeliveryNoteOCRResultSchema.parse(raw);
      },
      {
        description: `OCR-scanning av följesedel: ${file.name}`,
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
    console.error('[AI Delivery Note OCR] Error:', error);
    return NextResponse.json(
      { success: false, error: extractErrorMessage(error) },
      { status: 500 }
    );
  }
}
