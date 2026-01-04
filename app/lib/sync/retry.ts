// app/lib/sync/retry.ts

export type RetryOptions = {
 initialDelayMs?: number;  // default 1000
 factor?: number;      // default 2
 maxDelayMs?: number;    // default 60000
 maxAttempts?: number;   // default 7 (inom 5-8 som beslut)
 jitterRatio?: number;   // ±10% jitter => 0.1
 isRetryable?: (e: unknown) => boolean;
};

function defaultIsRetryable(e: unknown): boolean {
 if (!e) return true;

 if (typeof e === 'object' && e !== null && 'status' in e) {
  const status = (e as any).status as number | undefined;
  if (!status) return true;

  // 5xx & 429 retryas; 4xx (ej 429) ses som permanenta
  return status >= 500 || status === 429;
 }

 // fetch/network error utan status => retryable
 const message = e instanceof Error ? e.message : String(e);
 const retryableErrors = ['timeout', 'ECONNRESET', 'ECONNREFUSED', 'network', 'fetch'];
 return retryableErrors.some(err => message.toLowerCase().includes(err.toLowerCase()));
}

export class RetryStrategy {
 private o: Required<RetryOptions>;

 constructor(opts: RetryOptions = {}) {
  this.o = {
   initialDelayMs: opts.initialDelayMs ?? 1000,
   factor: opts.factor ?? 2,
   maxDelayMs: opts.maxDelayMs ?? 60000,
   maxAttempts: opts.maxAttempts ?? 7,
   jitterRatio: opts.jitterRatio ?? 0.1,
   isRetryable: opts.isRetryable ?? defaultIsRetryable,
  };
 }

 private backoff(attempt: number): number {
  const base = Math.min(
   this.o.maxDelayMs,
   this.o.initialDelayMs * Math.pow(this.o.factor, attempt - 1)
  );
  const jitter = base * this.o.jitterRatio * (Math.random() * 2 - 1); // ±ratio
  return Math.max(0, Math.floor(base + jitter));
 }

 async execute<T>(operation: () => Promise<T>): Promise<T> {
  let attempt = 0;
  let lastErr: any = null;

  while (attempt < this.o.maxAttempts) {
   attempt++;

   try {
    return await operation();
   } catch (e: any) {
    lastErr = e;

    if (!this.o.isRetryable(e) || attempt >= this.o.maxAttempts) {
     throw e;
    }

    const delay = this.backoff(attempt);
    console.log(`⏳ Retry ${attempt}/${this.o.maxAttempts} in ${delay}ms`);
    await new Promise((r) => setTimeout(r, delay));
   }
  }

  throw lastErr ?? new Error('Okänt fel i RetryStrategy.');
 }
}

