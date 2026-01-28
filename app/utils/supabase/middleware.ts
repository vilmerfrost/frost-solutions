// app/utils/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  // 1. Skapa initial respons
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
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
          cookiesToSet.forEach(({ name, value }: { name: string; value: string }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options?: Record<string, unknown> }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 2. Uppdatera session och hämta användare
  const { data: { user } } = await supabase.auth.getUser()

  // 3. SKYDDSLOGIK (Security)
  // Eftersom du kör basePath: '/app', är pathname relativ till den.
  const path = request.nextUrl.pathname

  // Lista på publika rutter som inte kräver inloggning
  const isPublicPath = 
    path.startsWith('/login') || 
    path.startsWith('/signup') || 
    path.startsWith('/auth') || 
    path.startsWith('/error')

  // A. Oinloggad användare på skyddad sida -> Redirect till Login
  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // B. Inloggad användare på Login-sidan -> Redirect till Dashboard
  if (user && path.startsWith('/login')) {
    const url = request.nextUrl.clone()
    url.pathname = '/' // Detta blir /app/ (Dashboard)
    return NextResponse.redirect(url)
  }

  // C. Inloggad användare på Signup-sidan -> Redirect till Dashboard
  if (user && path.startsWith('/signup')) {
    const url = request.nextUrl.clone()
    url.pathname = '/' // Detta blir /app/ (Dashboard)
    return NextResponse.redirect(url)
  }

  return response
}
