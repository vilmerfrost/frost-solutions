import { NextRequest, NextResponse } from 'next/server';
import { processDeliveryNoteOCR } from '@/lib/ai/frost-bygg-ai-integration';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
 try {
  const formData = await req.formData();
  const file = formData.get('file') as File;
  
  if (!file) {
   return NextResponse.json(
    { success: false, error: 'No file provided' },
    { status: 400 }
   );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await processDeliveryNoteOCR(buffer, file.name);

  return NextResponse.json({
   success: true,
   data: result,
  });
 } catch (error) {
  console.error('Delivery note OCR error:', error);
  return NextResponse.json(
   {
    success: false,
    error: error instanceof Error ? error.message : 'Unknown error',
   },
   { status: 500 }
  );
 }
}

