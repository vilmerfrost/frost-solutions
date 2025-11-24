// app/lib/api-error-wrapper.ts
/**
 * Wrapper for API route handlers to prevent crashes from breaking the whole site
 * All errors are caught and returned as safe error responses
 */

import { NextResponse } from 'next/server';

export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  handler: T,
  routeName: string = 'API route'
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return await handler(...args);
    } catch (error: any) {
      // Log error for debugging
      console.error(`[${routeName}] Error:`, error);
      
      // Always return a safe error response - never let errors crash the site
      const errorMessage = error?.message || 'Ett oväntat fel uppstod';
      const errorStack = process.env.NODE_ENV === 'development' ? error?.stack : undefined;
      
      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          ...(errorStack && { stack: errorStack }),
        },
        { status: 500 }
      ) as ReturnType<T>;
    }
  }) as T;
}

/**
 * Safe wrapper for async operations that should never crash
 */
export async function safeExecute<T>(
  operation: () => Promise<T>,
  fallback: T,
  context: string = 'operation'
): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    console.error(`[${context}] Error (using fallback):`, error);
    return fallback;
  }
}

