// app/api/ai/monthly-report/route.ts
// AI-powered monthly report generation with payment
import { NextRequest, NextResponse } from 'next/server';
import { getTenantId } from '@/lib/serverTenant';
import { withPayment } from '@/lib/ai/payment-wrapper';
import { generateMonthlyReport } from '@/lib/ai/frost-bygg-ai-integration';
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
      month, 
      totalRevenue, 
      totalCosts, 
      projectsCompleted,
      projectsActive,
      projectDetails,
      employeeUtilization,
      customerSatisfaction 
    } = body;

    // Validate required fields
    if (!month || totalRevenue === undefined || totalCosts === undefined || 
        projectsCompleted === undefined || projectsActive === undefined || !projectDetails) {
      return NextResponse.json(
        { success: false, error: 'Saknade fält: month, totalRevenue, totalCosts, projectsCompleted, projectsActive, projectDetails' },
        { status: 400 }
      );
    }

    // Process with payment wrapper
    const result = await withPayment(
      tenantId,
      'monthly_report',
      async () => generateMonthlyReport({
        month,
        totalRevenue,
        totalCosts,
        projectsCompleted,
        projectsActive,
        projectDetails,
        employeeUtilization,
        customerSatisfaction,
      }),
      {
        description: `Månadsrapport för ${month}`,
        metadata: {
          month,
          totalRevenue,
          totalCosts,
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
    console.error('[AI Monthly Report] Error:', error);
    return NextResponse.json(
      { success: false, error: extractErrorMessage(error) },
      { status: 500 }
    );
  }
}

