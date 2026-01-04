// app/api/factoring/webhooks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/utils/supabase/admin';
import { extractErrorMessage } from '@/lib/errorUtils';
import { validateWebhookSignature } from '@/lib/factoring/factoring-utils';

export async function POST(req: NextRequest) {
 try {
  const tenantId = req.headers.get('x-tenant-id');
  const signature = req.headers.get('x-signature') ?? '';
  const keyId = req.headers.get('x-key-id') ?? '';

  const payload = await req.json();
  const admin = createAdminClient();

  // Lookup integration by keyId
  const { data: integ } = await admin
   .schema('app')
   .from('factoring_integrations')
   .select('*')
   .eq('api_key_id', keyId)
   .maybeSingle();

  if (!integ) {
   return NextResponse.json({ ok: false }, { status: 401 });
  }

  // Verify HMAC
  const secret = process.env.RESURS_WEBHOOK_SECRET || integ.api_key_enc;
  const bodyText = JSON.stringify(payload);
  
  const validation = validateWebhookSignature(bodyText, signature, secret);
  if (!validation.ok) {
   return NextResponse.json({ ok: false, error: validation.error.message }, { status: 401 });
  }

  // Persist webhook
  await admin.schema('app').from('factoring_webhooks').insert({
   tenant_id: integ.tenant_id,
   provider: 'resurs',
   event_type: payload?.event ?? 'unknown',
   signature,
   payload,
  });

  // Update offer/payment
  if (payload.event === 'offer.updated') {
   await admin
    .schema('app')
    .from('factoring_offers')
    .update({ status: payload.status, response_payload: payload })
    .eq('tenant_id', integ.tenant_id)
    .eq('provider', 'resurs')
    .eq('id', payload.offerId);
  }

  if (payload.event === 'payout.created') {
   await admin.schema('app').from('factoring_payments').insert({
    tenant_id: integ.tenant_id,
    provider: 'resurs',
    offer_id: payload.offerId,
    payout_amount: payload.amount,
    payout_date: payload.date,
    reference: payload.reference,
    raw: payload,
   });
  }

  return NextResponse.json({ ok: true });
 } catch (e: any) {
  return NextResponse.json(
   { ok: false, error: extractErrorMessage(e) },
   { status: 500 }
  );
 }
}

