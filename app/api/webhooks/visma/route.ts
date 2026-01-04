// app/api/webhooks/visma/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/utils/supabase/admin';
import { decryptJSON } from '@/lib/encryption';
import { extractErrorMessage } from '@/lib/errorUtils';

function verifySignature(rawBody: Buffer, signature: string, secret: string) {
 const hmac = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
 return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(signature));
}

export async function POST(req: NextRequest) {
 try {
  const raw = Buffer.from(await req.arrayBuffer());
  const sig = req.headers.get('x-visma-signature') || '';
  const integrationId = req.headers.get('x-integration-id') || '';

  const admin = createAdminClient();
  const { data: integ } = await admin.from('integrations').select('webhook_secret_encrypted, tenant_id').eq('id', integrationId).single();
  if (!integ) return NextResponse.json({ error: 'Integration hittades inte.' }, { status: 404 });

  const secret = integ?.webhook_secret_encrypted
   ? decryptJSON<{ v: string }>(integ.webhook_secret_encrypted).v
   : '';

  if (!secret || !sig || !verifySignature(raw, sig, secret)) {
   return NextResponse.json({ error: 'Ogiltig signatur.' }, { status: 401 });
  }

  const event = JSON.parse(raw.toString('utf8'));
  // Lägg jobb i kö (import av t.ex. invoice/customer)
  await admin.from('integration_jobs').insert({
   tenant_id: integ.tenant_id,
   integration_id: integrationId,
   job_type: 'webhook_import',
   payload: event,
   status: 'queued'
  });

  return NextResponse.json({ ok: true });
 } catch (e: any) {
  console.error('Webhook error:', e);
  return NextResponse.json({ error: extractErrorMessage(e) }, { status: 500 });
 }
}

