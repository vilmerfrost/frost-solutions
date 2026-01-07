// app/api/ai/rot-rut-summary/route.ts
// AI-powered ROT/RUT summary generation with payment
import { NextRequest, NextResponse } from 'next/server';
import { getTenantId } from '@/lib/serverTenant';
import { withPayment } from '@/lib/ai/payment-wrapper';
import { generateROTRUTSummary } from '@/lib/ai/frost-bygg-ai-integration';
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
      customerName, 
      projectDescription, 
      workPeriod, 
      totalAmount, 
      vatAmount,
      rotAmount,
      rutAmount 
    } = body;

    // Validate required fields
    if (!customerName || !projectDescription || !workPeriod || totalAmount === undefined || vatAmount === undefined) {
      return NextResponse.json(
        { success: false, error: 'Saknade fält: customerName, projectDescription, workPeriod, totalAmount, vatAmount' },
        { status: 400 }
      );
    }

    // Process with payment wrapper
    const result = await withPayment(
      tenantId,
      'rot_rut_summary',
      async () => generateROTRUTSummary({
        customerName,
        projectDescription,
        workPeriod,
        totalAmount,
        vatAmount,
        rotAmount,
        rutAmount,
      }),
      {
        description: `ROT/RUT-sammanfattning för ${customerName}`,
        metadata: {
          customerName,
          totalAmount,
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
    console.error('[AI ROT/RUT Summary] Error:', error);
    return NextResponse.json(
      { success: false, error: extractErrorMessage(error) },
      { status: 500 }
    );
  }
}
