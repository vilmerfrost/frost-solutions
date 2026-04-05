import { NextRequest, NextResponse } from 'next/server';
import { getTenantId } from '@/lib/serverTenant';
import { withPayment } from '@/lib/ai/payment-wrapper';
import { callOpenRouter } from '@/lib/ai/openrouter';
import { PayrollValidationResultSchema } from '@/lib/ai/frost-bygg-ai-schemas';
import { extractErrorMessage } from '@/lib/errorUtils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SYSTEM_PROMPT = `Du är en expert på svenska löneberäkningar enligt 2025-regler. Validera lönedata.

Regler:
- OB Kväll: +50% (efter 18:00)
- OB Natt: +100% (efter 22:00)
- OB Helg: +50% (lördag/söndag)
- Skatt: 30% standard (kan variera)
- Arbetsgivaravgift: 31.42%
- Kontrollera att alla tider och OB-beräkningar är korrekta

Svara alltid med JSON i detta format:
{
 "isValid": boolean,
 "errors": [{"field": "string", "message": "string", "severity": "error | warning | info"}],
 "warnings": ["string"],
 "obCalculations": {"kvall": number, "natt": number, "helg": number, "totalOB": number} | null,
 "taxCalculations": {"grossSalary": number, "taxRate": number, "taxAmount": number, "netSalary": number} | null,
 "validatedAt": "ISO 8601 timestamp"
}`;

export async function POST(req: NextRequest) {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Ej inloggad' }, { status: 401 });
    }

    const body = await req.json();
    const { employeeName, hours, hourlyRate, obKvall, obNatt, obHelg, taxRate } = body;

    if (!employeeName || hours === undefined || hourlyRate === undefined) {
      return NextResponse.json(
        { success: false, error: 'Saknade fält: employeeName, hours, hourlyRate' },
        { status: 400 }
      );
    }

    const userPrompt = `Validera följande lönedata:
Anställd: ${employeeName}
Timmar: ${hours}
Timlön: ${hourlyRate} SEK
OB Kväll: ${obKvall || 0} timmar
OB Natt: ${obNatt || 0} timmar
OB Helg: ${obHelg || 0} timmar
Skattesats: ${taxRate || 30}%`;

    const result = await withPayment(
      tenantId,
      'payroll_validation',
      async () => {
        const raw = await callOpenRouter(SYSTEM_PROMPT, userPrompt, { jsonMode: true });
        return PayrollValidationResultSchema.parse(raw);
      },
      {
        description: `Lönevalidering för ${employeeName}`,
        metadata: { employeeName, hours, hourlyRate },
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
    console.error('[AI Payroll Validation] Error:', error);
    return NextResponse.json(
      { success: false, error: extractErrorMessage(error) },
      { status: 500 }
    );
  }
}
