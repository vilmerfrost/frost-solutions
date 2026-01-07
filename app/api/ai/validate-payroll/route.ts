// app/api/ai/validate-payroll/route.ts
// AI-powered payroll validation with payment
import { NextRequest, NextResponse } from 'next/server';
import { getTenantId } from '@/lib/serverTenant';
import { withPayment } from '@/lib/ai/payment-wrapper';
import { validatePayroll } from '@/lib/ai/frost-bygg-ai-integration';
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
      employeeName, 
      hours, 
      hourlyRate, 
      obKvall,
      obNatt,
      obHelg,
      taxRate 
    } = body;

    // Validate required fields
    if (!employeeName || hours === undefined || hourlyRate === undefined) {
      return NextResponse.json(
        { success: false, error: 'Saknade fält: employeeName, hours, hourlyRate' },
        { status: 400 }
      );
    }

    // Process with payment wrapper
    const result = await withPayment(
      tenantId,
      'payroll_validation',
      async () => validatePayroll({
        employeeName,
        hours,
        hourlyRate,
        obKvall,
        obNatt,
        obHelg,
        taxRate,
      }),
      {
        description: `Lönevalidering för ${employeeName}`,
        metadata: {
          employeeName,
          hours,
          hourlyRate,
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
    console.error('[AI Payroll Validation] Error:', error);
    return NextResponse.json(
      { success: false, error: extractErrorMessage(error) },
      { status: 500 }
    );
  }
}

