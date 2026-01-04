// app/lib/security.ts

/**
 * Security utilities for input validation, rate limiting, and sanitization
 */

/**
 * Rate limit storage (in-memory, simple implementation)
 * In production, use Redis or similar
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Checks if a request should be rate limited
 * @param identifier Unique identifier (IP address, user ID, etc.)
 * @param maxRequests Maximum requests allowed
 * @param windowMs Time window in milliseconds
 * @returns Object with allowed status and retryAfter seconds
 */
export function checkRateLimit(
 identifier: string,
 maxRequests: number = 100,
 windowMs: number = 60 * 1000 // 1 minute default
): { allowed: boolean; retryAfter?: number } {
 const now = Date.now();
 const record = rateLimitStore.get(identifier);

 if (!record || now > record.resetAt) {
  // Create new record
  rateLimitStore.set(identifier, {
   count: 1,
   resetAt: now + windowMs,
  });
  return { allowed: true };
 }

 if (record.count >= maxRequests) {
  // Rate limited - calculate retry after seconds
  const retryAfter = Math.ceil((record.resetAt - now) / 1000);
  return { allowed: false, retryAfter };
 }

 // Increment count
 record.count++;
 return { allowed: true };
}

/**
 * Gets client IP address from request
 * @param req Request object (Next.js Request or similar)
 * @returns IP address string
 */
export function getClientIP(req: Request | any): string {
 // Try various headers that might contain the real IP
 const forwarded = req.headers?.get('x-forwarded-for');
 if (forwarded) {
  return forwarded.split(',')[0].trim();
 }

 const realIP = req.headers?.get('x-real-ip');
 if (realIP) {
  return realIP;
 }

 // Fallback
 return req.ip || 'unknown';
}

/**
 * Sanitizes a string by removing potentially dangerous characters
 * @param input Input string to sanitize
 * @param maxLength Maximum length (default: 10000)
 * @returns Sanitized string
 */
export function sanitizeString(input: string, maxLength: number = 10000): string {
 if (!input || typeof input !== 'string') {
  return '';
 }

 // Truncate if too long
 let sanitized = input.slice(0, maxLength);

 // Remove null bytes and other control characters (except newlines and tabs)
 sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');

 return sanitized;
}

/**
 * Validates email format
 * @param email Email address to validate
 * @returns true if valid email format
 */
export function isValidEmail(email: string): boolean {
 if (!email || typeof email !== 'string') {
  return false;
 }

 // Simple email regex (RFC 5322 compliant)
 const emailRegex =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
 return emailRegex.test(email);
}

/**
 * Validates UUID format
 * @param uuid UUID string to validate
 * @returns true if valid UUID format
 */
export function isValidUUID(uuid: string): boolean {
 if (!uuid || typeof uuid !== 'string') {
  return false;
 }

 // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
 return uuidRegex.test(uuid);
}

/**
 * Clears rate limit records (useful for testing or cleanup)
 */
export function clearRateLimitStore(): void {
 rateLimitStore.clear();
}

