// app/lib/utils/retry.ts
import { createLogger } from './logger';

const logger = createLogger('RetryUtil');

export interface RetryOptions {
 maxAttempts: number;
 initialDelay: number;
 maxDelay: number;
 backoffMultiplier: number;
 retryableErrors?: (error: unknown) => boolean;
}

const DEFAULT_OPTIONS: RetryOptions = {
 maxAttempts: 3,
 initialDelay: 1000,
 maxDelay: 30000,
 backoffMultiplier: 2,
 retryableErrors: (error: unknown) => {
  // Retry on network errors and 5xx status codes
  if (error instanceof Error) {
   return (
    error.message.includes('network') ||
    error.message.includes('timeout') ||
    error.message.includes('ECONNREFUSED')
   );
  }
  return false;
 },
};

/**
 * Retry a function with exponential backoff
 */
export async function withRetry<T>(
 fn: () => Promise<T>,
 options: Partial<RetryOptions> = {}
): Promise<T> {
 const opts = { ...DEFAULT_OPTIONS, ...options };
 let attempt = 0;
 let delay = opts.initialDelay;

 while (true) {
  attempt++;

  try {
   return await fn();
  } catch (error) {
   const isRetryable = opts.retryableErrors?.(error) ?? false;
   const hasAttemptsLeft = attempt < opts.maxAttempts;

   if (!isRetryable || !hasAttemptsLeft) {
    logger.error('Retry exhausted', error, {
     attempt,
     maxAttempts: opts.maxAttempts,
     isRetryable,
    });
    throw error;
   }

   logger.warn('Retry attempt failed', {
    attempt,
    maxAttempts: opts.maxAttempts,
    nextDelay: delay,
   });

   // Wait with exponential backoff
   await new Promise((resolve) => setTimeout(resolve, delay));

   // Calculate next delay
   delay = Math.min(delay * opts.backoffMultiplier, opts.maxDelay);
  }
 }
}

