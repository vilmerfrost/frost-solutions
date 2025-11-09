import { NextRequest, NextResponse } from 'next/server';
import { periodListQuery, periodCreateBody } from '../_schemas';
import { listPeriods, createPeriod } from '@/lib/payroll/periods';
import { extractErrorMessage } from '@/lib/errorUtils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('[GET /api/payroll/periods] 🚀 STARTING');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    const parse = periodListQuery.safeParse(
      Object.fromEntries(new URL(req.url).searchParams.entries())
    );
    
    if (!parse.success) {
      console.error('[GET /api/payroll/periods] ❌ Validation failed:', parse.error.message);
      return NextResponse.json(
        { success: false, error: parse.error.message }, 
        { status: 400 }
      );
    }

    console.log('[GET /api/payroll/periods] 📋 Filters:', parse.data);
    const data = await listPeriods(parse.data);
    console.log('[GET /api/payroll/periods] ✅ Success:', { count: data.length });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return NextResponse.json({ success: true, data });
  } catch (e: any) {
    console.error('[GET /api/payroll/periods] ❌ FATAL ERROR:', {
      message: e.message,
      stack: e.stack,
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return NextResponse.json(
      { success: false, error: extractErrorMessage(e) }, 
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('[POST /api/payroll/periods] 🚀 STARTING');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    let body;
    try {
      body = await req.json();
      console.log('[POST /api/payroll/periods] 📝 Request body:', JSON.stringify(body, null, 2));
    } catch (parseError: any) {
      console.error('[POST /api/payroll/periods] ❌ Failed to parse JSON:', parseError.message);
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const parse = periodCreateBody.safeParse(body);
    
    if (!parse.success) {
      console.error('[POST /api/payroll/periods] ❌ Validation failed:', {
        errors: parse.error.errors,
        message: parse.error.message,
      });
      return NextResponse.json(
        { 
          success: false, 
          error: parse.error.message,
          details: parse.error.errors,
        }, 
        { status: 400 }
      );
    }

    console.log('[POST /api/payroll/periods] ✅ Validation passed, creating period...');
    const data = await createPeriod(parse.data);
    console.log('[POST /api/payroll/periods] ✅ Period created successfully:', {
      periodId: data.id,
      status: data.status,
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (e: any) {
    console.error('[POST /api/payroll/periods] ❌ FATAL ERROR:', {
      message: e.message,
      stack: e.stack,
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return NextResponse.json(
      { 
        success: false, 
        error: extractErrorMessage(e),
        details: e.message,
      }, 
      { status: 500 }
    );
  }
}

