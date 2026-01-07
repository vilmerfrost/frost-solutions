// app/api/ai/project-insights/route.ts
// AI-powered project insights generation with payment
import { NextRequest, NextResponse } from 'next/server';
import { getTenantId } from '@/lib/serverTenant';
import { withPayment } from '@/lib/ai/payment-wrapper';
import { generateProjectInsights } from '@/lib/ai/frost-bygg-ai-integration';
import { extractErrorMessage } from '@/lib/errorUtils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Ej inloggad' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { 
      projectName, 
      currentStatus, 
      totalBudget, 
      spent, 
      startDate,
      endDate,
      expectedCompletion,
      risks 
    } = body;

    // Validate required fields
    if (!projectName || !currentStatus || totalBudget === undefined || spent === undefined || !startDate) {
      return NextResponse.json(
        { success: false, error: 'Saknade fält: projectName, currentStatus, totalBudget, spent, startDate' },
        { status: 400 }
      );
    }

    // Process with payment wrapper
    const result = await withPayment(
      tenantId,
      'project_insights',
      async () => generateProjectInsights({
        projectName,
        currentStatus,
        totalBudget,
        spent,
        startDate,
        endDate,
        expectedCompletion,
        risks,
      }),
      {
        description: `Projektinsikter för ${projectName}`,
        metadata: {
          projectName,
          totalBudget,
          spent,
        },
      }
    );

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error,
          balanceAfter: result.balanceAfter,
        },
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

