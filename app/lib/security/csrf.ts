// app/lib/security/csrf.ts
// CSRF protection for state-changing operations

import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const CSRF_COOKIE_NAME = 'csrf_token'
const CSRF_HEADER_NAME = 'x-csrf-token'
const CSRF_TOKEN_LENGTH = 32

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex')
}

/**
 * Get or create CSRF token from cookies (server-side)
 * Call this from server components or API routes
 */
export async function getCsrfToken(): Promise<string> {
  const cookieStore = await cookies()
  let token = cookieStore.get(CSRF_COOKIE_NAME)?.value
  
  if (!token) {
    token = generateCsrfToken()
    // Note: Setting cookie should be done in response headers
  }
  
  return token
}

/**
 * Validate CSRF token from request headers against cookie
 * Returns true if valid, false if invalid
 */
export async function validateCsrfToken(req: NextRequest): Promise<boolean> {
  const cookieStore = await cookies()
  const cookieToken = cookieStore.get(CSRF_COOKIE_NAME)?.value
  const headerToken = req.headers.get(CSRF_HEADER_NAME)
  
  // Both must be present
  if (!cookieToken || !headerToken) {
    return false
  }
  
  // Constant-time comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(cookieToken, 'utf8'),
      Buffer.from(headerToken, 'utf8')
    )
  } catch {
    return false
  }
}

/**
 * Create a response with CSRF token cookie set
 * Use this when returning responses that need CSRF protection
 */
export function setCsrfTokenCookie(response: NextResponse, token?: string): NextResponse {
  const csrfToken = token || generateCsrfToken()
  
  response.cookies.set(CSRF_COOKIE_NAME, csrfToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  })
  
  return response
}

/**
 * Middleware wrapper for CSRF validation on state-changing operations
 * Use this for POST, PUT, DELETE, PATCH routes
 */
export async function withCsrfProtection(
  req: NextRequest,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  // Skip CSRF check for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return handler()
  }
  
  // Skip CSRF check for webhooks (they use their own signature verification)
  const pathname = req.nextUrl.pathname
  if (pathname.includes('/webhook') || pathname.includes('/api/stripe/webhook')) {
    return handler()
  }
  
  // Validate CSRF token
  const isValid = await validateCsrfToken(req)
  
  if (!isValid) {
    return NextResponse.json(
      { error: 'Invalid or missing CSRF token' },
      { status: 403 }
    )
  }
  
  return handler()
}

/**
 * API route to get a new CSRF token
 * Call this from the client to get a token to include in subsequent requests
 */
export async function handleCsrfTokenRequest(): Promise<NextResponse> {
  const token = generateCsrfToken()
  
  const response = NextResponse.json({ 
    success: true,
    // Token is also set in cookie, but we return it for convenience
    token 
  })
  
  return setCsrfTokenCookie(response, token)
}
