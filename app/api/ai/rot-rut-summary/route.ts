import { NextRequest, NextResponse } from 'next/server';
import { generateROTRUTSummary } from '@/lib/ai/frost-bygg-ai-integration';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    const result = await generateROTRUTSummary({
      customerName: body.customerName,
      projectDescription: body.projectDescription,
      workPeriod: body.workPeriod,
      totalAmount: body.totalAmount,
      vatAmount: body.vatAmount,
      rotAmount: body.rotAmount,
      rutAmount: body.rutAmount,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('ROT/RUT summary error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

