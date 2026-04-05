import { FortnoxClient } from '@/lib/integrations/fortnox/client';
import { VismaEAccountingClient } from '@/lib/integrations/visma/eaccounting-client';
import { createAdminClient } from '@/utils/supabase/admin';
import { resolveLWW } from '@/lib/sync/conflict-resolution';
import {
  mapFortnoxInvoiceToFrost, mapFortnoxCustomerToFrost,
  mapVismaInvoiceToFrost, mapVismaCustomerToFrost,
} from './mappers';

async function getIntegrationProvider(integrationId: string): Promise<string> {
  const admin = createAdminClient();
  const { data } = await admin.from('integrations')
    .select('provider').eq('id', integrationId).single();
  return data?.provider || 'fortnox';
}

export async function importCustomers(tenantId: string, integrationId: string) {
  const admin = createAdminClient();
  const provider = await getIntegrationProvider(integrationId);

  let customers: any[] = [];

  if (provider === 'visma_eaccounting') {
    const visma = new VismaEAccountingClient(integrationId);
    const res: any = await visma.listCustomers(new URLSearchParams({ pageSize: '100' }));
    customers = (res?.Data || res || []).map(mapVismaCustomerToFrost);
  } else {
    const fx = new FortnoxClient(integrationId);
    const res: any = await fx.listCustomers(new URLSearchParams({ limit: '100' }));
    customers = (res?.Customers || res?.Data || []).map(mapFortnoxCustomerToFrost);
  }

  for (const mapped of customers) {
    const { data: local } = await admin.from('clients')
      .select('*').eq('tenant_id', tenantId)
      .eq('external_id', mapped.external_id).maybeSingle();

    if (!local) {
      await (admin.from('clients') as any).insert({ tenant_id: tenantId, ...mapped, name: mapped.name || 'Okänd kund' });
    } else {
      const merged = resolveLWW(local, mapped);
      await (admin.from('clients') as any).update(merged).eq('id', local.id);
    }
  }
}

export async function importInvoices(tenantId: string, integrationId: string) {
  const admin = createAdminClient();
  const provider = await getIntegrationProvider(integrationId);

  let invoices: any[] = [];

  if (provider === 'visma_eaccounting') {
    const visma = new VismaEAccountingClient(integrationId);
    const res: any = await visma.listInvoices(new URLSearchParams({ pageSize: '100' }));
    invoices = (res?.Data || res || []).map(mapVismaInvoiceToFrost);
  } else {
    const fx = new FortnoxClient(integrationId);
    const res: any = await fx.listInvoices(new URLSearchParams({ limit: '100' }));
    invoices = (res?.Invoices || res?.Data || []).map(mapFortnoxInvoiceToFrost);
  }

  for (const mapped of invoices) {
    const { data: local } = await admin.from('invoices')
      .select('*').eq('tenant_id', tenantId)
      .eq('external_id', mapped.external_id).maybeSingle();
    if (!local) {
      await (admin.from('invoices') as any).insert({ tenant_id: tenantId, ...mapped });
    } else {
      const merged = resolveLWW(local, mapped);
      await (admin.from('invoices') as any).update(merged).eq('id', local.id);
    }
  }
}
