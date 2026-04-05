import { NextRequest, NextResponse } from 'next/server';
import { getTenantId } from '@/lib/serverTenant';
import { withPayment } from '@/lib/ai/payment-wrapper';
import { callOpenRouter } from '@/lib/ai/openrouter';
import { MonthlyReportSchema } from '@/lib/ai/frost-bygg-ai-schemas';
import { extractErrorMessage } from '@/lib/errorUtils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SYSTEM_PROMPT = `Du är en ekonomiexpert inom svensk byggbransch. Skapa en månadsrapport baserat på projektdata.

VIKTIGT:
- Analysera intäkter, kostnader och vinst
- Identifiera trender och mönster
- Ge konkreta rekommendationer
- Använd svenska terminologi

Svara alltid med JSON i detta format:
{
 "month": "YYYY-MM",
 "summary": "string (3-4 stycken)",
 "totalRevenue": number,
 "totalCosts": number,
 "profit": number,
 "projectsCompleted": number,
 "projectsActive": number,
 "topProjects": [{"projectName": "string", "revenue": number, "profit": number}],
 "keyMetrics": {"averageProjectProfit": number, "employeeUtilization": number, "customerSatisfaction": number | null},
 "recommendations": ["string"],
 "generatedAt": "ISO 8601 timestamp"
}`;

export async function POST(req: NextRequest) {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Ej inloggad' }, { status: 401 });
    }

    const body = await req.json();
    const { month, totalRevenue, totalCosts, projectsCompleted, projectsActive, projectDetails, employeeUtilization, customerSatisfaction } = body;

    if (!month || totalRevenue === undefined || totalCosts === undefined ||
        projectsCompleted === undefined || projectsActive === undefined || !projectDetails) {
      return NextResponse.json(
        { success: false, error: 'Saknade fält: month, totalRevenue, totalCosts, projectsCompleted, projectsActive, projectDetails' },
        { status: 400 }
      );
    }

    const userPrompt = `Skapa en månadsrapport:
Månad: ${month}
Intäkter: ${totalRevenue} SEK
Kostnader: ${totalCosts} SEK
Färdiga projekt: ${projectsCompleted}
Aktiva projekt: ${projectsActive}
Projektdetaljer: ${JSON.stringify(projectDetails)}
${employeeUtilization ? `Utiliseringsgrad: ${employeeUtilization}%` : ''}
${customerSatisfaction ? `Kundnöjdhet: ${customerSatisfaction}%` : ''}`;

    const result = await withPayment(
      tenantId,
      'monthly_report',
      async () => {
        const raw = await callOpenRouter(SYSTEM_PROMPT, userPrompt, { jsonMode: true });
        return MonthlyReportSchema.parse(raw);
      },
      {
        description: `Månadsrapport för ${month}`,
        metadata: { month, totalRevenue, totalCosts },
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
    console.error('[AI Monthly Report] Error:', error);
    return NextResponse.json(
      { success: false, error: extractErrorMessage(error) },
      { status: 500 }
    );
  }
}
