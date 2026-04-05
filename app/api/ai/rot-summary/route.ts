import { NextRequest, NextResponse } from 'next/server';
import { callOpenRouter } from '@/lib/ai/openrouter';
import { ROTRUTSummarySchema } from '@/lib/ai/frost-bygg-ai-schemas';
import { resolveAuth } from '@/lib/api/auth';

export const runtime = 'nodejs';

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
    const auth = await resolveAuth();
    if (auth.error) return auth.error;

    const body = await req.json();

    if (!body.customerName || !body.projectDescription || !body.workPeriod) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: customerName, projectDescription, workPeriod' },
        { status: 400 }
      );
    }

    const userPrompt = `Skapa en ROT/RUT-sammanfattning för:
Kund: ${body.customerName}
Projektbeskrivning: ${body.projectDescription}
Arbetsperiod: ${body.workPeriod}
Totalt belopp: ${body.totalAmount || 0} SEK
Moms: ${body.vatAmount || 0} SEK
${body.rotAmount ? `ROT-belopp: ${body.rotAmount} SEK` : ''}
${body.rutAmount ? `RUT-belopp: ${body.rutAmount} SEK` : ''}`;

    const raw = await callOpenRouter(SYSTEM_PROMPT, userPrompt, { jsonMode: true });
    const result = ROTRUTSummarySchema.parse(raw);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('[ROT Summary API] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
