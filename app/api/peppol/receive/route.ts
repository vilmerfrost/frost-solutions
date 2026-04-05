// app/api/peppol/receive/route.ts
// POST endpoint that receives inbound invoices from peppol.sh webhook
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import crypto from 'crypto';

export const runtime = 'nodejs';

function verifyWebhookSignature(body: string, signature: string | null): boolean {
  const secret = process.env.PEPPOL_WEBHOOK_SECRET;
  if (!secret) {
    // If no secret configured, skip verification
    return true;
  }
  if (!signature) return false;

  const expected = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature, 'utf8'),
    Buffer.from(expected, 'utf8')
  );
}

interface PeppolInvoicePayload {
  invoice_id?: string;
  sender_org_number?: string;
  sender_name?: string;
  recipient_org_number?: string;
  invoice_number?: string;
  invoice_date?: string;
  due_date?: string;
  total_amount?: number;
  currency?: string;
  tax_amount?: number;
  line_items?: Array<{
    description?: string;
    quantity?: number;
    unit_price?: number;
    amount?: number;
  }>;
  raw_xml?: string;
  [key: string]: unknown;
}

export async function POST(req: NextRequest) {
  try {
    const bodyText = await req.text();

    // Validate webhook signature if secret is configured
    const signature = req.headers.get('x-peppol-signature')
      ?? req.headers.get('x-webhook-signature');

    if (!verifyWebhookSignature(bodyText, signature)) {
      console.error('[PEPPOL Receive] Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    let payload: PeppolInvoicePayload;
    try {
      payload = JSON.parse(bodyText);
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Try to match supplier by org number
    let matchedSupplierId: string | null = null;
    let matchedTenantId: string | null = null;

    if (payload.recipient_org_number) {
      // Find which tenant this invoice is addressed to (by their org number on clients/tenants)
      const { data: tenant } = await admin
        .from('tenants')
        .select('id')
        .eq('org_number', payload.recipient_org_number)
        .maybeSingle();

      matchedTenantId = tenant?.id ?? null;
    }

    if (payload.sender_org_number && matchedTenantId) {
      // Find matching supplier within the tenant
      const { data: supplier } = await admin
        .from('suppliers')
        .select('id')
        .eq('tenant_id', matchedTenantId)
        .eq('org_number', payload.sender_org_number)
        .maybeSingle();

      matchedSupplierId = supplier?.id ?? null;
    }

    // Create a supplier_invoices record with status 'received'
    const { data: invoice, error: insertError } = await admin
      .from('supplier_invoices')
      .insert({
        tenant_id: matchedTenantId,
        supplier_id: matchedSupplierId,
        invoice_number: payload.invoice_number ?? null,
        invoice_date: payload.invoice_date ?? null,
        due_date: payload.due_date ?? null,
        total_amount: payload.total_amount ?? null,
        currency: payload.currency ?? 'SEK',
        status: 'received',
        peppol_id: payload.invoice_id ?? null,
        metadata: {
          source: 'peppol',
          sender_org_number: payload.sender_org_number,
          sender_name: payload.sender_name,
          recipient_org_number: payload.recipient_org_number,
          tax_amount: payload.tax_amount,
          line_items: payload.line_items,
        },
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('[PEPPOL Receive] Failed to insert invoice:', insertError);
      return NextResponse.json(
        { error: 'Failed to store invoice' },
        { status: 500 }
      );
    }

    console.log('[PEPPOL Receive] Invoice received:', {
      id: invoice.id,
      peppolId: payload.invoice_id,
      matchedTenantId,
      matchedSupplierId,
    });

    return NextResponse.json({ received: true, id: invoice.id });
  } catch (error) {
    console.error('[PEPPOL Receive] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
