import { FortnoxClient } from '@/lib/integrations/fortnox/client';
import { VismaEAccountingClient } from '@/lib/integrations/visma/eaccounting-client';
import { createAdminClient } from '@/utils/supabase/admin';
import { extractErrorMessage } from '@/lib/errorUtils';
import {
  mapFrostInvoiceToFortnox, mapFrostClientToFortnox,
  mapFrostInvoiceToVisma, mapFrostClientToVisma,
} from './mappers';

async function getIntegrationProvider(integrationId: string): Promise<string> {
  const admin = createAdminClient();
  const { data } = await admin.from('integrations')
    .select('provider').eq('id', integrationId).single();
  return data?.provider || 'fortnox';
}

export async function exportInvoice(tenantId: string, integrationId: string, invoiceId: string) {
  const admin = createAdminClient();
  const { data: inv, error } = await admin.from('invoices')
    .select('*, client:clients(*), lines:invoice_lines(*)')
    .eq('tenant_id', tenantId).eq('id', invoiceId).single();
  if (error || !inv) throw new Error(extractErrorMessage(error) || 'Faktura saknas.');

  const provider = await getIntegrationProvider(integrationId);
  let res: any;

  if (provider === 'visma_eaccounting') {
    const visma = new VismaEAccountingClient(integrationId);
    const payload = mapFrostInvoiceToVisma(inv);
    res = await visma.createInvoice(payload);
  } else {
    const fx = new FortnoxClient(integrationId);
    const payload = mapFrostInvoiceToFortnox(inv);
    res = await fx.createInvoice(payload);
  }

  const remoteId = provider === 'visma_eaccounting'
    ? String(res?.Id || res?.id)
    : String(res?.Invoice?.DocumentNumber || res?.Invoice?.InvoiceNumber || res?.DocumentNumber || res?.InvoiceNumber || res?.id);

  await admin.from('integration_mappings').upsert({
    tenant_id: tenantId,
    integration_id: integrationId,
    entity_type: 'invoice',
    local_id: invoiceId,
    remote_id: remoteId,
  }, { onConflict: 'tenant_id,integration_id,entity_type,local_id' });

  return res;
}

export async function exportCustomer(tenantId: string, integrationId: string, customerId: string) {
  const admin = createAdminClient();
  const { data: c, error } = await admin.from('clients')
    .select('*').eq('tenant_id', tenantId).eq('id', customerId).single();
  if (error || !c) throw new Error(extractErrorMessage(error) || 'Kund saknas.');

  const provider = await getIntegrationProvider(integrationId);
  let res: any;

  if (provider === 'visma_eaccounting') {
    const visma = new VismaEAccountingClient(integrationId);
    const payload = mapFrostClientToVisma(c);
    res = await visma.createCustomer(payload);
  } else {
    const fx = new FortnoxClient(integrationId);
    const payload = mapFrostClientToFortnox(c);
    res = await fx.createCustomer(payload);
  }

  const remoteId = provider === 'visma_eaccounting'
    ? String(res?.Id || res?.id)
    : String(res?.Customer?.CustomerNumber || res?.CustomerNumber || res?.id);

  await admin.from('integration_mappings').upsert({
    tenant_id: tenantId,
    integration_id: integrationId,
    entity_type: 'customer',
    local_id: customerId,
    remote_id: remoteId,
  }, { onConflict: 'tenant_id,integration_id,entity_type,local_id' });

  return res;
}
