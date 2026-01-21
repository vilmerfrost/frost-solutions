// app/api/payroll/periods/route.ts
// ✅ FIXED: Added overlap detection and better error handling
import { NextRequest, NextResponse } from 'next/server';
import { periodListQuery, periodCreateBody } from '../_schemas';
import { listPeriods, createPeriod } from '@/lib/payroll/periods';
import { extractErrorMessage } from '@/lib/errorUtils';
import { createAdminClient } from '@/utils/supabase/admin';
import { getTenantId } from '@/lib/serverTenant';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Check for overlapping payroll periods
 */
async function checkPeriodOverlap(
 tenantId: string,
 startDate: string,
 endDate: string,
 excludePeriodId?: string
): Promise<{ overlaps: boolean; overlappingPeriod?: any }> {
 const admin = createAdminClient();
 
 // Check for any periods that overlap with the new period
 // Overlap occurs if:
 // 1. New period starts before existing ends AND new period ends after existing starts
 // 2. Or if periods are exactly adjacent (we allow this)
 
 let query = admin
  .from('payroll_periods')
  .select('id, start_date, end_date, status')
  .eq('tenant_id', tenantId)
  .lte('start_date', endDate) // Existing period starts before or on new period end
  .gte('end_date', startDate); // Existing period ends after or on new period start
 
 if (excludePeriodId) {
  query = query.neq('id', excludePeriodId);
 }
 
 const { data: overlapping, error } = await query;
 
 if (error) {
  console.error('[checkPeriodOverlap] Database error:', error);
  throw error;
 }
 
 // Filter out exact adjacencies (periods that end exactly when new starts, or vice versa)
 const actualOverlaps = (overlapping || []).filter((period: any) => {
  const periodStart = new Date(period.start_date);
  const periodEnd = new Date(period.end_date);
  const newStart = new Date(startDate);
  const newEnd = new Date(endDate);
  
  // Check if periods actually overlap (not just adjacent)
  return (
   (newStart < periodEnd && newEnd > periodStart) &&
   !(newStart.getTime() === periodEnd.getTime() || newEnd.getTime() === periodStart.getTime())
  );
 });
 
 return {
  overlaps: actualOverlaps.length > 0,
  overlappingPeriod: actualOverlaps[0] || null,
 };
}

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
    errors: parse.error.issues,
    message: parse.error.message,
   });
   return NextResponse.json(
    { 
     success: false, 
     error: parse.error.message,
     details: parse.error.issues,
    }, 
    { status: 400 }
   );
  }

  const { startDate, endDate, format } = parse.data;

  // Validate date range
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (start > end) {
   return NextResponse.json(
    { 
     success: false, 
     error: 'Startdatum måste vara före eller samma som slutdatum',
    }, 
    { status: 400 }
   );
  }

  // Check for overlap with existing periods
  const tenantId = await getTenantId();
  if (!tenantId) {
   return NextResponse.json(
    { success: false, error: 'Unauthorized' },
    { status: 401 }
   );
  }

  console.log('[POST /api/payroll/periods] 🔍 Checking for overlapping periods...');
  const overlapCheck = await checkPeriodOverlap(tenantId, startDate, endDate);
  
  if (overlapCheck.overlaps) {
   const overlapping = overlapCheck.overlappingPeriod;
   const overlapStart = new Date(overlapping.start_date).toLocaleDateString('sv-SE');
   const overlapEnd = new Date(overlapping.end_date).toLocaleDateString('sv-SE');
   
   console.error('[POST /api/payroll/periods] ❌ Period overlap detected:', {
    existingPeriod: { start: overlapping.start_date, end: overlapping.end_date },
    newPeriod: { start: startDate, end: endDate },
   });
   
   return NextResponse.json(
    { 
     success: false, 
     error: `Perioden överlappar med en befintlig period (${overlapStart} - ${overlapEnd})`,
     details: {
      overlappingPeriod: {
       id: overlapping.id,
       startDate: overlapping.start_date,
       endDate: overlapping.end_date,
       status: overlapping.status,
      },
     },
    }, 
    { status: 409 } // Conflict
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

