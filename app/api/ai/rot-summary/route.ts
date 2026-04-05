// app/api/ai/rot-summary/route.ts
// ✅ AI-powered ROT summary generation
import { NextRequest, NextResponse } from 'next/server';
import { generateROTRUTSummary } from '@/lib/ai/frost-bygg-ai-integration';
import { resolveAuth } from '@/lib/api/auth';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
 try {
  const auth = await resolveAuth();
  if (auth.error) return auth.error;

  const body = await req.json();
  
  // Validate required fields
  if (!body.customerName || !body.projectDescription || !body.workPeriod) {
   return NextResponse.json(
    { success: false, error: 'Missing required fields: customerName, projectDescription, workPeriod' },
    { status: 400 }
   );
  }

  const result = await generateROTRUTSummary({
   customerName: body.customerName,
   projectDescription: body.projectDescription,
   workPeriod: body.workPeriod,
   totalAmount: body.totalAmount || 0,
   vatAmount: body.vatAmount || 0,
   rotAmount: body.rotAmount,
   rutAmount: body.rutAmount,
  });

  return NextResponse.json({
   success: true,
   data: result,
  });
 } catch (error) {
  console.error('[ROT Summary API] Error:', error);
  return NextResponse.json(
   {
    success: false,
    error: error instanceof Error ? error.message : 'Unknown error',
    details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
   },
   { status: 500 }
  );
 }
}

