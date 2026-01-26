// app/api/cron/sync-integrations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { extractErrorMessage } from '@/lib/errorUtils';
import { RetryStrategy } from '@/lib/sync/retry';
import { exportInvoice, exportCustomer } from '@/lib/integrations/sync/export';
import { importCustomers, importInvoices } from '@/lib/integrations/sync/import';

const retry = new RetryStrategy({ initialDelayMs: 1000, maxAttempts: 5 });

async function processJob(job: any) {
 const admin = createAdminClient();
 const { id, tenant_id, integration_id, job_type, payload } = job;

 await admin.from('integration_jobs').update({ status: 'running', started_at: new Date().toISOString() }).eq('id', id);

 try {
  await retry.execute(async () => {
   switch (job_type) {
    case 'export_invoice':
     await exportInvoice(tenant_id, integration_id, payload.invoiceId);
     break;
    case 'export_customer':
     await exportCustomer(tenant_id, integration_id, payload.customerId);
     break;
    case 'import_customers':
     await importCustomers(tenant_id, integration_id);
     break;
    case 'import_invoices':
     await importInvoices(tenant_id, integration_id);
     break;
    case 'webhook_import':
     // Branch per event payload type
     if (payload?.type?.includes('customer')) await importCustomers(tenant_id, integration_id);
     if (payload?.type?.includes('invoice')) await importInvoices(tenant_id, integration_id);
     break;
    default:
     throw new Error(`Okänt job_type: ${job_type}`);
   }
  });

  await admin.from('integration_jobs').update({
   status: 'success',
   finished_at: new Date().toISOString(),
   attempts: job.attempts + 1
  }).eq('id', id);

  await admin.from('sync_logs').insert({
   tenant_id, integration_id, level: 'info', message: `Jobb klart: ${job_type}`, context: payload || {}
  });
 } catch (e: any) {
  const attempts = job.attempts + 1;
  const willRetry = attempts < job.max_attempts;
  await admin.from('integration_jobs').update({
   status: willRetry ? 'retry' : 'failed',
   attempts,
   last_error: extractErrorMessage(e),
   finished_at: new Date().toISOString(),
   scheduled_at: willRetry ? new Date(Date.now() + Math.pow(2, attempts) * 1000).toISOString() : job.scheduled_at
  }).eq('id', id);

  await admin.from('sync_logs').insert({
   tenant_id, integration_id, level: 'error', message: `Jobb misslyckades: ${job_type}`, context: { error: extractErrorMessage(e) }
  });
 }
}

export async function GET(req: NextRequest) {
 try {
  // 🚨 SÄKERHETSKONTROLL: Verifiera cron secret
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient();
  const { data: jobs, error } = await admin
   .from('integration_jobs')
   .select('*')
   .in('status', ['queued','retry'])
   .lte('scheduled_at', new Date().toISOString())
   .order('scheduled_at', { ascending: true })
   .limit(5); // Optimerad från 10 till 5 för att undvika timeout (körs var 5:e min = 60 jobb/timme)

  if (error) return NextResponse.json({ error: extractErrorMessage(error) }, { status: 500 });

  for (const job of jobs || []) {
   // Kör sekventiellt (enkelt). Skala med parallelism + row-level locks vid behov.
   // eslint-disable-next-line no-await-in-loop
   await processJob(job);
  }
  return NextResponse.json({ processed: jobs?.length || 0 });
 } catch (e: any) {
  return NextResponse.json({ error: extractErrorMessage(e) }, { status: 500 });
 }
}

