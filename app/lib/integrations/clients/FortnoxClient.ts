// app/lib/integrations/clients/FortnoxClient.ts

import { APIError, APIErrorHandler } from '../common/errors';
import { retryWithBackoff } from '../common/retry';
import { RateLimiter } from '../common/rateLimiter';
import { TokenManager } from '../tokenManager';
import type { FortnoxCustomer, FortnoxInvoice } from '../mappers';

type FortnoxConfig = {
 tenantId: string;
 baseUrl?: string;       // default 'https://api.fortnox.se/3'
 logger?: (e: unknown, ctx: Record<string, any>) => void;
};

type FortnoxListParams = { page?: number; limit?: number };

type APIResult<T> = { data: T; raw: Response };

function toQuery(params?: Record<string, string | number | undefined>) {
 const q = new URLSearchParams();
 Object.entries(params || {}).forEach(([k, v]) => {
  if (v !== undefined && v !== null) q.set(k, String(v));
 });
 const s = q.toString();
 return s ? `?${s}` : '';
}

export class FortnoxAPIClient {
 #cfg: FortnoxConfig;
 #tokenMgr: TokenManager;
 #limiter: RateLimiter;

 constructor(cfg: FortnoxConfig) {
  this.#cfg = { baseUrl: 'https://api.fortnox.se/3', ...cfg };
  this.#tokenMgr = new TokenManager(cfg.tenantId);
  this.#limiter = new RateLimiter({ capacityPerMin: 300 }); // Fortnox limit
 }

 // ==== PUBLIC METHODS ====

 async createCustomer(customer: FortnoxCustomer, idempotencyKey?: string) {
  return this.#json<{ Customer: { CustomerNumber: string } }>(
   '/customers',
   { method: 'POST', body: { Customer: customer }, idempotencyKey }
  );
 }

 async updateCustomer(customerNumber: string, customer: FortnoxCustomer) {
  return this.#json<{ Customer: { CustomerNumber: string } }>(
   `/customers/${encodeURIComponent(customerNumber)}`,
   { method: 'PUT', body: { Customer: customer } }
  );
 }

 async getCustomer(customerNumber: string) {
  return this.#json<{ Customer: any }>(
   `/customers/${encodeURIComponent(customerNumber)}`,
   { method: 'GET' }
  );
 }

 async listCustomers(params?: FortnoxListParams) {
  return this.#json<{ Customers: any[] }>(
   `/customers${toQuery(params as any)}`,
   { method: 'GET' }
  );
 }

 async createInvoice(invoice: FortnoxInvoice, idempotencyKey?: string) {
  return this.#json<{ Invoice: { DocumentNumber: number } }>(
   '/invoices',
   { method: 'POST', body: { Invoice: invoice }, idempotencyKey }
  );
 }

 async updateInvoice(documentNumber: number, invoice: FortnoxInvoice) {
  return this.#json<{ Invoice: { DocumentNumber: number } }>(
   `/invoices/${documentNumber}`,
   { method: 'PUT', body: { Invoice: invoice } }
  );
 }

 async getInvoice(documentNumber: number) {
  return this.#json<{ Invoice: any }>(`/invoices/${documentNumber}`, { method: 'GET' });
 }

 async listInvoices(params?: FortnoxListParams) {
  return this.#json<{ Invoices: any[] }>(
   `/invoices${toQuery(params as any)}`,
   { method: 'GET' }
  );
 }

 // ==== CORE REQUEST ====

 async #json<T>(
  path: string,
  opts: {
   method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
   body?: unknown;
   idempotencyKey?: string;
  }
 ): Promise<APIResult<T>> {
  const url = `${this.#cfg.baseUrl}${path}`;

  const doFetch = async (attempt: number): Promise<APIResult<T>> => {
   await this.#limiter.take();

   const token = await this.#tokenMgr.getValidAccessToken('fortnox');

   const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
   };

   if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
   if (opts.idempotencyKey)
    headers['Idempotency-Key'] = opts.idempotencyKey; // Fortnox supports idempotency header in OAuth flow

   const resp = await fetch(url, {
    method: opts.method,
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
   });

   if (resp.status === 401) {
    // Try once to refresh
    if (attempt === 0) {
     await this.#tokenMgr.refreshToken('fortnox');
     throw new APIError(
      'Unauthorized, will retry after refresh',
      401,
      undefined,
      { url, method: opts.method }
     );
    }
   }

   if (!resp.ok) {
    let payload: any = undefined;
    try {
     payload = await resp.json();
    } catch {
     /* ignore */
    }
    throw new APIError(
     payload?.Message || `HTTP ${resp.status}`,
     resp.status,
     payload,
     { url, method: opts.method }
    );
   }

   const data = (await resp.json()) as T;
   return { data, raw: resp };
  };

  try {
   return await retryWithBackoff(
    () => doFetch(0).catch((e) => {
     throw e;
    }),
    {
     attempts: 6,
     baseMs: 300,
     shouldRetry: (e, i) => {
      if (e instanceof APIError) {
       if (e.status === 401 && i === 0) return true;
       if (e.status === 429 || e.status >= 500) return true;
       return false;
      }
      return i < 5;
     },
     onRetry: (e, attempt, delay) =>
      this.#cfg.logger?.(e, { provider: 'fortnox', attempt, delay, path }),
    }
   );
  } catch (err) {
   APIErrorHandler.handleError(err, `Fortnox ${opts.method} ${path}`);
  }
 }
}

