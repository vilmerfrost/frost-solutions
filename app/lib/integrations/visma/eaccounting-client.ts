// app/lib/integrations/visma/eaccounting-client.ts
import Bottleneck from 'bottleneck';
import { getValidToken } from './oauth';
import { extractErrorMessage } from '@/lib/errorUtils';
import { RetryStrategy } from '@/lib/sync/retry';

const limiter = new Bottleneck({ minTime: 200 }); // Rate limiting
const retry = new RetryStrategy({ initialDelayMs: 1000, maxAttempts: 7 });

type VismaOptions = { baseUrl?: string };
export class VismaEAccountingClient {
 private integrationId: string;
 private baseUrl: string;

 constructor(integrationId: string, opts: VismaOptions = {}) {
  this.integrationId = integrationId;
  this.baseUrl = opts.baseUrl || process.env.VISMA_EACCOUNTING_BASE_URL || 'https://eaccountingapi.vismaonline.com/v2';
 }

 private async request<T>(path: string, init: RequestInit): Promise<T> {
  return limiter.schedule(() =>
   retry.execute<T>(async () => {
    const tok = await getValidToken(this.integrationId);
    const res = await fetch(`${this.baseUrl}${path}`, {
     ...init,
     headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tok.access_token}`,
      ...(init.headers || {})
     }
    });
    if (!res.ok) {
     const text = await res.text();
     const err: any = new Error(`Visma eAccounting API ${res.status}: ${text}`);
     err.status = res.status;
     throw err;
    }
    return res.json() as Promise<T>;
   })
  );
 }

 // ---- Customers ----
 createCustomer(payload: any) { return this.request('/customers', { method: 'POST', body: JSON.stringify(payload) }); }
 getCustomer(id: string) { return this.request(`/customers/${encodeURIComponent(id)}`, { method: 'GET' }); }
 updateCustomer(id: string, payload: any) { return this.request(`/customers/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(payload) }); }
 listCustomers(params: URLSearchParams) { return this.request(`/customers?${params.toString()}`, { method: 'GET' }); }

 // ---- Invoices ----
 createInvoice(payload: any) { return this.request('/invoices', { method: 'POST', body: JSON.stringify(payload) }); }
 getInvoice(id: string) { return this.request(`/invoices/${encodeURIComponent(id)}`, { method: 'GET' }); }
 updateInvoice(id: string, payload: any) { return this.request(`/invoices/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(payload) }); }
 listInvoices(params: URLSearchParams) { return this.request(`/invoices?${params.toString()}`, { method: 'GET' }); }
}

