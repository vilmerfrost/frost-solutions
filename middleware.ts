import type { NextRequest } from 'next/server'
import { updateSession } from './app/utils/supabase/middleware' // <= relativ import till src/

/**
 * Middleware for session management.
 * 
 * IMPORTANT: With basePath: '/app' configured in next.config.mjs:
 * - The pathname in middleware is ALREADY stripped of '/app'
 * - '/' in middleware means '/app' in the browser
 * - '/dashboard' in middleware means '/app/dashboard' in the browser
 * - Matcher patterns should NOT include '/app' prefix
 */
export async function middleware(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  // Note: Matcher patterns work with pathnames AFTER basePath is stripped
  // So '/' matches '/app', '/dashboard' matches '/app/dashboard', etc.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
