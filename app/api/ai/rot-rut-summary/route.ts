import { NextRequest, NextResponse } from 'next/server';
import { getTenantId } from '@/lib/serverTenant';
import { withPayment } from '@/lib/ai/payment-wrapper';
import { callOpenRouter } from '@/lib/ai/openrouter';
import { ROTRUTSummarySchema } from '@/lib/ai/frost-bygg-ai-schemas';
import { extractErrorMessage } from '@/lib/errorUtils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SYSTEM_PROMPT = `Du är en expert på svenska ROT/RUT-avdrag. Skapa en professionell sammanfattning baserat på projektdata.

VIKTIGT:
- ROT = Renovering, Ombyggnad, Tillbyggnad (30% avdrag)
- RUT = Rengöring, Underhåll, Tvätt (50% avdrag, max 75,000 kr/år)
- Använd svenska terminologi
- Var tydlig med belopp och avdrag

Svara alltid med JSON i detta format:
{
 "summary": "string (2-3 stycken)",
 "totalAmount": number,
 "vatAmount": number,
 "rotAmount": number | null,
 "rutAmount": number | null,
 "customerName": "string",
 "projectDescription": "string",
 "workPeriod": "string",
 "keyPoints": ["string"],
 "generatedAt": "ISO 8601 timestamp"
}`;

export async function POST(req: NextRequest) {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Ej inloggad' }, { status: 401 });
    }

    const body = await req.json();
    const { customerName, projectDescription, workPeriod, totalAmount, vatAmount, rotAmount, rutAmount } = body;

    if (!customerName || !projectDescription || !workPeriod || totalAmount === undefined || vatAmount === undefined) {
      return NextResponse.json(
        { success: false, error: 'Saknade fält: customerName, projectDescription, workPeriod, totalAmount, vatAmount' },
        { status: 400 }
      );
    }

    const userPrompt = `Skapa en ROT/RUT-sammanfattning för:
Kund: ${customerName}
Projektbeskrivning: ${projectDescription}
Arbetsperiod: ${workPeriod}
Totalt belopp: ${totalAmount} SEK
Moms: ${vatAmount} SEK
${rotAmount ? `ROT-belopp: ${rotAmount} SEK` : ''}
${rutAmount ? `RUT-belopp: ${rutAmount} SEK` : ''}`;

    const result = await withPayment(
      tenantId,
      'rot_rut_summary',
      async () => {
        const raw = await callOpenRouter(SYSTEM_PROMPT, userPrompt, { jsonMode: true });
        return ROTRUTSummarySchema.parse(raw);
      },
      {
        description: `ROT/RUT-sammanfattning för ${customerName}`,
        metadata: { customerName, totalAmount },
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
    console.error('[AI ROT/RUT Summary] Error:', error);
    return NextResponse.json(
      { success: false, error: extractErrorMessage(error) },
      { status: 500 }
    );
  }
}
