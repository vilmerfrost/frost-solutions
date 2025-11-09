// app/lib/integrations/clients/VismaClient.ts

import { APIError, APIErrorHandler } from '../common/errors';
import { retryWithBackoff } from '../common/retry';
import { RateLimiter } from '../common/rateLimiter';
import { TokenManager } from '../tokenManager';
import type { VismaCustomer, VismaInvoice } from '../mappers';

type VismaConfig = {
  tenantId: string;
  baseUrl?: string;              // ex. 'https://eaccountingapi.azure-api.net/v2' (depending on guide)
  logger?: (e: unknown, ctx: Record<string, any>) => void;
};

type APIResult<T> = { data: T; raw: Response };

function toQuery(params?: Record<string, string | number | undefined>) {
  const q = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null) q.set(k, String(v));
  });
  const s = q.toString();
  return s ? `?${s}` : '';
}

export class VismaAPIClient {
  #cfg: VismaConfig;
  #tokenMgr: TokenManager;
  #limiter: RateLimiter;

  constructor(cfg: VismaConfig) {
    this.#cfg = {
      baseUrl: 'https://eaccountingapi.vismaonline.com/v2',
      ...cfg,
    };
    this.#tokenMgr = new TokenManager(cfg.tenantId);
    this.#limiter = new RateLimiter({ capacityPerMin: 100 }); // Set according to guide/experience
  }

  // Customers
  async createCustomer(customer: VismaCustomer, idempotencyKey?: string) {
    return this.#json<any>('/customers', {
      method: 'POST',
      body: customer,
      idempotencyKey,
    });
  }

  async updateCustomer(customerId: string, customer: VismaCustomer) {
    return this.#json<any>(`/customers/${encodeURIComponent(customerId)}`, {
      method: 'PUT',
      body: customer,
    });
  }

  async getCustomer(customerId: string) {
    return this.#json<any>(
      `/customers/${encodeURIComponent(customerId)}`,
      { method: 'GET' }
    );
  }

  async listCustomers(params?: { page?: number; pageSize?: number }) {
    return this.#json<any>(
      `/customers${toQuery({ page: params?.page, pageSize: params?.pageSize })}`,
      { method: 'GET' }
    );
  }

  // Invoices
  async createInvoice(invoice: VismaInvoice, idempotencyKey?: string) {
    return this.#json<any>('/invoices', {
      method: 'POST',
      body: invoice,
      idempotencyKey,
    });
  }

  async updateInvoice(invoiceId: string, invoice: VismaInvoice) {
    return this.#json<any>(`/invoices/${encodeURIComponent(invoiceId)}`, {
      method: 'PUT',
      body: invoice,
    });
  }

  async getInvoice(invoiceId: string) {
    return this.#json<any>(`/invoices/${encodeURIComponent(invoiceId)}`, {
      method: 'GET',
    });
  }

  async listInvoices(params?: {
    page?: number;
    pageSize?: number;
    status?: string;
  }) {
    return this.#json<any>(
      `/invoices${toQuery({
        page: params?.page,
        pageSize: params?.pageSize,
        status: params?.status,
      })}`,
      { method: 'GET' }
    );
  }

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

      const token = await this.#tokenMgr.getValidAccessToken('visma');

      const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      };

      if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
      if (opts.idempotencyKey)
        headers['X-Idempotency-Key'] = opts.idempotencyKey; // Visma: use own idempotency header if supported

      const resp = await fetch(url, {
        method: opts.method,
        headers,
        body: opts.body ? JSON.stringify(opts.body) : undefined,
      });

      if (resp.status === 401) {
        if (attempt === 0) {
          await this.#tokenMgr.refreshToken('visma');
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
          payload?.message || `HTTP ${resp.status}`,
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
        () => doFetch(0),
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
            this.#cfg.logger?.(e, { provider: 'visma', attempt, delay, path }),
        }
      );
    } catch (err) {
      APIErrorHandler.handleError(err, `Visma ${opts.method} ${path}`);
    }
  }
}

