// app/lib/integrations/sync/export.ts
import { FortnoxClient } from '@/lib/integrations/fortnox/client';
import { createAdminClient } from '@/utils/supabase/admin';
import { extractErrorMessage } from '@/lib/errorUtils';
import { mapFrostInvoiceToFortnox, mapFrostClientToFortnox } from './mappers';

export async function exportInvoice(tenantId: string, integrationId: string, invoiceId: string) {
 const admin = createAdminClient();
 const { data: inv, error } = await admin.from('invoices')
  .select('*, client:clients(*), lines:invoice_lines(*)')
  .eq('tenant_id', tenantId).eq('id', invoiceId).single();
 if (error || !inv) throw new Error(extractErrorMessage(error) || 'Faktura saknas.');

 const fx = new FortnoxClient(integrationId);
 const payload = mapFrostInvoiceToFortnox(inv);
 const res: any = await fx.createInvoice(payload);

 // spara mapping
 await admin.from('integration_mappings').upsert({
  tenant_id: tenantId,
  integration_id: integrationId,
  entity_type: 'invoice',
  local_id: invoiceId,
  remote_id: String(res?.Invoice?.DocumentNumber || res?.Invoice?.InvoiceNumber || res?.DocumentNumber || res?.InvoiceNumber || res?.id)
 }, { onConflict: 'tenant_id,integration_id,entity_type,local_id' });

 return res;
}

export async function exportCustomer(tenantId: string, integrationId: string, customerId: string) {
 const admin = createAdminClient();
 const { data: c, error } = await admin.from('clients')
  .select('*').eq('tenant_id', tenantId).eq('id', customerId).single();
 if (error || !c) throw new Error(extractErrorMessage(error) || 'Kund saknas.');

 const fx = new FortnoxClient(integrationId);
 const payload = mapFrostClientToFortnox(c);
 const res: any = await fx.createCustomer(payload);

 await admin.from('integration_mappings').upsert({
  tenant_id: tenantId,
  integration_id: integrationId,
  entity_type: 'customer',
  local_id: customerId,
  remote_id: String(res?.Customer?.CustomerNumber || res?.CustomerNumber || res?.id)
 }, { onConflict: 'tenant_id,integration_id,entity_type,local_id' });

 return res;
}

