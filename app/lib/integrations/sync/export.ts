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

/** Look up an existing mapping to determine if we should update instead of create. */
async function getExistingRemoteId(
  tenantId: string,
  integrationId: string,
  entityType: string,
  localId: string
): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin.from('integration_mappings')
    .select('remote_id')
    .eq('tenant_id', tenantId)
    .eq('integration_id', integrationId)
    .eq('entity_type', entityType)
    .eq('local_id', localId)
    .single();
  return data?.remote_id ?? null;
}

export async function exportInvoice(tenantId: string, integrationId: string, invoiceId: string) {
  const admin = createAdminClient();
  const { data: inv, error } = await admin.from('invoices')
    .select('*, client:clients(*), lines:invoice_lines(*)')
    .eq('tenant_id', tenantId).eq('id', invoiceId).single();
  if (error || !inv) throw new Error(extractErrorMessage(error) || 'Faktura saknas.');

  const provider = await getIntegrationProvider(integrationId);
  const existingRemoteId = await getExistingRemoteId(tenantId, integrationId, 'invoice', invoiceId);
  let res: any;

  if (provider === 'visma_eaccounting') {
    const visma = new VismaEAccountingClient(integrationId);
    const payload = mapFrostInvoiceToVisma(inv);
    res = existingRemoteId
      ? await visma.updateInvoice(existingRemoteId, payload)
      : await visma.createInvoice(payload);
  } else {
    const fx = new FortnoxClient(integrationId);
    const payload = mapFrostInvoiceToFortnox(inv);
    res = existingRemoteId
      ? await fx.updateInvoice(existingRemoteId, payload)
      : await fx.createInvoice(payload);
  }

  const remoteId = existingRemoteId
    ?? (provider === 'visma_eaccounting'
      ? String(res?.Id ?? res?.id ?? '')
      : String(res?.Invoice?.DocumentNumber ?? res?.Invoice?.InvoiceNumber ?? res?.DocumentNumber ?? res?.InvoiceNumber ?? res?.id ?? ''));

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
  const existingRemoteId = await getExistingRemoteId(tenantId, integrationId, 'customer', customerId);
  let res: any;

  if (provider === 'visma_eaccounting') {
    const visma = new VismaEAccountingClient(integrationId);
    const payload = mapFrostClientToVisma(c);
    res = existingRemoteId
      ? await visma.updateCustomer(existingRemoteId, payload)
      : await visma.createCustomer(payload);
  } else {
    const fx = new FortnoxClient(integrationId);
    const payload = mapFrostClientToFortnox(c);
    res = existingRemoteId
      ? await fx.updateCustomer(existingRemoteId, payload)
      : await fx.createCustomer(payload);
  }

  const remoteId = existingRemoteId
    ?? (provider === 'visma_eaccounting'
      ? String(res?.Id ?? res?.id ?? '')
      : String(res?.Customer?.CustomerNumber ?? res?.CustomerNumber ?? res?.id ?? ''));

  await admin.from('integration_mappings').upsert({
    tenant_id: tenantId,
    integration_id: integrationId,
    entity_type: 'customer',
    local_id: customerId,
    remote_id: remoteId,
  }, { onConflict: 'tenant_id,integration_id,entity_type,local_id' });

  return res;
}
