import { NextRequest, NextResponse } from 'next/server';
import { getTenantId } from '@/lib/serverTenant';
import { withPayment } from '@/lib/ai/payment-wrapper';
import { callOpenRouterVision, MODELS } from '@/lib/ai/openrouter';
import { ReceiptOCRResultSchema } from '@/lib/ai/frost-bygg-ai-schemas';
import { extractErrorMessage } from '@/lib/errorUtils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SYSTEM_PROMPT = `Du är en AI-specialist på dokumenttolkning för svenska bygg- och hantverksföretag. Din uppgift är att extrahera strukturerad data från kvitton och kassakvitton.

DOMÄNKUNSKAP:
- Bygghandelskvitton (Byggmax, Beijer, Bauhaus, K-Rauta) har ofta artikelnummer och hyllreferenser — extrahera beskrivningen, inte koden
- Bensinstationer (Circle K, OKQ8, Preem) — extrahera literpris och volym om synligt
- Vanliga enheter på kvitton: st, kg, m, l, förp
- Momssatser: 25% (de flesta varor), 12% (mat/dryck), 6% (tidningar)
- "TOTALT", "ATT BETALA", "SUMMA" = totalAmount
- Betalmetod: "KORT", "KONTANT", "SWISH", "KREDIT" — läs från botten av kvittot

BILDHANTERING:
- Kvitton är ofta skrynkliga, bleka (termoskrivare), eller fotograferade i dåligt ljus
- Långa kvitton kan vara avklippta — extrahera det du ser
- Om text bleknat, gör bästa tolkning och sänk ocrConfidence

REGLER:
- Returnera ALLTID giltig JSON
- Om ett fält inte syns, sätt null
- Datum i YYYY-MM-DD. Tolka "26-03-15", "15/3 2026", "15 MAR 2026"
- Belopp som nummer. "1 234,50" → 1234.50
- ocrConfidence: 90+ tydligt, 60-89 hyfsat, under 60 gissning
- extractedAt: ISO 8601-timestamp

JSON-SCHEMA:
{
 "merchantName": "string",
 "receiptDate": "YYYY-MM-DD",
 "receiptNumber": "string | null",
 "totalAmount": number,
 "currency": "SEK",
 "items": [{"description": "string", "quantity": number | null, "unitPrice": number | null, "total": number}],
 "vatAmount": number | null,
 "paymentMethod": "string | null",
 "ocrConfidence": number,
 "extractedAt": "ISO 8601",
 "rawText": "all synlig text från kvittot, rad för rad"
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
      'receipt_ocr',
      async () => {
        const raw = await callOpenRouterVision(
          SYSTEM_PROMPT,
          'Läs och extrahera all information från detta kvitto.',
          base64,
          { jsonMode: true, model: MODELS.OCR, mimeType }
        );
        return ReceiptOCRResultSchema.parse(raw);
      },
      {
        description: `OCR-scanning av kvitto: ${file.name}`,
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
    console.error('[AI Receipt OCR] Error:', error);
    return NextResponse.json(
      { success: false, error: extractErrorMessage(error) },
      { status: 500 }
    );
  }
}
