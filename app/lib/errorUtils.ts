// app/lib/errorUtils.ts

/**
 * Error utility functions for consistent error handling across the application
 */

/**
 * Extracts a user-friendly error message from various error formats
 * Handles:
 * - String errors
 * - Error objects with .message
 * - Supabase errors with .details, .hint, .code
 * - Empty error objects {}
 * - Null/undefined errors
 */
export function extractErrorMessage(error: any): string {
 // Handle null/undefined
 if (error == null) {
  return 'Okänt fel';
 }

 // Handle string errors
 if (typeof error === 'string') {
  return error;
 }

 // Handle Error objects
 if (error instanceof Error) {
  return error.message || 'Okänt fel';
 }

 // Handle Supabase-style errors
 if (typeof error === 'object') {
  // Prefer message field
  if (error.message) {
   return error.message;
  }

  // Fallback to details
  if (error.details) {
   return error.details;
  }

  // Handle specific error codes
  if (error.code === '42703') {
   return 'Kolumn saknas i databasen';
  }

  // Handle hint
  if (error.hint) {
   return error.hint;
  }

  // Handle code only
  if (error.code) {
   return `Felkod: ${error.code}`;
  }

  // Empty object or unknown format
  return 'Okänt fel';
 }

 // Fallback for unknown types
 return 'Okänt fel';
}

/**
 * Logs an error to the console with context
 * Useful for debugging while keeping user-facing messages clean
 * @param context - Optional context string (e.g., 'API', 'Component')
 * @param error - The error to log
 */
export function logError(context: string, error: any): void;
export function logError(error: any): void;
export function logError(contextOrError: string | any, error?: any): void {
 const message = extractErrorMessage(error ?? contextOrError);
 const context = typeof contextOrError === 'string' ? contextOrError : undefined;
 const prefix = context ? `[${context}]` : '[Error]';
 
 console.error(`${prefix} ${message}`, error ?? contextOrError);
}

