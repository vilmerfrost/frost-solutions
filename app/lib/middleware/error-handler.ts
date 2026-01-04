// app/lib/middleware/error-handler.ts
import { NextResponse } from 'next/server';
import { AppError } from '@/lib/utils/errors';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('ErrorHandler');

/**
 * Global error handler for API routes
 */
export function withErrorHandler<T extends (...args: any[]) => Promise<any>>(
 handler: T
) {
 return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
  try {
   return await handler(...args);
  } catch (error) {
   // Log error
   await logErrorToSupabase(error, {
    route: args[0]?.url || 'unknown',
    tenantId: args[0]?.headers?.get('x-tenant-id'),
   });

   // Return safe error response
   if (error instanceof AppError) {
    return NextResponse.json(
     {
      error: {
       code: error.code,
       message: error.message,
       ...(process.env.NODE_ENV === 'development' && {
        details: error.context,
       }),
      },
     },
     { status: error.statusCode }
    ) as ReturnType<T>;
   }

   // Generic server error
   return NextResponse.json(
    {
     error: {
      code: 'INTERNAL_SERVER_ERROR',
      message:
       process.env.NODE_ENV === 'development'
        ? (error as Error).message
        : 'An unexpected error occurred',
     },
    },
    { status: 500 }
   ) as ReturnType<T>;
  }
 };
}

/**
 * Log error to Supabase (or logging service)
 */
async function logErrorToSupabase(
 error: unknown,
 context: Record<string, unknown>
): Promise<void> {
 try {
  logger.error('API Error', error, context);
  // TODO: Send to Supabase logging table or external service
 } catch (logError) {
  logger.error('Failed to log error', logError);
 }
}

