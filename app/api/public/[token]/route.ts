import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import { checkRateLimit, getClientIP } from '@/lib/security'

/**
 * GET /api/public/[token]
 * Hämtar resurs via publik token (ingen auth krävs)
 */
export async function GET(
 req: Request,
 { params }: { params: Promise<{ token: string }> }
) {
 try {
  // Rate limit: 20 requests per minute per IP to prevent brute-force token guessing
  const clientIP = getClientIP(req)
  const rateLimitResult = checkRateLimit(`public-token:${clientIP}`, 20, 60 * 1000)
  if (!rateLimitResult.allowed) {
   return NextResponse.json(
    { error: 'Too many requests. Please try again later.' },
    { 
     status: 429,
     headers: { 'Retry-After': String(rateLimitResult.retryAfter || 60) }
    }
   )
  }

  const { token } = await params
  const { searchParams } = new URL(req.url)
  const password = searchParams.get('password')

  const adminSupabase = createAdminClient(
   process.env.NEXT_PUBLIC_SUPABASE_URL!,
   process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Hämta public link
  const { data: publicLink, error: linkError } = await adminSupabase
   .from('public_links')
   .select('*')
   .eq('access_token', token)
   .eq('active', true)
   .single()

  if (linkError || !publicLink) {
   return NextResponse.json(
    { error: 'Link not found or inactive' },
    { status: 404 }
   )
  }

  // Kontrollera expiration
  if (publicLink.expires_at && new Date(publicLink.expires_at) < new Date()) {
   return NextResponse.json(
    { error: 'Link has expired' },
    { status: 400 }
   )
  }

  // Kontrollera max views
  if (publicLink.max_views && publicLink.view_count >= publicLink.max_views) {
   return NextResponse.json(
    { error: 'Maximum views exceeded' },
    { status: 403 }
   )
  }

  // Kontrollera lösenord om det finns
  if (publicLink.password_hash) {
   if (!password) {
    return NextResponse.json(
     { error: 'Password required' },
     { status: 401 }
    )
   }

   const isValid = await bcrypt.compare(password, publicLink.password_hash)
   if (!isValid) {
    return NextResponse.json(
     { error: 'Invalid password' },
     { status: 401 }
    )
   }
  }

  // Hämta resurs baserat på resource_type
  const tableMap: Record<string, string> = {
   quote: 'quotes',
   invoice: 'invoices',
   ata: 'rot_applications',
   project: 'projects',
   rot_application: 'rot_applications',
  }

  const tableName = tableMap[publicLink.resource_type]
  if (!tableName) {
   return NextResponse.json(
    { error: 'Invalid resource type' },
    { status: 400 }
   )
  }

  const { data: resource, error: resourceError } = await adminSupabase
   .from(tableName)
   .select('*')
   .eq('id', publicLink.resource_id)
   .single()

  if (resourceError || !resource) {
   return NextResponse.json(
    { error: 'Resource not found' },
    { status: 404 }
   )
  }

  // Logga view event
  const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null
  const userAgent = req.headers.get('user-agent') || null

  await adminSupabase
   .from('public_link_events')
   .insert({
    public_link_id: publicLink.id,
    event_type: 'viewed',
    ip_address: ipAddress,
    user_agent: userAgent,
   })

  return NextResponse.json({
   resource_type: publicLink.resource_type,
   resource,
   link_info: {
    expires_at: publicLink.expires_at,
    view_count: publicLink.view_count + 1,
    max_views: publicLink.max_views,
   },
  })
 } catch (error: any) {
  console.error('Error in GET /api/public/[token]:', error)
  return NextResponse.json(
   { error: 'Internal server error', details: error.message },
   { status: 500 }
  )
 }
}

