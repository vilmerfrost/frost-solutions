import { NextRequest, NextResponse } from 'next/server';
import { getTenantId } from '@/lib/serverTenant';
import { withPayment } from '@/lib/ai/payment-wrapper';
import { callOpenRouter } from '@/lib/ai/openrouter';
import { ProjectInsightsSchema } from '@/lib/ai/frost-bygg-ai-schemas';
import { extractErrorMessage } from '@/lib/errorUtils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SYSTEM_PROMPT = `Du är en projektledarexpert inom svensk byggbransch. Analysera projektdata och ge insikter.

VIKTIGT:
- Identifiera risker och möjligheter
- Ge konkreta rekommendationer
- Använd svenska terminologi

Svara alltid med JSON i detta format:
{
 "projectName": "string",
 "currentStatus": "string",
 "budgetStatus": {"totalBudget": number, "spent": number, "remaining": number, "percentageUsed": number},
 "timelineStatus": {"startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD | null", "expectedCompletion": "YYYY-MM-DD | null", "isOnTrack": boolean},
 "risks": [{"severity": "low | medium | high", "description": "string", "recommendation": "string"}],
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
    const { projectName, currentStatus, totalBudget, spent, startDate, endDate, expectedCompletion, risks } = body;

    if (!projectName || !currentStatus || totalBudget === undefined || spent === undefined || !startDate) {
      return NextResponse.json(
        { success: false, error: 'Saknade fält: projectName, currentStatus, totalBudget, spent, startDate' },
        { status: 400 }
      );
    }

    const userPrompt = `Analysera följande projektdata:
Projektnamn: ${projectName}
Status: ${currentStatus}
Budget: ${totalBudget} SEK
Spenderat: ${spent} SEK
Startdatum: ${startDate}
${endDate ? `Slutdatum: ${endDate}` : ''}
${expectedCompletion ? `Förväntad slutföring: ${expectedCompletion}` : ''}
${risks?.length ? `Risker: ${JSON.stringify(risks)}` : ''}`;

    const result = await withPayment(
      tenantId,
      'project_insights',
      async () => {
        const raw = await callOpenRouter(SYSTEM_PROMPT, userPrompt, { jsonMode: true });
        return ProjectInsightsSchema.parse(raw);
      },
      {
        description: `Projektinsikter för ${projectName}`,
        metadata: { projectName, totalBudget, spent },
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
    console.error('[AI Project Insights] Error:', error);
    return NextResponse.json(
      { success: false, error: extractErrorMessage(error) },
      { status: 500 }
    );
  }
}
