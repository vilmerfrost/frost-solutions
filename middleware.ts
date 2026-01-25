import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Get session
  const { data: { session }, error } = await supabase.auth.getSession()

  const pathname = request.nextUrl.pathname

  // Public routes (accessible without auth)
  const publicRoutes = [
    '/',
    '/features',
    '/pricing',
    '/about',
    '/contact',
    '/blog',
    '/security',
    '/developers',
    '/changelog',
    '/vs-bygglet',
    '/signup',
    '/login',
    '/auth/callback',
    '/api/stripe/webhook',
    '/terms',
    '/privacy',
    '/dpa',
    '/sla',
  ]

  // Protected routes (require auth)
  const protectedRoutes = [
    '/dashboard',
    '/time-tracking',
    '/projects',
    '/invoices',
    '/employees',
    '/customers',
    '/settings',
    '/onboarding',
    '/payment-required',
    '/checkout',
  ]

  const isPublic = publicRoutes.some(route => pathname === route || pathname.startsWith(route))
  const isProtected = protectedRoutes.some(route => pathname.startsWith(route))

  // If session error, clear and redirect
  if (error && isProtected) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Protected route without session → redirect to login
  if (isProtected && !session) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Auth pages with session → redirect to dashboard
  if (session && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}