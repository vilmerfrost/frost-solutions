// app/lib/integrations/sync/performance/RateLimiter.ts

import { createAdminClient } from '@/utils/supabase/admin';
import type { AccountingProvider } from '@/types/integrations';

export interface RateLimitConfig {
 maxRequests: number;
 windowMs: number;
 provider: AccountingProvider;
}

export class RateLimitError extends Error {
 constructor(
  message: string,
  public resetTime: Date,
  public provider: string
 ) {
  super(message);
  this.name = 'RateLimitError';
 }
}

export class PerformanceRateLimiter {
 private requests: Map<
  string,
  { count: number; resetTime: Date }
 > = new Map();
 private queue: Map<
  string,
  Array<{ resolve: Function; reject: Function }>
 > = new Map();
 private supabase;

 constructor(supabase: ReturnType<typeof createAdminClient>) {
  this.supabase = supabase;
 }

 async execute<T>(
  provider: AccountingProvider,
  operation: string,
  fn: () => Promise<T>
 ): Promise<T> {
  const key = `${provider}:${operation}`;

  await this.waitForSlot(provider, operation);

  try {
   const result = await fn();
   this.recordSuccess(provider, operation);
   return result;
  } catch (error) {
   if (this.isRateLimitError(error)) {
    this.handleRateLimitError(provider, error);
   }
   throw error;
  }
 }

 private async waitForSlot(
  provider: AccountingProvider,
  operation: string
 ): Promise<void> {
  const key = `${provider}:${operation}`;
  const limit = this.getLimitConfig(provider);

  if (!this.requests.has(key)) {
   this.requests.set(key, {
    count: 0,
    resetTime: new Date(Date.now() + limit.windowMs),
   });
  }

  const state = this.requests.get(key)!;

  // Reset if window has passed
  if (Date.now() > state.resetTime.getTime()) {
   state.count = 0;
   state.resetTime = new Date(Date.now() + limit.windowMs);
  }

  // If under limit, proceed immediately
  if (state.count < limit.maxRequests) {
   state.count++;
   return;
  }

  // Otherwise, queue the request
  return new Promise((resolve, reject) => {
   if (!this.queue.has(key)) {
    this.queue.set(key, []);
   }

   this.queue.get(key)!.push({ resolve, reject });

   // Process queue on next reset
   const waitTime = state.resetTime.getTime() - Date.now();
   if (waitTime > 0) {
    setTimeout(() => this.processQueue(key), waitTime);
   }
  });
 }

 private processQueue(key: string): void {
  const queue = this.queue.get(key) || [];
  const state = this.requests.get(key)!;
  const provider = key.split(':')[0] as AccountingProvider;

  // Reset counter and process queued requests
  state.count = 0;
  state.resetTime = new Date(
   Date.now() + this.getLimitConfig(provider).windowMs
  );

  while (
   queue.length > 0 &&
   state.count < this.getLimitConfig(provider).maxRequests
  ) {
   const { resolve } = queue.shift()!;
   state.count++;
   resolve();
  }
 }

 private getLimitConfig(provider: AccountingProvider): RateLimitConfig {
  const configs: Record<AccountingProvider, RateLimitConfig> = {
   fortnox: {
    maxRequests: 300,
    windowMs: 60000,
    provider: 'fortnox',
   },
   visma: {
    maxRequests: 200,
    windowMs: 60000,
    provider: 'visma',
   },
   visma_payroll: {
    maxRequests: 200,
    windowMs: 60000,
    provider: 'visma_payroll',
   },
   visma_eaccounting: {
    maxRequests: 200,
    windowMs: 60000,
    provider: 'visma_eaccounting',
   },
  };
  return configs[provider];
 }

 getRemainingRequests(provider: AccountingProvider, operation: string): number {
  const key = `${provider}:${operation}`;
  const state = this.requests.get(key);
  const limit = this.getLimitConfig(provider);
  return state ? limit.maxRequests - state.count : limit.maxRequests;
 }

 getResetTime(provider: AccountingProvider, operation: string): Date {
  const key = `${provider}:${operation}`;
  const state = this.requests.get(key);
  return (
   state?.resetTime ||
   new Date(Date.now() + this.getLimitConfig(provider).windowMs)
  );
 }

 private isRateLimitError(error: any): boolean {
  return error?.status === 429 || error?.message?.includes('rate limit');
 }

 private handleRateLimitError(provider: AccountingProvider, error: any): void {
  const resetTime = error.resetTime || new Date(Date.now() + 60000);
  throw new RateLimitError(
   `Rate limit exceeded for ${provider}`,
   resetTime,
   provider
  );
 }

 private recordSuccess(provider: AccountingProvider, operation: string): void {
  // Track successful requests for monitoring
  const key = `${provider}:${operation}`;
  // Could store metrics here
 }
}

