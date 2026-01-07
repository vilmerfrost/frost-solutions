// app/api/ai/receipt-ocr/route.ts
// Gemini-powered receipt OCR scanning with payment
import { NextRequest, NextResponse } from 'next/server';
import { getTenantId } from '@/lib/serverTenant';
import { withPayment } from '@/lib/ai/payment-wrapper';
import { processReceiptOCR } from '@/lib/ai/frost-bygg-ai-integration';
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

    // Parse form data with file
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Ingen fil uppladdad' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = file.name;

    // Process with payment wrapper
    const result = await withPayment(
      tenantId,
      'receipt_ocr',
      async () => processReceiptOCR(buffer, filename),
      {
        description: `OCR-scanning av kvitto: ${filename}`,
        metadata: {
          filename,
          fileSize: buffer.length,
          mimeType: file.type,
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
    console.error('[AI Receipt OCR] Error:', error);
    return NextResponse.json(
      { success: false, error: extractErrorMessage(error) },
      { status: 500 }
    );
  }
}

