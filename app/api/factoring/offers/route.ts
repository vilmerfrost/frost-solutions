// app/api/factoring/offers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/utils/supabase/admin';
import { getTenantId } from '@/lib/serverTenant';
import { extractErrorMessage } from '@/lib/errorUtils';
import { resursRequest } from '@/lib/factoring/resursClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const OfferInput = z.object({
  invoiceId: z.string().uuid(),
  idempotencyKey: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) {
      return NextResponse.json({ error: 'Ingen tenant.' }, { status: 401 });
    }

    const body = await req.json();
    const { invoiceId, idempotencyKey } = OfferInput.parse(body);

    const admin = createAdminClient();

    // Hämta integration + decrypt secret
    const { data: integ, error: iErr } = await admin
      .schema('app')
      .from('factoring_integrations')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('provider', 'resurs')
      .maybeSingle();

    if (iErr || !integ || !integ.is_active) {
      throw new Error('Ingen aktiv Resurs-integration');
    }

    // TODO: Implement decryptSecretForTenant function
    // For now, use placeholder
    const secret = process.env.RESURS_API_SECRET || integ.api_key_enc;
    const cfg = {
      baseUrl: process.env.RESURS_BASE_URL || 'https://merchant.api.resurs.com/v2',
      merchantId: integ.merchant_id,
      keyId: integ.api_key_id,
      keySecret: secret,
    };

    // Bygg payload från er invoices-tabell
    const { data: inv } = await admin
      .from('invoices')
      .select('id, amount, customer_id, issue_date, number')
      .eq('id', invoiceId)
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (!inv) {
      throw new Error('Faktura saknas');
    }

    const payload = {
      amount: inv.amount,
      currency: 'SEK',
      invoiceNumber: inv.number,
      issueDate: inv.issue_date,
    };

    const res = await resursRequest<any>(cfg, '/offers', 'POST', payload, idempotencyKey);

    // Spara offer
    const { data: offer, error: oErr } = await admin
      .schema('app')
      .from('factoring_offers')
      .insert({
        tenant_id: tenantId,
        invoice_id: inv.id,
        provider: 'resurs',
        request_payload: payload,
        response_payload: res,
        status: res?.status ?? 'pending',
        offer_amount: res?.offerAmount,
        fees: res?.fees,
        expires_at: res?.expiresAt,
      })
      .select()
      .single();

    if (oErr) {
      throw oErr;
    }

    return NextResponse.json({ success: true, data: offer });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: extractErrorMessage(e) },
      { status: 500 }
    );
  }
}

