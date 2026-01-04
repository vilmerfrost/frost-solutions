// app/lib/integrations/common/retry.ts

import { APIError } from './errors';

export type RetryOpts = {
 attempts?: number;     // default 6
 baseMs?: number;      // default 250
 maxMs?: number;      // default 8000
 jitter?: number;      // 0..1, default 0.2
 shouldRetry?: (e: unknown, attempt: number) => boolean;
 onRetry?: (e: unknown, attempt: number, delayMs: number) => void;
};

export async function retryWithBackoff<T>(
 fn: () => Promise<T>,
 opts: RetryOpts = {}
): Promise<T> {
 const attempts = opts.attempts ?? 6;
 const baseMs = opts.baseMs ?? 250;
 const maxMs = opts.maxMs ?? 8000;
 const jitter = opts.jitter ?? 0.2;

 let lastError: unknown;

 for (let i = 0; i < attempts; i++) {
  try {
   return await fn();
  } catch (e) {
   lastError = e;

   const shouldRetry = opts.shouldRetry
    ? opts.shouldRetry(e, i)
    : e instanceof APIError
     ? e.status === 429 || e.status === 408 || e.status === 409 || e.status >= 500
     : true;

   if (!shouldRetry || i === attempts - 1) break;

   const exp = Math.min(maxMs, baseMs * Math.pow(2, i));
   const jitterDelta = exp * jitter * (Math.random() * 2 - 1);
   const delay = Math.max(0, Math.floor(exp + jitterDelta));

   opts.onRetry?.(e, i + 1, delay);

   await new Promise((res) => setTimeout(res, delay));
  }
 }

 throw lastError;
}

