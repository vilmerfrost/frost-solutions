// app/lib/integrations/sync/import.ts
import { FortnoxClient } from '@/lib/integrations/fortnox/client';
import { createAdminClient } from '@/utils/supabase/admin';
import { extractErrorMessage } from '@/lib/errorUtils';
import { resolveLWW } from '@/lib/sync/conflict-resolution';
import { mapFortnoxInvoiceToFrost, mapFortnoxCustomerToFrost } from './mappers';

export async function importCustomers(tenantId: string, integrationId: string) {
 const admin = createAdminClient();
 const fx = new FortnoxClient(integrationId);
 const res = await fx.listCustomers(new URLSearchParams({ limit: '100' })); // just example

 for (const apiC of res?.Customers || res?.Data || []) {
  const mapped = mapFortnoxCustomerToFrost(apiC);
  // Hämta ev lokal
  const { data: local } = await admin.from('clients')
   .select('*').eq('tenant_id', tenantId)
   .eq('external_id', mapped.external_id).maybeSingle();

  if (!local) {
   await admin.from('clients').insert({ tenant_id: tenantId, ...mapped, name: mapped.name || 'Okänd kund' });
  } else {
   const merged = resolveLWW(local, mapped);
   await admin.from('clients').update(merged).eq('id', local.id);
  }
 }
}

export async function importInvoices(tenantId: string, integrationId: string) {
 const admin = createAdminClient();
 const fx = new FortnoxClient(integrationId);
 const res = await fx.listInvoices(new URLSearchParams({ limit: '100' }));

 for (const apiInv of res?.Invoices || res?.Data || []) {
  const mapped = mapFortnoxInvoiceToFrost(apiInv);
  const { data: local } = await admin.from('invoices')
   .select('*').eq('tenant_id', tenantId)
   .eq('external_id', mapped.external_id).maybeSingle();
  if (!local) {
   await admin.from('invoices').insert({ tenant_id: tenantId, ...mapped });
  } else {
   const merged = resolveLWW(local, mapped);
   await admin.from('invoices').update(merged).eq('id', local.id);
  }
 }
}

